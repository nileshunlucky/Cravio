"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  LineData,
  UTCTimestamp,
  CrosshairMode,
} from "lightweight-charts";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown } from "lucide-react"; // Assuming you have lucide-react, if not, generic icons work
import { Button } from "@/components/ui/button";

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

export default function AppleStyleTradingChart() {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const indicatorRef = useRef<ISeriesApi<"Line"> | null>(null);

  // State
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [interval, setInterval] = useState("1m");
  const [search, setSearch] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [previousPrice, setPreviousPrice] = useState<number | null>(null);
  const [symbolsList, setSymbolsList] = useState<string[]>([]);

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
        textColor: "#a1a1aa", // zinc-400
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
          style: 3, // Dashed
        },
        horzLine: {
          width: 1,
          color: "rgba(255, 255, 255, 0.4)",
          style: 3,
        },
      },
    });

    const series = chart.addCandlestickSeries({
      upColor: "#34d399", // Emerald-400
      borderUpColor: "#34d399",
      wickUpColor: "#34d399",
      downColor: "#f87171", // Red-400
      borderDownColor: "#f87171",
      wickDownColor: "#f87171",
    });

    chartRef.current = chart;
    seriesRef.current = series;

    // Resize Observer for perfect fit
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

  // 3. Fetch Data & WebSocket
  useEffect(() => {
    if (!symbol || !interval || !seriesRef.current) return;

    let ws: WebSocket | null = null;
    let latestTime = 0;

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
        }

        // WebSocket
        ws = new WebSocket(
          `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`
        );

        ws.onmessage = (event: MessageEvent) => {
          const message = JSON.parse(event.data);
          const k = message.k;
          if (!k) return;
          
          const pointTime = Math.floor(Number(k.t) / 1000);
          // Ensure we don't go backwards in time (Binance oddity check)
          if (pointTime < latestTime) return;
          latestTime = pointTime;

          const point: Candle = {
            time: pointTime as UTCTimestamp,
            open: +k.o,
            high: +k.h,
            low: +k.l,
            close: +k.c,
          };

          seriesRef.current?.update(point);
          setPreviousPrice(currentPrice);
          setCurrentPrice(point.close);
        };
      } catch (e) {
        console.error("Error fetching data", e);
      }
    }

    fetchData();
    return () => ws && ws.close();
  }, [symbol, interval]);

  // 4. Prediction Logic
  const handlePredict = () => {
    if (!chartRef.current) return;

    if (indicatorRef.current) {
      chartRef.current.removeSeries(indicatorRef.current);
      indicatorRef.current = null;
      // Force re-render to update button state if needed, strictly separate refs here though
      return;
    }

    const line = chartRef.current.addLineSeries({
      color: "#3b82f6", // Blue-500 (Apple Blue)
      lineWidth: 2,
      lineStyle: 2, // Dashed
      crosshairMarkerVisible: true,
    });

    // Generate dummy prediction data forward from now
    const now = Math.floor(Date.now() / 1000);
    const lastClose = currentPrice || 50000;
    
    const data: LineData[] = [];
    let val = lastClose;
    
    // Create a projection for the next 20 minutes
    for(let i = 0; i < 20; i++) {
       const time = (now + (i * 60)) as UTCTimestamp; // future timestamps
       val = val * (1 + (Math.random() * 0.002 - 0.001)); // random walk
       data.push({ time, value: val });
    }

    line.setData(data);
    indicatorRef.current = line;
    
    // Fit content to show the prediction
    chartRef.current.timeScale().fitContent();
  };

  const filteredSymbols = symbolsList.filter((s) =>
    s.toLowerCase().includes(search.toLowerCase())
  );

  const priceColor = !currentPrice || !previousPrice 
    ? "text-white" 
    : currentPrice >= previousPrice 
      ? "text-emerald-400" 
      : "text-red-400";

  return (
    <div className="flex flex-col h-screen w-full bg-zinc-950 text-zinc-100 overflow-hidden font-sans selection:bg-blue-500/30 ml-0 md:ml-20">
      
      {/* HEADER - Glassmorphic */}
      <header className="flex-none px-4 py-4 flex flex-col gap-4 z-30 bg-zinc-950/80 backdrop-blur-md border-b border-white/5">
        
        {/* Top Row: Symbol & Price */}
        <div className="flex justify-between items-center">
          <div>
             <h1 className="text-2xl font-bold tracking-tight text-white">
                {symbol.replace("USDT", "")}
                <span className="text-zinc-500 text-lg font-normal ml-1">/ USDT</span>
             </h1>
             <div className={`text-sm font-mono mt-1 flex items-center gap-2 ${priceColor}`}>
                {currentPrice ? `$${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "Loading..."}
             </div>
          </div>

          {/* Interval Selector - Minimalist Pill */}
          <div className="flex bg-zinc-900 rounded-full p-1 border border-white/5">
             {["1m", "15m", "1h", "4h"].map((t) => (
               <button
                  key={t}
                  onClick={() => setInterval(t)}
                  className={`px-3 py-1 text-xs rounded-full transition-all ${
                    interval === t 
                      ? "bg-white text-black font-medium shadow-sm" 
                      : "text-zinc-400 hover:text-white"
                  }`}
               >
                 {t}
               </button>
             ))}
          </div>
        </div>

        {/* Search Bar (Collapsible/Integrated) */}
        <div className="relative w-full">
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
             <input 
               type="text"
               placeholder="Search Asset..."
               value={search}
               onClick={() => setIsSearchOpen(true)}
               onChange={(e) => {
                 setSearch(e.target.value);
                 setIsSearchOpen(true);
               }}
               className="w-full bg-zinc-900/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
             />
           </div>

           {/* Dropdown Results */}
           <AnimatePresence>
             {isSearchOpen && search && (
               <motion.div 
                 initial={{ opacity: 0, y: -10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -10 }}
                 className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl max-h-60 overflow-y-auto z-50"
               >
                 {filteredSymbols.slice(0, 20).map((s) => (
                   <div
                     key={s}
                     onClick={() => {
                       setSymbol(s);
                       setIsSearchOpen(false);
                       setSearch("");
                     }}
                     className="px-4 py-3 text-sm text-zinc-300 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0 flex justify-between"
                   >
                     <span>{s.replace("USDT", "")}</span>
                     <span className="text-zinc-600 text-xs">USDT</span>
                   </div>
                 ))}
               </motion.div>
             )}
           </AnimatePresence>
           {/* Click away listener overlay */}
           {isSearchOpen && (
              <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsSearchOpen(false)} />
           )}
        </div>
      </header>

      {/* CHART AREA - Flexible Height */}
      <main className="flex-1 relative w-full h-full z-0">
        <div ref={chartContainerRef} className="absolute inset-0 w-full h-full" />
      </main>

        <Button
          onClick={handlePredict}
          className="text-lg p-3 flex items-center justify-center gap-2 rounded-none"
        >
          {indicatorRef.current ? " Prediction" : "Predict"}
        </Button>

    </div>
  );
}