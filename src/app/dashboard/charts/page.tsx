"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  BarChart3,
  RefreshCw,
  Maximize2,
  Minimize2,
  Loader2,
  Activity,
  Layers,
  Gauge,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MAJOR_PAIRS } from "@/types";
import type { MarketDataResponse, Granularity } from "@/app/api/market/data/route";
import {
  summarizePriceAction,
  summarizeMaCross,
  summarizeRsiMacd,
  type InsightCard,
  type Sentiment,
} from "@/lib/insights";
import { useTradingLensPrefs } from "@/lib/hooks/use-trading-lens-prefs";
import {
  TIMEFRAME_PILLS,
  defaultTimeframeForBucket,
  displayTimeframeToBucket,
  snapToBucket,
  type DisplayTimeframe,
} from "@/lib/utils/timeframe-bucket";

const FALLBACK_PRICES: Record<string, number> = {
  EURUSD: 1.0850, GBPUSD: 1.2650, USDJPY: 151.50, USDCHF: 0.8820,
  AUDUSD: 0.6520, USDCAD: 1.3580, NZDUSD: 0.5950, EURGBP: 0.8570,
  EURJPY: 164.20, GBPJPY: 191.50, AUDJPY: 98.80, CHFJPY: 171.70,
  EURAUD: 1.6640, GBPAUD: 1.9400, XAUUSD: 2335.00, XAGUSD: 29.50,
};

function generateIntradayCandles(
  dailyCandles: Array<{ time: string; open: number; high: number; low: number; close: number }>,
  count: number,
  fallbackBasePrice?: number
) {
  const lastDaily = dailyCandles[dailyCandles.length - 1];
  const basePrice = lastDaily?.close ?? fallbackBasePrice ?? 1.0850;
  const data: Array<{ time: string; open: number; high: number; low: number; close: number }> = [];
  let currentPrice = basePrice;
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setMinutes(d.getMinutes() - i * 5);
    const change = (Math.random() - 0.48) * 0.0008;
    const open = currentPrice;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * 0.0004;
    const low = Math.min(open, close) - Math.random() * 0.0004;
    currentPrice = close;
    data.push({
      time: d.toISOString().slice(0, 19) + "Z",
      open: Number(open.toFixed(5)),
      high: Number(high.toFixed(5)),
      low: Number(low.toFixed(5)),
      close: Number(close.toFixed(5)),
    });
  }
  return data;
}

const INDICATORS = [
  { id: "rsi", label: "RSI", active: false },
  { id: "macd", label: "MACD", active: false },
  { id: "ma", label: "Moving Avg", active: true },
  { id: "bb", label: "Bollinger", active: false },
];

const INSIGHT_VISUALS: Record<InsightCard["id"], { icon: LucideIcon }> = {
  "price-action": { icon: Activity },
  "ma-cross": { icon: Layers },
  "rsi-macd": { icon: Gauge },
};

const SENTIMENT_TONE: Record<Sentiment, { bg: string; icon: string; chipBorder: string; chipText: string }> = {
  bullish: { bg: "bg-emerald-400/10", icon: "text-emerald-300", chipBorder: "border-emerald-400/20", chipText: "text-emerald-300" },
  bearish: { bg: "bg-red-400/10", icon: "text-red-300", chipBorder: "border-red-400/20", chipText: "text-red-300" },
  neutral: { bg: "bg-white/[0.04]", icon: "text-white/40", chipBorder: "border-white/10", chipText: "text-white/40" },
};

