"use client";

import React, { useEffect, useRef, useState } from "react";
import { createChart, ColorType } from "lightweight-charts";
import { Button } from "@/components/ui/button";
import { LoaderCircle } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { useRouter } from 'next/navigation'



const MARKETS = [
  { name: "Bitcoin", symbol: "BTCUSDT" },
  { name: "Ethereum", symbol: "ETHUSDT" },
  { name: "BNB", symbol: "BNBUSDT" },
  { name: "Solana", symbol: "SOLUSDT" },
  { name: "XRP", symbol: "XRPUSDT" },
  { name: "Cardano", symbol: "ADAUSDT" },
  { name: "Dogecoin", symbol: "DOGEUSDT" },
];

const TIMEFRAMES = [
  { label: "1m", value: "1m" },
  { label: "5m", value: "5m" },
  { label: "15m", value: "15m" },
  { label: "1h", value: "1h" },
  { label: "4h", value: "4h" },
  { label: "1d", value: "1d" },
];

export default function CryptoTradingChart() {
  // container ref also carries the created chart instance for easy access
  const chartRef = useRef<(HTMLDivElement & { chart?: ReturnType<typeof createChart> }) | null>(null);
  const candleSeriesRef = useRef(null);
  const wsRef = useRef<WebSocket | null>(null);
  const router = useRouter();

  const [symbol, setSymbol] = useState("BTCUSDT");
  const [timeframe, setTimeframe] = useState("5m");
  const [amt, setAmt] = useState("100");
  const [side, setSide] = useState("");
  const [target, setTarget] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [loading, setLoading] = useState(false);
  const [trade, setTrade] = useState(false);
  const [exitUI, setExitUI] = useState(false);
  const { user } = useUser();
  const email = user?.emailAddresses?.[0]?.emailAddress || "";


 type Kline = [
   openTime: number,
   open: string,
   high: string,
   low: string,
   close: string,
   volume: string,
   closeTime: number,
   quoteAssetVolume: string,
   trades: number,
   takerBuyBaseVolume: string,
   takerBuyQuoteVolume: string,
   ignore: string
 ];

function transformKlines(raw: Kline[]) {
  return raw.map((c) => ({
    time: c[0] / 1000,
    open: parseFloat(c[1]),
    high: parseFloat(c[2]),
    low: parseFloat(c[3]),
    close: parseFloat(c[4]),
  }));
}



  useEffect(() => {
    if (!chartRef.current) return;

    const chart = createChart(chartRef.current, {
      layout: { background: { type: ColorType.Solid, color: "#000" }, textColor: "#DDD" },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.05)" },
        horzLines: { color: "rgba(255,255,255,0.05)" },
      },
      width: chartRef.current.clientWidth,
      height: chartRef.current.clientHeight,
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#00E676",
      borderUpColor: "#00E676",
      wickUpColor: "#00E676",
      downColor: "#FF1744",
      borderDownColor: "#FF1744",
      wickDownColor: "#FF1744",

      priceLineColor: "#FFF", // gold, pick whatever
  priceLineWidth: 2,
    });

    chartRef.current.chart = chart;
    candleSeriesRef.current = candleSeries;

    const resizeChart = () => {
      if (!chartRef.current) return;
      chart.applyOptions({
        width: chartRef.current.clientWidth,
        height: chartRef.current.clientHeight,
      });
    };

    window.addEventListener("resize", resizeChart);
    return () => window.removeEventListener("resize", resizeChart);
  }, []);

  const notifiedRef = useRef({
  target: false,
  stopLoss: false,
});


  useEffect(() => {
    if (!candleSeriesRef.current) return;

    const chart = chartRef.current?.chart;
    const series = candleSeriesRef.current;
    if (!chart) return;

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${timeframe}&limit=500`;

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        const candles = transformKlines(data);
        series.setData(candles);
        chart.timeScale().fitContent();

        const socket = new WebSocket(
          `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${timeframe}`
        );

        wsRef.current = socket;

        socket.onmessage = (event) => {
          const msg = JSON.parse(event.data);
          const k = msg.k;

          const live = {
            time: k.t / 1000,
            open: parseFloat(k.o),
            high: parseFloat(k.h),
            low: parseFloat(k.l),
            close: parseFloat(k.c),
          };

          series.update(live);

const price = live.close;


if (target && price >= target && !notifiedRef.current.target) {
  toast.success(`Target hit! ${target}`);
  notifiedRef.current.target = true;
  // remove lines instantly
  if (targetLineRef.current) {
    series.removePriceLine(targetLineRef.current);
    targetLineRef.current = null;
  }
  if (stopLossLineRef.current) {
    series.removePriceLine(stopLossLineRef.current);
    stopLossLineRef.current = null;
  }
  setTarget("");
  setStopLoss("");
  setTrade(false);
  setExitUI(false)
}

// ---- ONE-TIME STOPLOSS HIT ----
if (stopLoss && price <= stopLoss && !notifiedRef.current.stopLoss) {
  toast.error(`Stop Loss hit! ${stopLoss}`);
  notifiedRef.current.stopLoss = true;
  // remove lines instantly
  if (targetLineRef.current) {
    series.removePriceLine(targetLineRef.current);
    targetLineRef.current = null;
  }
  if (stopLossLineRef.current) {
    series.removePriceLine(stopLossLineRef.current);
    stopLossLineRef.current = null;
  }
    setTarget("");
    setStopLoss("");
  setTrade(false);
  setExitUI(false)
}

        };
      });
  }, [symbol, timeframe]);

  const targetLineRef = useRef(null);
const stopLossLineRef = useRef(null);
useEffect(() => {
  const series = candleSeriesRef.current;
  if (!series) return;

  // ----- TARGET LINE -----
  if (target) {
    // remove old line
    if (targetLineRef.current) {
      series.removePriceLine(targetLineRef.current);
    }

    // create new line
    targetLineRef.current = series.createPriceLine({
      price: parseFloat(target),
      color: "#00ff6a",
      lineWidth: 2,
      lineStyle: 2, // dashed
      axisLabelVisible: true,
      title: "TARGET",
    });
  }

  // ----- STOPLOSS LINE -----
  if (stopLoss) {
    if (stopLossLineRef.current) {
      series.removePriceLine(stopLossLineRef.current);
    }

    stopLossLineRef.current = series.createPriceLine({
      price: parseFloat(stopLoss),
      color: "#ff0033",
      lineWidth: 2,
      lineStyle: 2,
      axisLabelVisible: true,
      title: "STOP LOSS",
    });
  }
}, [target, stopLoss]);


  async function handlePredict() {
    if(!email){
      toast.error("user not found")
    }
    setLoading(true);
    try {
      const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${timeframe}&limit=100`;
      const raw = await fetch(url).then((r) => r.json());

      const candles = raw.map((c) => ({
        time: c[0] / 1000,
        open: parseFloat(c[1]),
        high: parseFloat(c[2]),
        low: parseFloat(c[3]),
        close: parseFloat(c[4]),
      }));

      const form = new FormData();
      form.append("email", email);
      form.append("symbol", symbol);
      form.append("timeframe", timeframe);
      form.append("candles", JSON.stringify(candles));

      const res = await fetch("https://cravio-ai.onrender.com/api/predict", {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      // if user has no credits
    if (res.status === 403) {
      toast.error("Insufficient credits")
      router.push("/pricing");
      return;
    }

      if (res.ok) {
        setSide(data.data.side);
        setStopLoss(data.data.stopLoss);
        setTarget(data.data.target);
        setTrade(true);
      }
      console.log(data)
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }


  async function handlePlaceTrade() {
    setLoading(true);
    try {
      const form = new FormData();
      form.append("symbol", symbol);
      form.append("side", side);
    const amtNum = parseFloat(amt);

    const latestCandle = candleSeriesRef.current.data().slice(-1)[0];
    const price = latestCandle?.close || 1

    const qty = amtNum / price;
      form.append("qty", qty);
      form.append("stopLoss", stopLoss);
      form.append("target", target);
      form.append("email", email);

      const res = await fetch("https://cravio-ai.onrender.com/api/trade", { 
        method: "POST",
         body: form
         });
      const data = await res.json();
      console.log(data)
      if (res.status === 403) {
      toast.error("Binance Creditinal not found!")
      router.push("/brokrage");
      return;
    }
      if (res.ok) {
        setTrade(false);
        setExitUI(true)
      }
    } catch (e) {
      console.error(e);

    } finally {
    setLoading(false);

    }
  }

  async function handleExit() {
    setLoading(true);

    try{
        const form = new FormData();
  form.append("symbol", symbol);
  form.append("email", email);

  const res = await fetch("https://cravio-ai.onrender.com/api/exit", {
    method: "POST",
    body: form,
  });

  const data = await res.json();
  toast("Order Exit")
  setTarget("")
  setSide("")
  setStopLoss("")
  setExitUI(false)
  console.log(data)
    } catch (e) {
      console.error(e)
    } finally {
    setLoading(false);
    }
}

const [priceMap, setPriceMap] = useState<{ [key: string]: number }>({});

useEffect(() => {
  const fetchPrices = async () => {
    try {
      const symbols = MARKETS.map((m) => m.symbol);
      const data = await Promise.all(
        symbols.map(async (s) => {
          const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${s}`);
          const json = await res.json();
          return { symbol: s, price: parseFloat(json.price) };
        })
      );
      const map: { [key: string]: number } = {};
      data.forEach((d) => (map[d.symbol] = d.price));
      setPriceMap(map);
    } catch (e) {
      console.error(e);
    }
  };

  fetchPrices();
  const interval = setInterval(fetchPrices, 5000); // refresh every 5s
  return () => clearInterval(interval);
}, []);


  return (
  <div className="w-full h-screen flex flex-col md:flex-row bg-black">

    {/* LEFT SECTION → chart + selectors */}
    <div className="flex-1 relative flex flex-col">

      {/* selectors */}
      <div className="absolute top-4 left-4 z-40 flex gap-2">
        <select
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl bg-zinc-900/80 backdrop-blur border border-white/10 text-white"
        >
          {MARKETS.map((m) => (
            <option key={m.symbol} value={m.symbol}>
              {m.name}
            </option>
          ))}
        </select>

        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl bg-zinc-900/80 backdrop-blur border border-white/10 text-white"
        >
          {TIMEFRAMES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* chart */}
      <div
        ref={chartRef}
        className={`w-full transition-all duration-300 ${
          trade ? "h-[60vh] md:h-full" : "h-full"
        }`}
      />
    </div>

    {/* RIGHT PANEL — ONLY md+ */}
    <div className="hidden md:flex md:w-80 border-l border-white/10 p-4">
      <div className="flex-1 flex flex-col justify-end">
      <div className="h-full flex flex-col gap-2 overflow-y-auto">
  {MARKETS.map((m) => (
    <div
      key={m.symbol}
      onClick={() => setSymbol(m.symbol)}
      className={`cursor-pointer p-2 rounded-lg flex justify-between items-center 
        ${m.symbol === symbol ? "bg-zinc-300 text-black" : "bg-zinc-900 text-zinc-300"} 
        hover:bg-zinc-200 hover:text-zinc-950 transition-colors`}
    >
      <span className="font-medium">{m.name}</span>
      <span className="text-sm">
        {/* Show price dynamically */}
        {priceMap[m.symbol] ? `$${priceMap[m.symbol].toFixed(2)}` : "--"}
      </span>
    </div>
  ))}
</div>


        {/* SAME UI as mobile bottom panel */}
        {exitUI ? (
          <Button
            onClick={handleExit}
            className="w-full h-10 rounded-lg bg-zinc-200 font-semibold text-sm shadow-xl"
          >
            {loading ? (
              <LoaderCircle className="w-4 h-4 animate-spin" />
            ) : (
              <h1>EXIT</h1>
            )}
          </Button>
        ) : trade ? (
          <div className="flex flex-col gap-3">

            <div>
              <label className="text-zinc-400 text-xs">Amount</label>
              <input
                value={amt}
                onChange={(e) => setAmt(e.target.value)}
                className="mt-1 w-full h-9 bg-zinc-900 border border-white/10 rounded-lg px-3 text-white text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">

              <div className="rounded-lg p-2 bg-gradient-to-t from-green-600 via-green-800 to-black text-white text-center shadow-lg">
                <span className="text-xs text-green-400">Take Profit</span>
                <input
                  type="number"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="mt-1 w-full bg-transparent text-base font-semibold text-center focus:outline-none"
                />
              </div>

              <div className="rounded-lg p-2 bg-gradient-to-t from-red-600 via-red-800 to-black text-white text-center shadow-lg">
                <span className="text-xs text-red-400">Stop Loss</span>
                <input
                  type="number"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  className="mt-1 w-full bg-transparent text-base font-semibold text-center focus:outline-none"
                />
              </div>
            </div>

            <Button
              onClick={handlePlaceTrade}
              className="w-full h-10 rounded-lg bg-zinc-200 font-semibold text-sm shadow-xl"
            >
              {loading ? (
              <LoaderCircle className="w-4 h-4 animate-spin" />
            ) : (
              side
            )}
            </Button>
          </div>
        ) : (
          <Button
            onClick={handlePredict}
            className="w-full h-10 rounded-lg bg-zinc-200 font-semibold text-sm shadow-xl"
          >
            {loading ? (
              <LoaderCircle className="w-4 h-4 animate-spin" />
            ) : (
              <h1>Predict</h1>
            )}
          </Button>
        )}
      </div>
    </div>

    {/* MOBILE BOTTOM PANEL — SAME AS BEFORE, NOT CHANGED */}
    <div className="w-full border-t border-white/10 bg-black p-3 md:hidden">
      <div className="max-w-xl mx-auto">
        {exitUI ? (
          <Button
            onClick={handleExit}
            className="w-full h-10 rounded-lg bg-zinc-200 font-semibold text-sm shadow-xl"
          >
           {loading ? (
              <LoaderCircle className="w-4 h-4 animate-spin" />
            ) : (
              <h1>EXIT</h1>
            )}
          </Button>
        ) : trade ? (
          <div className="flex flex-col gap-3">

            <div>
              <label className="text-zinc-400 text-xs">Amount</label>
              <input
                value={amt}
                onChange={(e) => setAmt(e.target.value)}
                className="mt-1 w-full h-9 bg-zinc-900 border border-white/10 rounded-lg px-3 text-white text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">

              <div className="rounded-lg p-2 bg-gradient-to-t from-green-600 via-green-800 to-black text-white text-center shadow-lg">
                <span className="text-xs text-green-400">Take Profit</span>
                <input
                  type="number"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="mt-1 w-full bg-transparent text-base font-semibold text-center focus:outline-none"
                />
              </div>

              <div className="rounded-lg p-2 bg-gradient-to-t from-red-600 via-red-800 to-black text-white text-center shadow-lg">
                <span className="text-xs text-red-400">Stop Loss</span>
                <input
                  type="number"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  className="mt-1 w-full bg-transparent text-base font-semibold text-center focus:outline-none"
                />
              </div>
            </div>

            <Button
              onClick={handlePlaceTrade}
              className="w-full h-10 rounded-lg bg-zinc-200 font-semibold text-sm shadow-xl"
            >
              {loading ? (
              <LoaderCircle className="w-4 h-4 animate-spin" />
            ) : (
              side
            )}
            </Button>
          </div>
        ) : (
          <Button
            onClick={handlePredict}
            className="w-full h-10 rounded-lg bg-zinc-200 font-semibold text-sm shadow-xl"
          >
            {loading ? (
              <LoaderCircle className="w-4 h-4 animate-spin" />
            ) : (
              <h1>Predict</h1>
            )}
          </Button>
        )}
      </div>
    </div>
  </div>
);

}

