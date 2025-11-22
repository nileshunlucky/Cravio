"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  UTCTimestamp,
  CrosshairMode,
  LineStyle,
} from "lightweight-charts";
import { motion, AnimatePresence } from "framer-motion";
import { Search, TrendingUp, TrendingDown, Loader2, DollarSign} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Candle = {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
};



// Types
type BinanceExchangeInfo = { symbols: { symbol: string }[] };
type Kline = (number | string)[];
type Candle = {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
};

type PredictionData = {
  Prediction?: string;
  Probability?: number;
  StopLoss?: number;
  Target?: number;
};

export default function AppleStyleTradingChart() {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const targetLineRef = useRef<ISeriesApi<"Line"> | null>(null);
  const stopLossLineRef = useRef<ISeriesApi<"Line"> | null>(null);
  const router = useRouter();

  // State
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [interval, setInterval] = useState("1m");
  const [search, setSearch] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [previousPrice, setPreviousPrice] = useState<number | null>(null);
  const [amount, setAmount] = useState<string>("10");
  const [symbolsList, setSymbolsList] = useState<string[]>([]);
  const [prediction, setPrediction] = useState<PredictionData>({});
  const [showPrediction, setShowPrediction] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderPlacing, setOrderPlacing] = useState(false);
  
  // NEW: Order tracking state
  const [orderPlaced, setOrderPlaced] = useState(false);

  const { user } = useUser();
  const email = user?.emailAddresses?.[0]?.emailAddress || "";

  // 1. Fetch Symbols
  useEffect(() => {
    async function fetchSymbols() {
      try {
        const res = await fetch("https://api.binance.com/api/v3/exchangeInfo");
        const data = (await res.json()) as BinanceExchangeInfo;
        const usdtPairs = data.symbols
          .filter((s) => s.symbol.endsWith("USDT"))
          .map((s) => s.symbol);
        setSymbolsList(usdtPairs);
      } catch (e) {
        console.error("Failed to fetch symbols", e);
      }
    }
    fetchSymbols();
  }, []);

  // 2. Initialize Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#a1a1aa",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.05)" },
        horzLines: { color: "rgba(255, 255, 255, 0.05)" },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      timeScale: {
        borderColor: "rgba(255, 255, 255, 0.1)",
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: "rgba(255, 255, 255, 0.1)",
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          width: 1,
          color: "rgba(255, 255, 255, 0.4)",
          style: 3,
        },
        horzLine: {
          width: 1,
          color: "rgba(255, 255, 255, 0.4)",
          style: 3,
        },
      },
    });

    const series = chart.addCandlestickSeries({
      upColor: "#34d399",
      borderUpColor: "#34d399",
      wickUpColor: "#34d399",
      downColor: "#f87171",
      borderDownColor: "#f87171",
      wickDownColor: "#f87171",
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0 || !entries[0].target) return;
      const newRect = entries[0].contentRect;
      chart.applyOptions({ width: newRect.width, height: newRect.height });
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, []);

  // Helper function to draw TP/SL lines
  const drawPriceLevels = (target: number, stopLoss: number, timeData: UTCTimestamp[]) => {
    if (!chartRef.current || timeData.length === 0) return;

    // Remove existing lines
    if (targetLineRef.current) {
      chartRef.current.removeSeries(targetLineRef.current);
    }
    if (stopLossLineRef.current) {
      chartRef.current.removeSeries(stopLossLineRef.current);
    }

    // Create target line (green)
    const targetLine = chartRef.current.addLineSeries({
      color: "#10b981",
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      title: "Target",
      priceLineVisible: true,
      lastValueVisible: true,
    });

    // Create stop loss line (red)
    const stopLossLine = chartRef.current.addLineSeries({
      color: "#ef4444",
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      title: "Stop Loss",
      priceLineVisible: true,
      lastValueVisible: true,
    });

    // Set data for both lines (horizontal lines across time)
    const targetData = timeData.map(time => ({
      time,
      value: target,
    }));

    const stopLossData = timeData.map(time => ({
      time,
      value: stopLoss,
    }));

    targetLine.setData(targetData);
    stopLossLine.setData(stopLossData);

    targetLineRef.current = targetLine;
    stopLossLineRef.current = stopLossLine;
  };

  // Helper to update lines with new candle
  const updatePriceLevels = (newTime: UTCTimestamp) => {
    if (!prediction.Target || !prediction.StopLoss) return;

    if (targetLineRef.current) {
      targetLineRef.current.update({
        time: newTime,
        value: prediction.Target,
      });
    }

    if (stopLossLineRef.current) {
      stopLossLineRef.current.update({
        time: newTime,
        value: prediction.StopLoss,
      });
    }
  };

  // Helper to remove price level lines
  const removePriceLevels = () => {
    if (chartRef.current) {
      if (targetLineRef.current) {
        chartRef.current.removeSeries(targetLineRef.current);
        targetLineRef.current = null;
      }
      if (stopLossLineRef.current) {
        chartRef.current.removeSeries(stopLossLineRef.current);
        stopLossLineRef.current = null;
      }
    }
  };

  // Helper to reset everything to step 1
  const resetToInitialState = () => {
    setShowPrediction(false);
    setPrediction({});
    setOrderPlaced(false);
    removePriceLevels();
  };

  // NEW: Check if target or stop loss is hit
  const checkPriceTargets = (price: number) => {
    if (!orderPlaced || !prediction.Target || !prediction.StopLoss) return;

    const target = prediction.Target;
    const stopLoss = prediction.StopLoss;

    // Check if target is hit (profit)
    if (price >= target) {
      toast.success("✅ Target Hit - Profit!", {
        description: `Order closed at $${price.toFixed(2)}`,
      });
      resetToInitialState();
    }
    // Check if stop loss is hit (loss)
    else if (price <= stopLoss) {
      toast.error("❌ Stop Loss Hit - Order Failed", {
        description: `Order closed at $${price.toFixed(2)}`,
      });
      resetToInitialState();
    }
  };

  // 3. Fetch Data & WebSocket
  useEffect(() => {
    if (!symbol || !interval || !seriesRef.current) return;

    let ws: WebSocket | null = null;
    let latestTime = 0;
    let timeDataCache: UTCTimestamp[] = [];

    async function fetchData() {
      try {
        const res = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=200`
        );
        const json = (await res.json()) as Kline[];

        const formatted: Candle[] = json.map((d) => ({
          time: Math.floor(Number(d[0]) / 1000) as UTCTimestamp,
          open: +d[1],
          high: +d[2],
          low: +d[3],
          close: +d[4],
        }));

        seriesRef.current?.setData(formatted as unknown as CandlestickData[]);
        
        if (formatted.length > 0) {
          latestTime = formatted[formatted.length - 1].time as number;
          const close = formatted[formatted.length - 1].close;
          setPreviousPrice((prev) => prev === null ? close : currentPrice);
          setCurrentPrice(close);

          // Cache time data for price levels
          timeDataCache = formatted.map(c => c.time);
          
          // Redraw lines if order is placed
          if (orderPlaced && prediction.Target && prediction.StopLoss) {
            drawPriceLevels(prediction.Target, prediction.StopLoss, timeDataCache);
          }
        }

        ws = new WebSocket(
          `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`
        );

        ws.onmessage = (event: MessageEvent) => {
          const message = JSON.parse(event.data);
          const k = message.k;
          if (!k) return;
          
          const pointTime = Math.floor(Number(k.t) / 1000) as UTCTimestamp;
          if (pointTime < latestTime) return;
          latestTime = pointTime;

          const point: Candle = {
            time: pointTime,
            open: +k.o,
            high: +k.h,
            low: +k.l,
            close: +k.c,
          };

          seriesRef.current?.update(point);
          setPreviousPrice(currentPrice);
          setCurrentPrice(point.close);

          // NEW: Check if price hits target or stop loss
          checkPriceTargets(point.close);

          // Update price level lines if order is placed
          if (orderPlaced) {
            updatePriceLevels(pointTime);
          }
        };
      } catch (e) {
        console.error("Error fetching data", e);
        toast.error("Failed to load chart data");
      }
    }

    fetchData();
    return () => {
          if (ws) {
    ws.close();
  }
        };
  }, [symbol, interval, orderPlaced, prediction.Target, prediction.StopLoss]);

  // 4. Draw price levels ONLY when order is placed
  useEffect(() => {
    if (orderPlaced && prediction.Target && prediction.StopLoss && seriesRef.current) {
      // Get current time data from chart
      const data = seriesRef.current.data();
      if (data && data.length > 0) {
        const dataTyped = data as Candle[];
const times = dataTyped.map((d) => d.time);

        drawPriceLevels(prediction.Target, prediction.StopLoss, times);
      }
    } else if (!orderPlaced) {
      removePriceLevels();
    }
  }, [orderPlaced, prediction.Target, prediction.StopLoss]);

  // 5. Prediction Logic
  const handlePredict = async () => {
    if (!email) {
      toast.error("Please sign in to use predictions");
      return;
    }

    setLoading(true);
    try {
      const form = new FormData();
      form.append("email", email);
      form.append(
        "data",
        JSON.stringify({
          symbol,
          interval,
          currentPrice,
        })
      );

      const res = await fetch("https://cravio-ai.onrender.com/api/vibe-prediction", {
        method: "POST",
        body: form,
      });

      const data = await res.json();
      
      if (res.ok) {
        setPrediction(data.data);
        setShowPrediction(true);
        toast.success("Prediction generated successfully!");
      } else {
        toast.error(data.detail || "Prediction failed");
      }
    } catch (e) {
      console.error("Error during prediction:", e);
      toast.error("Network error during prediction");
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!email) {
      toast.error("Please sign in to place orders");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setOrderPlacing(true);
    try {
      const form = new FormData();
      form.append("email", email);
      form.append(
        "data",
        JSON.stringify({
          currentPrice,
          symbol,
          amount: amountNum,
          prediction: prediction.Prediction,
          target: prediction.Target,
          stopLoss: prediction.StopLoss,
        })
      );

      const res = await fetch("https://cravio-ai.onrender.com/api/vibe-place-order", {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (res.status === 400){
        toast.error("Add Brokrage")
        router.push("/admin/brokrage");
      }
      
      if (res.ok) {
        toast.success("Order placed successfully!");
        // NEW: Set order as placed
        setOrderPlaced(true);
      } else {
        toast.error(data.detail || "Order placement failed");
      }
    } catch (e) {
      console.error("Error placing order:", e);
      toast.error("Network error during order placement");
    } finally {
      setOrderPlacing(false);
    }
  };

  const handleCancel = () => {
    resetToInitialState();
    toast.info("Order cancelled");
  };

  const filteredSymbols = symbolsList.filter((s) =>
    s.toLowerCase().includes(search.toLowerCase())
  );

  const priceColor = !currentPrice || !previousPrice 
    ? "text-white" 
    : currentPrice >= previousPrice 
      ? "text-emerald-400" 
      : "text-red-400";

  const priceChange = currentPrice && previousPrice 
    ? ((currentPrice - previousPrice) / previousPrice) * 100 
    : 0;

  // UI is locked when order is placed
  const isLocked = orderPlaced;

  return (
    <div className="flex flex-col min-h-screen w-full bg-zinc-950 text-zinc-100 overflow-hidden font-sans selection:bg-blue-500/30 ml-0 md:ml-20">
      
      {/* HEADER */}
      <header className="flex-none px-4 py-4 flex flex-col gap-4 z-30 bg-zinc-950/80 backdrop-blur-md border-b border-white/5">
        
        {/* Top Row: Symbol & Price */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {symbol.replace("USDT", "")}
              <span className="text-zinc-500 text-lg font-normal ml-1">/ USDT</span>
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-sm font-mono ${priceColor}`}>
                {currentPrice ? `$${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "Loading..."}
              </span>
              {priceChange !== 0 && (
                <span className={`text-xs flex items-center gap-1 ${priceChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {priceChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(priceChange).toFixed(2)}%
                </span>
              )}
            </div>
          </div>

          {/* Interval Selector */}
          <div className="flex bg-zinc-900 rounded-full p-1 border border-white/5">
            {["1m", "15m", "1h", "4h"].map((t) => (
              <button
                key={t}
                onClick={() => {
                  if (!isLocked) {
                    setInterval(t);
                    resetToInitialState();
                  }
                }}
                disabled={isLocked}
                className={`px-3 py-1 text-xs rounded-full transition-all ${
                  interval === t 
                    ? "bg-white text-black font-medium shadow-sm" 
                    : "text-zinc-400 hover:text-white"
                } ${isLocked ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text"
              placeholder="Search Asset..."
              value={search}
              onClick={() => !isLocked && setIsSearchOpen(true)}
              onChange={(e) => {
                if (!isLocked) {
                  setSearch(e.target.value);
                  setIsSearchOpen(true);
                }
              }}
              disabled={isLocked}
              className={`w-full bg-zinc-900/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all ${isLocked ? "opacity-50 cursor-not-allowed" : ""}`}
            />
          </div>

          {/* Dropdown Results */}
          <AnimatePresence>
            {isSearchOpen && search && !isLocked && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl max-h-60 overflow-y-auto z-50 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent"
              >
                {filteredSymbols.slice(0, 20).map((s) => (
                  <div
                    key={s}
                    onClick={() => {
                      setSymbol(s);
                      setIsSearchOpen(false);
                      setSearch("");
                      resetToInitialState();
                    }}
                    className="px-4 py-3 text-sm text-zinc-300 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0 flex justify-between transition-colors"
                  >
                    <span className="font-medium">{s.replace("USDT", "")}</span>
                    <span className="text-zinc-600 text-xs">USDT</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          
          {isSearchOpen && (
            <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsSearchOpen(false)} />
          )}
        </div>

        {/* Lock Indicator */}
        {isLocked && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg px-3 py-2 text-xs text-blue-400">
            🔒 Order Active - UI Locked
          </div>
        )}
      </header>

      {/* CHART AREA */}
      <main className="flex-1 relative w-full h-full z-0">
        <div ref={chartContainerRef} className="absolute inset-0 w-full h-full" />
        
        {/* Price Level Labels - ONLY shown when order is placed */}
        {orderPlaced && prediction.Target && prediction.StopLoss && (
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
            <div className="bg-green-500/20 backdrop-blur-sm border border-green-500/30 px-3 py-2 rounded-lg">
              <div className="text-xs text-green-400 font-medium">Target</div>
              <div className="text-sm text-white font-mono">
                ${prediction.Target.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="bg-red-500/20 backdrop-blur-sm border border-red-500/30 px-3 py-2 rounded-lg">
              <div className="text-xs text-red-400 font-medium">Stop Loss</div>
              <div className="text-sm text-white font-mono">
                ${prediction.StopLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* PREDICTION/ORDER SECTION */}
      <div className="flex-none bg-zinc-950/80 backdrop-blur-md border-t border-white/5">
        <AnimatePresence mode="wait">
          {/* PHASE 1: Before Prediction */}
          {!showPrediction && (
            <motion.div
              key="predict-button"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-4"
            >
              <Button
                onClick={handlePredict}
                disabled={loading || !email}
                className="w-full py-6 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  </>
                ) : (
                  "Predict"
                )}
              </Button>
            </motion.div>
          )}

          {/* PHASE 2: After Prediction, Before Order */}
          {showPrediction && (
            <motion.div
              key="prediction-panel"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-4 flex flex-col gap-3"
            >
              {/* Probability & Amount */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 bg-zinc-900/50 rounded-xl p-4 border border-white/10">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-zinc-400 uppercase tracking-wide">Win Probability</span>
                    <span className="text-lg font-bold text-white">{prediction.Probability}%</span>
                  </div>
                  <Progress value={Number(prediction.Probability)} className="h-2" />
                </div>

                <div className="sm:w-1/3 bg-zinc-900/50 rounded-xl p-4 border border-white/10">
                  <label className="text-xs text-zinc-400 uppercase tracking-wide block mb-2">Amount (USDT)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="number"
                      placeholder="10"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min="1"
                      step="0.01"
                      className="w-full bg-zinc-800/50 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Stop Loss & Target */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-red-950/50 via-red-900/30 to-transparent p-4 rounded-xl border border-red-500/20">
                  <p className="text-xs text-red-400/80 uppercase tracking-wide mb-1">Stop Loss</p>
                  <p className="text-lg font-bold text-red-400">
                    ${prediction.StopLoss?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {currentPrice && prediction.StopLoss 
                      ? `${(((prediction.StopLoss - currentPrice) / currentPrice) * 100).toFixed(2)}%`
                      : "-"}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-green-950/50 via-green-900/30 to-transparent p-4 rounded-xl border border-green-500/20">
                  <p className="text-xs text-green-400/80 uppercase tracking-wide mb-1">Target</p>
                  <p className="text-lg font-bold text-green-400">
                    ${prediction.Target?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {currentPrice && prediction.Target 
                      ? `+${(((prediction.Target - currentPrice) / currentPrice) * 100).toFixed(2)}%`
                      : "-"}
                  </p>
                </div>
              </div>

              {/* Place Order Button */}
              <Button
                onClick={handlePlaceOrder}
                disabled={orderPlacing}
                className="w-full bg-gradient-to-r from-green-600 to-green-800 hover:from-green-700 hover:to-green-900 text-white font-bold py-6 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg"
              >
                {orderPlacing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  </>
                ) : (
                  "BUY"
                )}
              </Button>

              {/* Cancel Prediction */}
              <button
                onClick={() => {
                  setShowPrediction(false);
                  setPrediction({});
                }}
                className="text-sm text-zinc-400 hover:text-white transition-colors py-2 flex items-center justify-center gap-2"
              >
                Cancel Prediction
              </button>
            </motion.div>
          )}

          {/* PHASE 3: After Order Placed */}
          {orderPlaced && (
            <motion.div
              key="order-active"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-4"
            >
              <button
                onClick={handleCancel}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-6 rounded-xl transition-all text-lg flex items-center justify-center gap-2"
              >
                Close Order
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}