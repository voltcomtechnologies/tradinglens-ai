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

// ── Fallback base prices for when the API is unavailable ──

const FALLBACK_PRICES: Record<string, number> = {
  EURUSD: 1.0850, GBPUSD: 1.2650, USDJPY: 151.50, USDCHF: 0.8820,
  AUDUSD: 0.6520, USDCAD: 1.3580, NZDUSD: 0.5950, EURGBP: 0.8570,
  EURJPY: 164.20, GBPJPY: 191.50, AUDJPY: 98.80, CHFJPY: 171.70,
  EURAUD: 1.6640, GBPAUD: 1.9400, XAUUSD: 2335.00, XAGUSD: 29.50,
};

// ── Generate synthetic intraday candles (since free Alpha Vantage only has daily) ──

function generateIntradayCandles(
  dailyCandles: Array<{ time: string; open: number; high: number; low: number; close: number }>,
  count: number,
  fallbackBasePrice?: number
) {
  // Use the last daily candle as the base price for intraday generation
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

// ── Indicators toggle config ──

const INDICATORS = [
  { id: "rsi", label: "RSI", active: false },
  { id: "macd", label: "MACD", active: false },
  { id: "ma", label: "Moving Avg", active: true },
  { id: "bb", label: "Bollinger", active: false },
];

// ── Live-insight card visual mapping ──
// Icons are static (one per card id); color comes from each card's
// sentiment bucket so bullish/red/neutral each get distinct styling.

const INSIGHT_VISUALS: Record<InsightCard["id"], { icon: LucideIcon }> = {
  "price-action": { icon: Activity },
  "ma-cross": { icon: Layers },
  "rsi-macd": { icon: Gauge },
};

const SENTIMENT_TONE: Record<
  Sentiment,
  { bg: string; icon: string; chipBorder: string; chipText: string }
> = {
  bullish: {
    bg: "bg-emerald-500/10",
    icon: "text-emerald-400",
    chipBorder: "border-emerald-500/30",
    chipText: "text-emerald-400",
  },
  bearish: {
    bg: "bg-red-500/10",
    icon: "text-red-400",
    chipBorder: "border-red-500/30",
    chipText: "text-red-400",
  },
  neutral: {
    bg: "bg-slate-500/10",
    icon: "text-slate-400",
    chipBorder: "border-slate-500/30",
    chipText: "text-slate-400",
  },
};

export default function ChartLensPage() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  // Persisted pair + persisted-granularity bucket come from the same
  // hook Trading Lens uses, so the user's choice on either product
  // survives a navigation and resumes on the other. The displayed
  // pill keeps Chart Lens's 6-way vocabulary (`TIMEFRAME_PILLS`) by
  // initializing from the bucket on mount and writing the bucket back
  // on click — see `handleTimeframeChange` below.
  const {
    symbol: selectedPair,
    setSymbol: setSelectedPair,
    granularity,
    setGranularity,
  } = useTradingLensPrefs();
  const [displayedTf, setDisplayedTf] = useState<DisplayTimeframe>(() =>
    defaultTimeframeForBucket(granularity),
  );
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

  // Local pill click handler — keep the displayed pill choice
  // (e.g. "5m") for the current visit AND persist the bucket
  // ("1h") so navigating to Trading Lens shows the matching pill.
  const handleTimeframeChange = useCallback(
    (tf: DisplayTimeframe) => {
      setDisplayedTf(tf);
      const bucket = displayTimeframeToBucket(tf);
      if (granularity !== bucket) setGranularity(bucket);
    },
    [granularity, setGranularity],
  );

  // Cold-load re-sync for `displayedTf`. The hook returns DEFAULTS on
  // the first render, then the mount-only hydration effect flips
  // `granularity` to the persisted bucket on the second render —
  // `displayedTf` was already locked by its lazy initializer to the
  // canonical pill for the DEFAULT bucket, so the active pill would
  // be visibly wrong until the user clicks. This effect re-snaps
  // only when the displayed pill's bucket disagrees with the
  // persisted bucket, so within-bucket finer choices ("5m" inside
  // "1h") survive an external bucket flip without being clobbered.
  useEffect(() => {
    setDisplayedTf((prev) => snapToBucket(prev, granularity));
  }, [granularity]);

  // ── Fetch real market data from Alpha Vantage ──

  const fetchMarketData = useCallback(async (symbol: string, gf: Granularity) => {
    setIsLoading(true);
    try {
      // Granularity is appended so the route actually returns the
      // bucket the user picked — previously this page never passed
      // it, so picking "5m" produced daily candles silently. The
      // hook bucket narrows to "1h"/"1d"; Chart Lens' 4 finer pills
      // collapse to "1h" via the boundary translator above.
      const res = await fetch(
        `/api/market/data?symbol=${symbol}&candles=true&granularity=${gf}`,
      );
      const data: MarketDataResponse = await res.json();

      if (data.quote) {
        setDataSource("api");
        const rate = data.quote.exchangeRate;
        setCurrentPrice(rate);
        setBidPrice(data.quote.bidPrice);
        setAskPrice(data.quote.askPrice);
        setLastUpdated(data.quote.lastRefreshed);

        const fallbackPrice = FALLBACK_PRICES[symbol] ?? rate;
        setPriceChange(((rate - fallbackPrice) / fallbackPrice) * 100);
        setIsPositive(rate >= fallbackPrice);
      } else {
        // Fallback to hardcoded prices
        setDataSource("fallback");
        const fallbackPrice = FALLBACK_PRICES[symbol] ?? 1.0850;
        const jitter = (Math.random() - 0.5) * 0.005;
        const price = fallbackPrice + jitter;
        setCurrentPrice(Number(price.toFixed(5)));
        setBidPrice(null);
        setAskPrice(null);
        setPriceChange((jitter / fallbackPrice) * 100);
        setIsPositive(jitter >= 0);
      }

      const pairFallbackPrice = FALLBACK_PRICES[symbol] ?? 1.0850;

      if (data.candles && data.candles.length > 0) {
        setDailyCandles(data.candles);
        // Generate intraday candles from the last daily close
        const intraday = generateIntradayCandles(data.candles, 200, pairFallbackPrice);
        setCandleData(intraday);
      } else {
        // Fallback: fully synthetic candles at the pair-specific base price
        const generated = generateIntradayCandles([], 200, pairFallbackPrice);
        setCandleData(generated);
        setDailyCandles([]);
      }
    } catch {
      setDataSource("fallback");
      const fallbackPrice = FALLBACK_PRICES[symbol] ?? 1.0850;
      setCurrentPrice(fallbackPrice);
      setBidPrice(null);
      setAskPrice(null);
      setPriceChange(0);
      setIsPositive(true);
      setCandleData(generateIntradayCandles([], 200, fallbackPrice));
      setDailyCandles([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch data when pair OR persisted granularity bucket changes.
  useEffect(() => {
    fetchMarketData(selectedPair, granularity);
  }, [selectedPair, granularity, fetchMarketData]);

  // Poll for price updates every 60 seconds — at the current pair +
  // persisted bucket so the cadence respects the user's last choice.
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMarketData(selectedPair, granularity);
    }, 60_000);
    return () => clearInterval(interval);
  }, [selectedPair, granularity, fetchMarketData]);

  // Simulate smooth price updates between API calls
  useEffect(() => {
    if (isLoading) return;
    const interval = setInterval(() => {
      setCandleData((prev) => {
        const last = prev[prev.length - 1];
        if (!last) return prev;

        const change = (Math.random() - 0.48) * 0.0005;
        const newClose = Number((last.close + change).toFixed(5));
        const newHigh = Math.max(last.high, newClose + Math.random() * 0.0003);
        const newLow = Math.min(last.low, newClose - Math.random() * 0.0003);

        const updated = [...prev];
        updated[updated.length - 1] = {
          ...last,
          high: Number(newHigh.toFixed(5)),
          low: Number(newLow.toFixed(5)),
          close: newClose,
        };

        setCurrentPrice(newClose);
        const fallbackPrice = FALLBACK_PRICES[selectedPair] ?? 1.0850;
        setPriceChange(((newClose - fallbackPrice) / fallbackPrice) * 100);
        setIsPositive(newClose >= fallbackPrice);

        return updated;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [selectedPair, isLoading]);

  // ── Live insight cards ──
  // Recomputed only when the candle series itself changes (which already
  // happens on pair change, poll tick, and the 2-second jitter tick).
  // Below the warm-up threshold we render three neutral "loading" cards
  // so the layout stays stable while data streams in — the indicators
  // can't produce stable values with fewer than ~35 intraday bars.

  const insightCards: InsightCard[] = useMemo(() => {
    const warmingUp = (id: InsightCard["id"], title: string): InsightCard => ({
      id,
      title,
      description: "Loading more data…",
      tagline: "Warming up",
      sentiment: "neutral",
      ready: false,
    });
    if (candleData.length < 35) {
      return [
        warmingUp("price-action", "Price Action"),
        warmingUp("ma-cross", "MA Cross"),
        warmingUp("rsi-macd", "RSI / MACD"),
      ];
    }
    return [
      summarizePriceAction(candleData),
      summarizeMaCross(candleData),
      summarizeRsiMacd(candleData),
    ];
  }, [candleData]);

  // ── SVG Candlestick chart ──

  const renderCandleChart = useCallback(() => {
    if (!candleData.length || !chartContainerRef.current) return null;

    const width = chartContainerRef.current.clientWidth;
    const height = chartContainerRef.current.clientHeight;
    const padding = { top: 30, right: 20, bottom: 30, left: 70 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const prices = candleData.flatMap((d) => [d.high, d.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 0.001;

    const scaleY = (price: number) =>
      padding.top + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
    const candleWidth = Math.max(2, chartWidth / candleData.length - 1);

    // Grid lines
    const gridLines = 5;
    const gridValues = Array.from({ length: gridLines }, (_, i) =>
      minPrice + (priceRange * (i + 1)) / (gridLines + 1)
    );

    // MA calculation (20-period)
    const maPeriod = 20;
    const maValues = candleData.map((_, i) => {
      if (i < maPeriod - 1) return null;
      const sum = candleData.slice(i - maPeriod + 1, i + 1).reduce((s, c) => s + c.close, 0);
      return sum / maPeriod;
    });

    return (
      <svg width={width} height={height} className="w-full h-full">
        {/* Grid lines */}
        {gridValues.map((val, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              y1={scaleY(val)}
              x2={width - padding.right}
              y2={scaleY(val)}
              stroke="currentColor"
              className="text-border/50"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <text
              x={padding.left - 8}
              y={scaleY(val) + 3}
              textAnchor="end"
              className="fill-muted-foreground text-[10px]"
            >
              {val.toFixed(5)}
            </text>
          </g>
        ))}

        {/* Candles */}
        {candleData.map((d, i) => {
          const x = padding.left + (i / candleData.length) * chartWidth;
          const isUp = d.close >= d.open;
          const color = isUp ? "#10b981" : "#ef4444";

          return (
            <g key={i}>
              <line
                x1={x + candleWidth / 2}
                y1={scaleY(d.high)}
                x2={x + candleWidth / 2}
                y2={scaleY(d.low)}
                stroke={color}
                strokeWidth="1"
              />
              <rect
                x={x}
                y={scaleY(Math.max(d.open, d.close))}
                width={candleWidth}
                height={Math.max(1, Math.abs(scaleY(d.open) - scaleY(d.close)))}
                fill={color}
                rx="1"
              />
            </g>
          );
        })}

        {/* Moving Average */}
        <path
          d={maValues
            .map((val, i) => {
              if (val === null) return "";
              const x = padding.left + (i / candleData.length) * chartWidth + candleWidth / 2;
              const y = scaleY(val);
              return `${i === maPeriod - 1 ? "M" : "L"}${x},${y}`;
            })
            .join(" ")}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="1.5"
          opacity={0.7}
        />

        {/* X-axis labels */}
        {[0, Math.floor(candleData.length / 4), Math.floor(candleData.length / 2), Math.floor((3 * candleData.length) / 4), candleData.length - 1].map((index) => {
          if (index >= candleData.length) return null;
          const d = candleData[index];
          const x = padding.left + (index / candleData.length) * chartWidth;
          const time = new Date(d.time);
          return (
            <text
              key={index}
              x={x}
              y={height - 8}
              textAnchor="middle"
              className="fill-muted-foreground text-[9px]"
            >
              {time.getHours().toString().padStart(2, "0")}:{time.getMinutes().toString().padStart(2, "0")}
            </text>
          );
        })}
      </svg>
    );
  }, [candleData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-accent/10">
            <TrendingUp className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Chart Lens</h1>
          </div>
          {dataSource === "api" && (
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
              LIVE
            </span>
          )}
        </div>
        <p className="text-muted-foreground">
          Real-time forex charts with AI-powered pattern recognition and technical analysis.
        </p>
      </motion.div>

      {/* Price Ticker */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex items-center gap-6 rounded-xl border border-border bg-card px-5 py-3"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold">{selectedPair}</span>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <>
              <span className={cn("text-lg font-bold tabular-nums", isPositive ? "text-emerald-400" : "text-red-400")}>
                {currentPrice.toFixed(5)}
              </span>
              <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded", isPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")}>
                {isPositive ? "+" : ""}{priceChange.toFixed(2)}%
              </span>
            </>
          )}
        </div>
        <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
          <span>O: {candleData[candleData.length - 1]?.open.toFixed(5) ?? "—"}</span>
          <span>H: {candleData[candleData.length - 1]?.high.toFixed(5) ?? "—"}</span>
          <span>L: {candleData[candleData.length - 1]?.low.toFixed(5) ?? "—"}</span>
          <span>C: {candleData[candleData.length - 1]?.close.toFixed(5) ?? "—"}</span>
          {bidPrice != null && askPrice != null && (
            <>
              <span className="text-emerald-400/80">Bid: {bidPrice.toFixed(5)}</span>
              <span className="text-red-400/80">Ask: {askPrice.toFixed(5)}</span>
            </>
          )}
        </div>
        {lastUpdated && (
          <span className="ml-auto hidden lg:block text-[10px] text-muted-foreground">
            Updated: {new Date(lastUpdated).toLocaleTimeString()}
          </span>
        )}
      </motion.div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={cn(
          "rounded-xl border border-border bg-card overflow-hidden",
          isFullscreen && "fixed inset-4 z-50"
        )}
      >
        {/* Toolbar */}
        <div className="flex items-center justify-between p-3 border-b border-border">
          <div className="flex items-center gap-2">
            <select
              value={selectedPair}
              onChange={(e) => setSelectedPair(e.target.value)}
              className="bg-muted text-sm rounded-lg px-3 py-1.5 border border-border outline-none"
            >
              {MAJOR_PAIRS.map((pair) => (
                <option key={pair.symbol} value={pair.symbol}>{pair.symbol}</option>
              ))}
            </select>
            <div className="flex bg-muted rounded-lg p-0.5">
              {TIMEFRAME_PILLS.map((tf) => (
                <button
                  key={tf}
                  onClick={() => handleTimeframeChange(tf)}
                  className={cn(
                    "px-2.5 py-1 text-xs rounded-md transition-colors",
                    displayedTf === tf
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mr-2" />}
            <button
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              title="Refresh"
              onClick={() => fetchMarketData(selectedPair, granularity)}
            >
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Maximize2 className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* SVG Chart */}
        <div
          ref={chartContainerRef}
          className={cn("w-full relative", isFullscreen ? "h-[calc(100vh-200px)]" : "h-[400px] lg:h-[500px]")}
        >
          {renderCandleChart()}

          {/* Loading overlay */}
          {isLoading && candleData.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-card/60 backdrop-blur-sm">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Fetching market data...</p>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !candleData.length && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="p-4 rounded-xl bg-accent/10 mb-4 inline-block">
                  <BarChart3 className="h-12 w-12 text-accent/60" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Chart Data</h3>
                <p className="text-sm text-muted-foreground">Select a pair and timeframe to begin</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Indicators + Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Indicators panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-xl border border-border bg-card p-4"
        >
          <h3 className="font-semibold text-sm mb-3">Indicators</h3>
          <div className="space-y-2">
            {INDICATORS.map((ind) => (
              <label key={ind.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer">
                <span className="text-xs">{ind.label}</span>
                <div className={cn(
                  "w-8 h-4 rounded-full transition-colors relative",
                  ind.active ? "bg-primary" : "bg-muted"
                )}>
                  <div className={cn(
                    "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all",
                    ind.active ? "left-4" : "left-0.5"
                  )} />
                </div>
              </label>
            ))}
          </div>
          {dailyCandles.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border">
              <p className="text-[10px] text-muted-foreground">
                Daily candles: {dailyCandles.length} days
              </p>
              <p className="text-[10px] text-muted-foreground">
                {dailyCandles[0]?.time} — {dailyCandles[dailyCandles.length - 1]?.time}
              </p>
            </div>
          )}
        </motion.div>

        {/* Live insights — derived from `candleData` via pure local
            indicator math (`src/lib/indicators.ts` + `src/lib/insights.ts`).
            Recomputes when the candle series changes; no Grok / no network. */}
        {insightCards.map((card, i) => {
          const visuals = INSIGHT_VISUALS[card.id];
          const Icon = visuals.icon;
          const tone = SENTIMENT_TONE[card.sentiment];
          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              data-testid={`insight-${card.id}`}
              data-ready={card.ready ? "true" : "false"}
              data-sentiment={card.sentiment}
              className={cn(
                "rounded-xl border bg-card p-5 transition-colors",
                card.ready
                  ? "border-border hover:border-primary/30"
                  : "border-dashed border-border/60 opacity-70",
              )}
            >
              <div className={cn("p-2.5 rounded-lg w-fit mb-3", tone.bg)}>
                <Icon className={cn("h-5 w-5", tone.icon)} />
              </div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <h3 className="font-semibold text-sm">{card.title}</h3>
                <span
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                    tone.chipBorder,
                    tone.chipText,
                  )}
                >
                  {card.tagline}
                </span>
              </div>
              <p
                className={cn(
                  "text-xs leading-relaxed",
                  card.ready ? "text-muted-foreground" : "text-muted-foreground/70 italic",
                )}
              >
                {card.description}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