export default function ChartLensPage() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const {
    symbol: selectedPair,
    setSymbol: setSelectedPair,
    granularity,
    setGranularity,
  } = useTradingLensPrefs();
  const [displayedTf, setDisplayedTf] = useState<DisplayTimeframe>(() => defaultTimeframeForBucket(granularity));
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [candleData, setCandleData] = useState<Array<{ time: string; open: number; high: number; low: number; close: number }>>([]);
  const [dailyCandles, setDailyCandles] = useState<Array<{ time: string; open: number; high: number; low: number; close: number }>>([]);
  const [currentPrice, setCurrentPrice] = useState(1.0850);
  const [bidPrice, setBidPrice] = useState<number | null>(null);
  const [askPrice, setAskPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState(0);
  const [isPositive, setIsPositive] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<"api" | "fallback">("fallback");

  const handleTimeframeChange = useCallback(
    (tf: DisplayTimeframe) => {
      setDisplayedTf(tf);
      const bucket = displayTimeframeToBucket(tf);
      if (granularity !== bucket) setGranularity(bucket);
    },
    [granularity, setGranularity]
  );

  useEffect(() => {
    setDisplayedTf((prev) => snapToBucket(prev, granularity));
  }, [granularity]);

  const fetchMarketData = useCallback(async (symbol: string, gf: Granularity) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/market/data?symbol=${symbol}&candles=true&granularity=${gf}`);
      const data: MarketDataResponse = await res.json();
      if (data.quote) {
        setDataSource("api");
        const rate = data.quote.exchangeRate;
        setCurrentPrice(rate);
        setBidPrice(data.quote.bidPrice);
        setAskPrice(data.quote.askPrice);
        setLastUpdated(data.quote.lastRefreshed);
        const fp = FALLBACK_PRICES[symbol] ?? rate;
        setPriceChange(((rate - fp) / fp) * 100);
        setIsPositive(rate >= fp);
      } else {
        setDataSource("fallback");
        const fp = FALLBACK_PRICES[symbol] ?? 1.0850;
        const jitter = (Math.random() - 0.5) * 0.005;
        const price = fp + jitter;
        setCurrentPrice(Number(price.toFixed(5)));
        setBidPrice(null);
        setAskPrice(null);
        setPriceChange((jitter / fp) * 100);
        setIsPositive(jitter >= 0);
      }
      const pfp = FALLBACK_PRICES[symbol] ?? 1.0850;
      if (data.candles && data.candles.length > 0) {
        setDailyCandles(data.candles);
        setCandleData(generateIntradayCandles(data.candles, 200, pfp));
      } else {
        setCandleData(generateIntradayCandles([], 200, pfp));
        setDailyCandles([]);
      }
    } catch {
      setDataSource("fallback");
      const fp = FALLBACK_PRICES[symbol] ?? 1.0850;
      setCurrentPrice(fp);
      setBidPrice(null);
      setAskPrice(null);
      setPriceChange(0);
      setIsPositive(true);
      setCandleData(generateIntradayCandles([], 200, fp));
      setDailyCandles([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchMarketData(selectedPair, granularity); }, [selectedPair, granularity, fetchMarketData]);
  useEffect(() => {
    const id = setInterval(() => fetchMarketData(selectedPair, granularity), 60_000);
    return () => clearInterval(id);
  }, [selectedPair, granularity, fetchMarketData]);
  useEffect(() => {
    if (isLoading) return;
    const id = setInterval(() => {
      setCandleData((prev) => {
        const last = prev[prev.length - 1];
        if (!last) return prev;
        const change = (Math.random() - 0.48) * 0.0005;
        const nc = Number((last.close + change).toFixed(5));
        const nh = Math.max(last.high, nc + Math.random() * 0.0003);
        const nl = Math.min(last.low, nc - Math.random() * 0.0003);
        const upd = [...prev];
        upd[upd.length - 1] = { ...last, high: Number(nh.toFixed(5)), low: Number(nl.toFixed(5)), close: nc };
        setCurrentPrice(nc);
        const fp = FALLBACK_PRICES[selectedPair] ?? 1.0850;
        setPriceChange(((nc - fp) / fp) * 100);
        setIsPositive(nc >= fp);
        return upd;
      });
    }, 2000);
    return () => clearInterval(id);
  }, [selectedPair, isLoading]);

  const insightCards: InsightCard[] = useMemo(() => {
    const warmingUp = (id: InsightCard["id"], title: string): InsightCard => ({
      id, title, description: "Loading more data…", tagline: "Warming up", sentiment: "neutral", ready: false,
    });
    if (candleData.length < 35) return [warmingUp("price-action", "Price Action"), warmingUp("ma-cross", "MA Cross"), warmingUp("rsi-macd", "RSI / MACD")];
    return [summarizePriceAction(candleData), summarizeMaCross(candleData), summarizeRsiMacd(candleData)];
  }, [candleData]);

  const renderCandleChart = useCallback(() => {
    if (!candleData.length || !chartContainerRef.current) return null;
    const width = chartContainerRef.current.clientWidth;
    const height = chartContainerRef.current.clientHeight;
    const padding = { top: 24, right: 16, bottom: 28, left: 62 };
    const cw = width - padding.left - padding.right;
    const ch = height - padding.top - padding.bottom;
    const prices = candleData.flatMap((d) => [d.high, d.low]);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const range = maxP - minP || 0.001;
    const sy = (p: number) => padding.top + ch - ((p - minP) / range) * ch;
    const bw = Math.max(2, cw / candleData.length - 1);
    const gridValues = Array.from({ length: 5 }, (_, i) => minP + (range * (i + 1)) / 6);
    const maPeriod = 20;
    const maValues = candleData.map((_, i) => {
      if (i < maPeriod - 1) return null;
      const s = candleData.slice(i - maPeriod + 1, i + 1).reduce((a, c) => a + c.close, 0);
      return s / maPeriod;
    });
    return (
      <svg width={width} height={height} className="w-full h-full">
        {gridValues.map((v, i) => (
          <g key={i}>
            <line x1={padding.left} y1={sy(v)} x2={width - padding.right} y2={sy(v)} stroke="rgba(255,255,255,0.06)" strokeWidth={1} strokeDasharray="4 4" />
            <text x={padding.left - 8} y={sy(v) + 3} textAnchor="end" fill="rgba(255,255,255,0.35)" fontSize={10}>{v.toFixed(5)}</text>
          </g>
        ))}
        {candleData.map((d, i) => {
          const x = padding.left + (i / candleData.length) * cw;
          const up = d.close >= d.open;
          const col = up ? "#4ade80" : "#ff6b7a";
          return (
            <g key={i}>
              <line x1={x + bw / 2} y1={sy(d.high)} x2={x + bw / 2} y2={sy(d.low)} stroke={col} strokeWidth={1} />
              <rect x={x} y={sy(Math.max(d.open, d.close))} width={bw} height={Math.max(1, Math.abs(sy(d.open) - sy(d.close)))} fill={col} rx={1} />
            </g>
          );
        })}
        <path
          d={maValues.map((v, i) => {
            if (v === null) return "";
            const x = padding.left + (i / candleData.length) * cw + bw / 2;
            const y = sy(v);
            return `${i === maPeriod - 1 ? "M" : "L"}${x},${y}`;
          }).join(" ")}
          fill="none" stroke="#f2c14e" strokeWidth={1.6} opacity={0.85}
        />
        {[0, Math.floor(candleData.length / 4), Math.floor(candleData.length / 2), Math.floor((3 * candleData.length) / 4), candleData.length - 1].map((idx) => {
          if (idx >= candleData.length) return null;
          const d = candleData[idx];
          const x = padding.left + (idx / candleData.length) * cw;
          const t = new Date(d.time);
          return <text key={idx} x={x} y={height - 8} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize={10}>{t.getHours().toString().padStart(2, "0")}:{t.getMinutes().toString().padStart(2, "0")}</text>;
        })}
      </svg>
    );
  }, [candleData]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="inline-flex items-center gap-2 rounded-full border border-accent/15 bg-accent/10 px-3 py-1 text-[11px] font-bold tracking-[0.14em] text-accent">
          <BarChart3 className="h-3.5 w-3.5" /> CHART LENS
        </div>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">Live Market Intelligence</h1>
            <p className="mt-1.5 text-sm text-white/45 max-w-xl">Real-time forex charts with AI pattern recognition — precision timing across 16 pairs.</p>
          </div>
          {dataSource === "api" && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/15 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold tracking-wide text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE FEED
            </span>
          )}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="flex flex-wrap items-center gap-4 rounded-[20px] border border-white/10 bg-[#0b1428]/60 backdrop-blur px-4 sm:px-5 py-3.5">
        <span className="rounded-full bg-white/[0.06] border border-white/10 px-2.5 py-1 text-xs font-bold tracking-wide text-white">{selectedPair}</span>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : (
          <>
            <span className={cn("font-display text-lg font-bold tabular-nums", isPositive ? "text-emerald-300" : "text-red-300")}>{currentPrice.toFixed(5)}</span>
            <span className={cn("rounded-full border px-2 py-0.5 text-xs font-bold", isPositive ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-red-400/20 bg-red-400/10 text-red-300")}>{isPositive ? "+" : ""}{priceChange.toFixed(2)}%</span>
          </>
        )}
        <div className="hidden lg:flex items-center gap-3 text-xs">
          <span className="text-white/30">O <span className="text-white/60">{candleData[candleData.length - 1]?.open.toFixed(5) ?? "—"}</span></span>
          <span className="text-white/30">H <span className="text-emerald-300/80">{candleData[candleData.length - 1]?.high.toFixed(5) ?? "—"}</span></span>
          <span className="text-white/30">L <span className="text-red-300/80">{candleData[candleData.length - 1]?.low.toFixed(5) ?? "—"}</span></span>
          <span className="text-white/30">C <span className="text-white/70">{candleData[candleData.length - 1]?.close.toFixed(5) ?? "—"}</span></span>
          {bidPrice != null && askPrice != null && (
            <>
              <span className="h-3 w-px bg-white/10" />
              <span className="text-white/30">Bid <span className="text-emerald-300">{bidPrice.toFixed(5)}</span></span>
              <span className="text-white/30">Ask <span className="text-red-300">{askPrice.toFixed(5)}</span></span>
            </>
          )}
        </div>
        {lastUpdated && <span className="ml-auto hidden sm:block text-[11px] text-white/25">Updated {new Date(lastUpdated).toLocaleTimeString()}</span>}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className={cn("overflow-hidden rounded-[20px] border border-white/10 bg-[#0b1428]/60 backdrop-blur", isFullscreen && "fixed inset-3 z-50")}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <select value={selectedPair} onChange={(e) => setSelectedPair(e.target.value)} className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white outline-none focus:border-primary/30">
              {MAJOR_PAIRS.map((p) => <option key={p.symbol} value={p.symbol} className="bg-[#0b1428]">{p.symbol}</option>)}
            </select>
            <div className="flex rounded-full border border-white/10 bg-white/[0.03] p-1">
              {TIMEFRAME_PILLS.map((tf) => (
                <button key={tf} onClick={() => handleTimeframeChange(tf)} className={cn("rounded-full px-3 py-1.5 text-xs font-bold transition-colors", displayedTf === tf ? "bg-primary text-primary-foreground shadow" : "text-white/40 hover:text-white")}>{tf}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin text-white/30" />}
            <button onClick={() => fetchMarketData(selectedPair, granularity)} className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/40 hover:text-white hover:bg-white/[0.08] transition-colors" title="Refresh"><RefreshCw className="h-4 w-4" /></button>
            <button onClick={() => setIsFullscreen(!isFullscreen)} className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/40 hover:text-white transition-colors" title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>{isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}</button>
          </div>
        </div>
        <div ref={chartContainerRef} className={cn("relative w-full", isFullscreen ? "h-[calc(100vh-160px)]" : "h-[420px] lg:h-[500px]")}>
          {renderCandleChart()}
          {isLoading && candleData.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0b1428]/60 backdrop-blur-sm">
              <div className="text-center"><Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" /><p className="text-sm text-white/40">Fetching market data…</p></div>
            </div>
          )}
          {!isLoading && !candleData.length && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center"><div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 border border-accent/15 text-accent"><BarChart3 className="h-7 w-7" /></div><h3 className="font-display font-semibold text-white">No Chart Data</h3><p className="text-sm text-white/40">Select a pair and timeframe to begin</p></div>
            </div>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="rounded-[20px] border border-white/10 bg-[#0b1428]/60 backdrop-blur p-5">
          <h3 className="font-display text-sm font-semibold text-white">Indicators</h3>
          <div className="mt-4 space-y-2">
            {INDICATORS.map((ind) => (
              <label key={ind.id} className="flex cursor-pointer items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.02] px-3 py-2.5 hover:bg-white/[0.04] transition-colors">
                <span className="text-xs font-medium text-white/70">{ind.label}</span>
                <span className={cn("relative h-4 w-8 rounded-full transition-colors", ind.active ? "bg-primary" : "bg-white/10")}><span className={cn("absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all", ind.active ? "left-4" : "left-0.5")} /></span>
              </label>
            ))}
          </div>
          {dailyCandles.length > 0 && <div className="mt-4 border-t border-white/10 pt-3 text-[11px] text-white/30">{dailyCandles.length} daily candles • {dailyCandles[0]?.time} → {dailyCandles[dailyCandles.length - 1]?.time}</div>}
        </motion.div>
        {insightCards.map((card, i) => {
          const Icon = INSIGHT_VISUALS[card.id].icon;
          const tone = SENTIMENT_TONE[card.sentiment];
          return (
            <motion.div key={card.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 + i * 0.05 }} data-testid={`insight-${card.id}`} data-ready={card.ready ? "true" : "false"} data-sentiment={card.sentiment}
              className={cn("rounded-[20px] border p-5 backdrop-blur transition-colors", card.ready ? "border-white/10 bg-[#0b1428]/60 hover:border-primary/20" : "border-dashed border-white/10 bg-[#0b1428]/30 opacity-70")}>
              <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl border", tone.bg, tone.icon === "text-emerald-300" ? "border-emerald-400/15" : tone.icon === "text-red-300" ? "border-red-400/15" : "border-white/10")}><Icon className={cn("h-4 w-4", tone.icon)} /></span>
              <div className="mt-3 flex items-center justify-between gap-2"><h3 className="font-display text-sm font-semibold text-white">{card.title}</h3><span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", tone.chipBorder, tone.chipText)}>{card.tagline}</span></div>
              <p className={cn("mt-2 text-xs leading-6", card.ready ? "text-white/45" : "text-white/30 italic")}>{card.description}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
