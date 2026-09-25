"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  RefreshCw,
  Maximize2,
  Minimize2,
  Loader2,
  Activity,
  Layers,
  Gauge,
  Sparkles,
  ShieldAlert,
  Target,
  CheckCircle2,
  Zap,
  Crosshair,
  Eye,
  EyeOff,
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
import {
  calculateStrategySignals,
  type TradeSignal,
  type StrategyResult,
} from "@/lib/strategy";
import { LiveCommentaryHud } from "@/components/trading/live-commentary-hud";
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

  // Indicator & Strategy state
  const [showEma, setShowEma] = useState(true);
  const [showBollinger, setShowBollinger] = useState(true);
  const [showSignals, setShowSignals] = useState(true);
  const [subChart, setSubChart] = useState<"none" | "rsi" | "macd">("rsi");
  const [selectedSignal, setSelectedSignal] = useState<TradeSignal | null>(null);

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
        setCandleData(generateIntradayCandles(data.candles, 180, pfp));
      } else {
        setCandleData(generateIntradayCandles([], 180, pfp));
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
      setCandleData(generateIntradayCandles([], 180, fp));
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

  // Compute Professional Strategy Confluence Signals & Indicators
  const strategyResult: StrategyResult = useMemo(() => {
    return calculateStrategySignals(candleData, { cooldownBars: 10, minConfidence: 65 });
  }, [candleData]);

  const activeTrade = selectedSignal || strategyResult.activeSignal;

  const insightCards: InsightCard[] = useMemo(() => {
    const warmingUp = (id: InsightCard["id"], title: string): InsightCard => ({
      id, title, description: "Loading more data…", tagline: "Warming up", sentiment: "neutral", ready: false,
    });
    if (candleData.length < 35) return [warmingUp("price-action", "Price Action"), warmingUp("ma-cross", "MA Cross"), warmingUp("rsi-macd", "RSI / MACD")];
    return [summarizePriceAction(candleData), summarizeMaCross(candleData), summarizeRsiMacd(candleData)];
  }, [candleData]);

  // SVG Chart Renderer with Overlays, Sub-charts, and Signals
  const renderCandleChart = useCallback(() => {
    if (!candleData.length || !chartContainerRef.current) return null;
    const width = chartContainerRef.current.clientWidth || 800;
    const height = chartContainerRef.current.clientHeight || 500;

    const hasSubChart = subChart !== "none";
    const subChartHeight = hasSubChart ? 96 : 0;
    const subChartGap = hasSubChart ? 20 : 0;
    const padding = { top: 32, right: 74, bottom: 28, left: 16 };
    const cw = Math.max(100, width - padding.left - padding.right);
    const ch = Math.max(100, height - padding.top - padding.bottom - subChartHeight - subChartGap);

    const prices = candleData.flatMap((d) => [d.high, d.low]);
    if (showBollinger && strategyResult.indicators.bb.upper.length) {
      strategyResult.indicators.bb.upper.forEach((u) => { if (!Number.isNaN(u)) prices.push(u); });
      strategyResult.indicators.bb.lower.forEach((l) => { if (!Number.isNaN(l)) prices.push(l); });
    }
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const range = maxP - minP || 0.001;
    const sy = (p: number) => padding.top + ch - ((p - minP) / range) * ch;
    const sx = (i: number) => padding.left + (i / Math.max(1, candleData.length - 1)) * cw;
    const bw = Math.max(2, Math.min(8, (cw / candleData.length) * 0.65));

    const gridValues = Array.from({ length: 5 }, (_, i) => minP + (range * (i + 1)) / 6);

    // Build Bollinger Area Path
    let bbPolygon = "";
    if (showBollinger && strategyResult.indicators.bb.upper.length) {
      const upperPoints: string[] = [];
      const lowerPointsReversed: string[] = [];
      for (let i = 0; i < candleData.length; i++) {
        const u = strategyResult.indicators.bb.upper[i];
        const l = strategyResult.indicators.bb.lower[i];
        if (!Number.isNaN(u) && !Number.isNaN(l)) {
          const x = sx(i);
          upperPoints.push(`${x},${sy(u)}`);
          lowerPointsReversed.unshift(`${x},${sy(l)}`);
        }
      }
      if (upperPoints.length > 0) {
        bbPolygon = `M ${upperPoints.join(" L ")} L ${lowerPointsReversed.join(" L ")} Z`;
      }
    }

    // Sub-Chart Calculations
    const subTop = padding.top + ch + subChartGap;
    const subBottom = subTop + subChartHeight;

    return (
      <svg width={width} height={height} className="w-full h-full select-none">
        <defs>
          <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#22c55e" floodOpacity="0.6" />
          </filter>
          <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#ef4444" floodOpacity="0.6" />
          </filter>
          <linearGradient id="bb-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.08" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.02" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.08" />
          </linearGradient>
          <linearGradient id="rsi-zone" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Horizontal Price Grid Lines */}
        {gridValues.map((v, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              y1={sy(v)}
              x2={width - padding.right}
              y2={sy(v)}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
            <text
              x={width - padding.right + 8}
              y={sy(v) + 3}
              textAnchor="start"
              fill="rgba(255,255,255,0.4)"
              fontSize={10}
              fontFamily="monospace"
            >
              {v.toFixed(5)}
            </text>
          </g>
        ))}

        {/* Bollinger Bands Shaded Area & Lines */}
        {showBollinger && bbPolygon && (
          <g>
            <path d={bbPolygon} fill="url(#bb-grad)" />
            {/* Upper band */}
            <path
              d={strategyResult.indicators.bb.upper.map((v, i) => {
                if (Number.isNaN(v)) return "";
                return `${i === 20 ? "M" : "L"}${sx(i)},${sy(v)}`;
              }).join(" ")}
              fill="none"
              stroke="#38bdf8"
              strokeWidth={1.2}
              strokeDasharray="3 3"
              opacity={0.65}
            />
            {/* Lower band */}
            <path
              d={strategyResult.indicators.bb.lower.map((v, i) => {
                if (Number.isNaN(v)) return "";
                return `${i === 20 ? "M" : "L"}${sx(i)},${sy(v)}`;
              }).join(" ")}
              fill="none"
              stroke="#38bdf8"
              strokeWidth={1.2}
              strokeDasharray="3 3"
              opacity={0.65}
            />
            {/* Middle SMA 20 */}
            <path
              d={strategyResult.indicators.bb.middle.map((v, i) => {
                if (Number.isNaN(v)) return "";
                return `${i === 19 ? "M" : "L"}${sx(i)},${sy(v)}`;
              }).join(" ")}
              fill="none"
              stroke="#94a3b8"
              strokeWidth={1}
              strokeDasharray="4 4"
              opacity={0.4}
            />
          </g>
        )}

        {/* EMA 21 (Slow Trend - Violet) */}
        {showEma && strategyResult.indicators.ema21.length > 0 && (
          <path
            d={strategyResult.indicators.ema21.map((v, i) => {
              if (Number.isNaN(v)) return "";
              return `${i === 20 ? "M" : "L"}${sx(i)},${sy(v)}`;
            }).join(" ")}
            fill="none"
            stroke="#a855f7"
            strokeWidth={1.8}
            opacity={0.85}
          />
        )}

        {/* EMA 9 (Fast Momentum - Cyan) */}
        {showEma && strategyResult.indicators.ema9.length > 0 && (
          <path
            d={strategyResult.indicators.ema9.map((v, i) => {
              if (Number.isNaN(v)) return "";
              return `${i === 8 ? "M" : "L"}${sx(i)},${sy(v)}`;
            }).join(" ")}
            fill="none"
            stroke="#06b6d4"
            strokeWidth={1.8}
            opacity={0.9}
          />
        )}

        {/* Candlesticks */}
        {candleData.map((d, i) => {
          const x = sx(i);
          const up = d.close >= d.open;
          const col = up ? "#22c55e" : "#ef4444";
          const bodyY = sy(Math.max(d.open, d.close));
          const bodyHeight = Math.max(1.5, Math.abs(sy(d.open) - sy(d.close)));

          return (
            <g key={i}>
              <line
                x1={x}
                y1={sy(d.high)}
                x2={x}
                y2={sy(d.low)}
                stroke={col}
                strokeWidth={1.2}
              />
              <rect
                x={x - bw / 2}
                y={bodyY}
                width={bw}
                height={bodyHeight}
                fill={col}
                rx={1}
              />
            </g>
          );
        })}

        {/* Active Trade Bracket Projection (SL / TP1 / TP2) */}
        {showSignals && activeTrade && (
          <g>
            {/* Risk Zone Box */}
            <rect
              x={sx(activeTrade.index)}
              y={activeTrade.type === "BUY" ? sy(activeTrade.price) : sy(activeTrade.stopLoss)}
              width={width - padding.right - sx(activeTrade.index)}
              height={Math.abs(sy(activeTrade.price) - sy(activeTrade.stopLoss))}
              fill="rgba(239, 68, 68, 0.08)"
            />
            {/* Target 1 Profit Zone Box */}
            <rect
              x={sx(activeTrade.index)}
              y={activeTrade.type === "BUY" ? sy(activeTrade.takeProfit1) : sy(activeTrade.price)}
              width={width - padding.right - sx(activeTrade.index)}
              height={Math.abs(sy(activeTrade.price) - sy(activeTrade.takeProfit1))}
              fill="rgba(34, 197, 94, 0.08)"
            />

            {/* Entry Line */}
            <line
              x1={sx(activeTrade.index)}
              y1={sy(activeTrade.price)}
              x2={width - padding.right}
              y2={sy(activeTrade.price)}
              stroke="#e2e8f0"
              strokeWidth={1.2}
              strokeDasharray="4 3"
            />
            {/* Stop Loss Line */}
            <line
              x1={sx(activeTrade.index)}
              y1={sy(activeTrade.stopLoss)}
              x2={width - padding.right}
              y2={sy(activeTrade.stopLoss)}
              stroke="#ef4444"
              strokeWidth={1.5}
              strokeDasharray="5 3"
            />
            {/* TP1 Line */}
            <line
              x1={sx(activeTrade.index)}
              y1={sy(activeTrade.takeProfit1)}
              x2={width - padding.right}
              y2={sy(activeTrade.takeProfit1)}
              stroke="#22c55e"
              strokeWidth={1.5}
              strokeDasharray="5 3"
            />
            {/* TP2 Line */}
            <line
              x1={sx(activeTrade.index)}
              y1={sy(activeTrade.takeProfit2)}
              x2={width - padding.right}
              y2={sy(activeTrade.takeProfit2)}
              stroke="#10b981"
              strokeWidth={1.2}
              strokeDasharray="2 2"
            />

            {/* Bracket Labels */}
            <text
              x={width - padding.right + 6}
              y={sy(activeTrade.takeProfit1) + 3}
              fill="#22c55e"
              fontSize={9}
              fontWeight="bold"
            >
              TP1 +1.5R
            </text>
            <text
              x={width - padding.right + 6}
              y={sy(activeTrade.stopLoss) + 3}
              fill="#ef4444"
              fontSize={9}
              fontWeight="bold"
            >
              SL -1.0R
            </text>
          </g>
        )}

        {/* Current Live Price Level */}
        <line
          x1={padding.left}
          y1={sy(currentPrice)}
          x2={width - padding.right}
          y2={sy(currentPrice)}
          stroke={isPositive ? "#22c55e" : "#ef4444"}
          strokeWidth={1.2}
          strokeDasharray="3 3"
        />
        <g transform={`translate(${width - padding.right}, ${sy(currentPrice) - 9})`}>
          <rect
            width={64}
            height={18}
            rx={4}
            fill={isPositive ? "#16a34a" : "#dc2626"}
          />
          <text
            x={32}
            y={12}
            textAnchor="middle"
            fill="#ffffff"
            fontSize={10}
            fontWeight="bold"
            fontFamily="monospace"
          >
            {currentPrice.toFixed(5)}
          </text>
        </g>

        {/* Buy & Sell Signals Printed Directly On Chart */}
        {showSignals && strategyResult.signals.map((sig) => {
          const x = sx(sig.index);
          const isBuy = sig.type === "BUY";
          const candle = candleData[sig.index];
          if (!candle) return null;

          if (isBuy) {
            const yAnchor = sy(candle.low) + 12;
            return (
              <g
                key={sig.id}
                className="cursor-pointer transition-transform hover:scale-110"
                onClick={() => setSelectedSignal(sig)}
              >
                {/* Upward Triangle */}
                <polygon
                  points={`${x},${yAnchor} ${x - 5},${yAnchor + 8} ${x + 5},${yAnchor + 8}`}
                  fill="#22c55e"
                />
                {/* Pill Badge */}
                <rect
                  x={x - 38}
                  y={yAnchor + 9}
                  width={76}
                  height={20}
                  rx={5}
                  fill="#052e16"
                  stroke="#22c55e"
                  strokeWidth={1.2}
                  filter="url(#glow-green)"
                />
                <text
                  x={x}
                  y={yAnchor + 23}
                  textAnchor="middle"
                  fill="#4ade80"
                  fontSize={10}
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  ▲ BUY {sig.price.toFixed(4)}
                </text>
              </g>
            );
          } else {
            const yAnchor = sy(candle.high) - 12;
            return (
              <g
                key={sig.id}
                className="cursor-pointer transition-transform hover:scale-110"
                onClick={() => setSelectedSignal(sig)}
              >
                {/* Downward Triangle */}
                <polygon
                  points={`${x},${yAnchor} ${x - 5},${yAnchor - 8} ${x + 5},${yAnchor - 8}`}
                  fill="#ef4444"
                />
                {/* Pill Badge */}
                <rect
                  x={x - 40}
                  y={yAnchor - 29}
                  width={80}
                  height={20}
                  rx={5}
                  fill="#450a0a"
                  stroke="#ef4444"
                  strokeWidth={1.2}
                  filter="url(#glow-red)"
                />
                <text
                  x={x}
                  y={yAnchor - 15}
                  textAnchor="middle"
                  fill="#f87171"
                  fontSize={10}
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  ▼ SELL {sig.price.toFixed(4)}
                </text>
              </g>
            );
          }
        })}

        {/* Sub-Chart (RSI or MACD) */}
        {hasSubChart && (
          <g transform={`translate(0, ${subTop})`}>
            {/* Sub-chart separator */}
            <line
              x1={padding.left}
              y1={0}
              x2={width - padding.right}
              y2={0}
              stroke="rgba(255,255,255,0.15)"
              strokeWidth={1}
            />

            {subChart === "rsi" ? (
              // RSI (14) OSCILLATOR SUBPANEL
              <g>
                <text
                  x={padding.left + 6}
                  y={14}
                  fill="rgba(255,255,255,0.6)"
                  fontSize={10}
                  fontWeight="bold"
                >
                  RSI (14) • Momentum Oscillator
                </text>

                {/* 70 / 30 / 50 levels */}
                {(() => {
                  const syRsi = (v: number) => subChartHeight - ((v - 15) / 70) * subChartHeight;
                  const rsiVals = strategyResult.indicators.rsi14;
                  const currentRsi = rsiVals[rsiVals.length - 1] ?? 50;

                  return (
                    <>
                      {/* Overbought 70 */}
                      <line
                        x1={padding.left}
                        y1={syRsi(70)}
                        x2={width - padding.right}
                        y2={syRsi(70)}
                        stroke="rgba(239, 68, 68, 0.4)"
                        strokeDasharray="3 3"
                        strokeWidth={1}
                      />
                      <text x={width - padding.right + 6} y={syRsi(70) + 3} fill="#ef4444" fontSize={9}>
                        70 OB
                      </text>

                      {/* Midline 50 */}
                      <line
                        x1={padding.left}
                        y1={syRsi(50)}
                        x2={width - padding.right}
                        y2={syRsi(50)}
                        stroke="rgba(255, 255, 255, 0.15)"
                        strokeDasharray="2 2"
                        strokeWidth={1}
                      />
                      <text x={width - padding.right + 6} y={syRsi(50) + 3} fill="rgba(255,255,255,0.3)" fontSize={9}>
                        50
                      </text>

                      {/* Oversold 30 */}
                      <line
                        x1={padding.left}
                        y1={syRsi(30)}
                        x2={width - padding.right}
                        y2={syRsi(30)}
                        stroke="rgba(34, 197, 94, 0.4)"
                        strokeDasharray="3 3"
                        strokeWidth={1}
                      />
                      <text x={width - padding.right + 6} y={syRsi(30) + 3} fill="#22c55e" fontSize={9}>
                        30 OS
                      </text>

                      {/* RSI Channel Zone between 30 and 70 */}
                      <rect
                        x={padding.left}
                        y={syRsi(70)}
                        width={cw}
                        height={Math.abs(syRsi(30) - syRsi(70))}
                        fill="url(#rsi-zone)"
                      />

                      {/* RSI Path */}
                      <path
                        d={rsiVals.map((v, i) => {
                          if (Number.isNaN(v)) return "";
                          return `${i === 14 ? "M" : "L"}${sx(i)},${syRsi(v)}`;
                        }).join(" ")}
                        fill="none"
                        stroke="#818cf8"
                        strokeWidth={1.8}
                      />

                      {/* Current RSI Badge */}
                      <rect
                        x={width - padding.right + 4}
                        y={syRsi(currentRsi) - 8}
                        width={42}
                        height={16}
                        rx={3}
                        fill="#4338ca"
                      />
                      <text
                        x={width - padding.right + 25}
                        y={syRsi(currentRsi) + 3}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize={9}
                        fontWeight="bold"
                      >
                        {currentRsi.toFixed(1)}
                      </text>
                    </>
                  );
                })()}
              </g>
            ) : (
              // MACD (12, 26, 9) SUBPANEL
              <g>
                <text
                  x={padding.left + 6}
                  y={14}
                  fill="rgba(255,255,255,0.6)"
                  fontSize={10}
                  fontWeight="bold"
                >
                  MACD (12, 26, 9) • Trend Oscillator
                </text>
                {(() => {
                  const macdHist = strategyResult.indicators.macd.histogram;
                  const macdLine = strategyResult.indicators.macd.macd;
                  const sigLine = strategyResult.indicators.macd.signal;

                  const allVals = [...macdHist, ...macdLine, ...sigLine].filter((v) => !Number.isNaN(v));
                  const maxAbs = Math.max(...allVals.map(Math.abs), 0.0005);
                  const zeroY = subChartHeight / 2 + 6;
                  const syMacd = (v: number) => zeroY - (v / maxAbs) * (subChartHeight / 2 - 12);

                  return (
                    <>
                      {/* Zero Center Line */}
                      <line
                        x1={padding.left}
                        y1={zeroY}
                        x2={width - padding.right}
                        y2={zeroY}
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth={1}
                      />

                      {/* Histogram Bars */}
                      {macdHist.map((h, i) => {
                        if (Number.isNaN(h)) return null;
                        const barX = sx(i);
                        const isPos = h >= 0;
                        const topY = isPos ? syMacd(h) : zeroY;
                        const barH = Math.max(1, Math.abs(syMacd(h) - zeroY));
                        return (
                          <rect
                            key={i}
                            x={barX - bw / 2}
                            y={topY}
                            width={bw}
                            height={barH}
                            fill={isPos ? "#22c55e" : "#ef4444"}
                            opacity={0.8}
                          />
                        );
                      })}

                      {/* MACD Line (Cyan) */}
                      <path
                        d={macdLine.map((v, i) => {
                          if (Number.isNaN(v)) return "";
                          return `${i === 26 ? "M" : "L"}${sx(i)},${syMacd(v)}`;
                        }).join(" ")}
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth={1.6}
                      />

                      {/* Signal Line (Amber) */}
                      <path
                        d={sigLine.map((v, i) => {
                          if (Number.isNaN(v)) return "";
                          return `${i === 34 ? "M" : "L"}${sx(i)},${syMacd(v)}`;
                        }).join(" ")}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth={1.4}
                      />
                    </>
                  );
                })()}
              </g>
            )}
          </g>
        )}

        {/* Time Axis Labels */}
        {[0, Math.floor(candleData.length / 4), Math.floor(candleData.length / 2), Math.floor((3 * candleData.length) / 4), candleData.length - 1].map((idx) => {
          if (idx >= candleData.length) return null;
          const d = candleData[idx];
          const x = sx(idx);
          const t = new Date(d.time);
          return (
            <text
              key={idx}
              x={x}
              y={height - 8}
              textAnchor="middle"
              fill="rgba(255,255,255,0.4)"
              fontSize={10}
              fontFamily="monospace"
            >
              {t.getHours().toString().padStart(2, "0")}:{t.getMinutes().toString().padStart(2, "0")}
            </text>
          );
        })}
      </svg>
    );
  }, [candleData, showEma, showBollinger, showSignals, subChart, strategyResult, activeTrade, currentPrice, isPositive]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="inline-flex items-center gap-2 rounded-full border border-accent/15 bg-accent/10 px-3 py-1 text-[11px] font-bold tracking-[0.14em] text-accent">
          <BarChart3 className="h-3.5 w-3.5" /> INSTITUTIONAL CHART LENS
        </div>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Algorithmic Strategy & Precision Signals
            </h1>
            <p className="mt-1.5 text-sm text-white/45 max-w-2xl">
              Real-time multi-factor trend and volatility confluence engine. Featuring EMA 9/21 baseline,
              Bollinger Bands (20, 2), RSI momentum, and automated Stop Loss & Take Profit targets.
            </p>
          </div>
          {dataSource === "api" && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/15 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold tracking-wide text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE FEED
            </span>
          )}
        </div>
      </motion.div>

      {/* Live AI Voice Commentary & Fundamental Intelligence (Gemini 3.1 Flash Live Preview • Voice: Aoede) */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }}>
        <LiveCommentaryHud
          symbol={selectedPair}
          currentPrice={currentPrice}
          priceChange={priceChange}
          timeframe={displayedTf}
          strategyResult={strategyResult}
        />
      </motion.div>

      {/* Strategy Signal Radar HUD */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.04 }}
        className="rounded-[22px] border border-white/10 bg-gradient-to-r from-[#0b1428]/90 via-[#0d1c3a]/80 to-[#0b1428]/90 backdrop-blur p-4 sm:p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-11 w-11 items-center justify-center rounded-xl border font-bold text-sm",
              activeTrade?.type === "BUY"
                ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-300 shadow-[0_0_15px_rgba(34,197,94,0.2)]"
                : activeTrade?.type === "SELL"
                ? "border-red-400/30 bg-red-500/15 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                : "border-white/10 bg-white/5 text-white/60"
            )}>
              {activeTrade?.type === "BUY" ? <TrendingUp className="h-5 w-5" /> : activeTrade?.type === "SELL" ? <TrendingDown className="h-5 w-5" /> : <Crosshair className="h-5 w-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-white/50">Strategy Confluence Engine</span>
                <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">ITMC v2.4</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  {activeTrade ? (
                    <span className={activeTrade.type === "BUY" ? "text-emerald-300" : "text-red-300"}>
                      {activeTrade.type} Signal Triggered @ {activeTrade.price.toFixed(5)}
                    </span>
                  ) : (
                    "Scanning Market For Confluence Breakout..."
                  )}
                </h2>
                {activeTrade && (
                  <span className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[11px] font-mono font-medium text-white/70">
                    R:R {activeTrade.riskReward}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Market Regime Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5">
              <span className="text-white/40 mr-1.5">Trend:</span>
              <span className={cn(
                "font-bold",
                strategyResult.marketRegime.trend.includes("BULLISH") ? "text-emerald-300" :
                strategyResult.marketRegime.trend.includes("BEARISH") ? "text-red-300" : "text-amber-300"
              )}>
                {strategyResult.marketRegime.trend.replace("_", " ")}
              </span>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5">
              <span className="text-white/40 mr-1.5">RSI:</span>
              <span className="font-semibold text-white/80">{strategyResult.marketRegime.rsiState}</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5">
              <span className="text-white/40 mr-1.5">Bollinger:</span>
              <span className="font-semibold text-cyan-300">{strategyResult.marketRegime.volatilityState}</span>
            </div>
          </div>
        </div>

        {/* Trade Execution Metrics */}
        {activeTrade ? (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
              <div className="flex items-center gap-1.5 text-[11px] text-white/40">
                <Target className="h-3.5 w-3.5 text-primary" /> Entry Price
              </div>
              <div className="mt-1 font-mono text-sm font-bold text-white">{activeTrade.price.toFixed(5)}</div>
            </div>
            <div className="rounded-xl border border-red-500/15 bg-red-500/5 p-2.5">
              <div className="flex items-center gap-1.5 text-[11px] text-red-300/60">
                <ShieldAlert className="h-3.5 w-3.5 text-red-400" /> Stop Loss (1.0R)
              </div>
              <div className="mt-1 font-mono text-sm font-bold text-red-300">{activeTrade.stopLoss.toFixed(5)}</div>
            </div>
            <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-2.5">
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-300/60">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Take Profit 1 (+1.5R)
              </div>
              <div className="mt-1 font-mono text-sm font-bold text-emerald-300">{activeTrade.takeProfit1.toFixed(5)}</div>
            </div>
            <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-2.5">
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-300/60">
                <Zap className="h-3.5 w-3.5 text-emerald-400" /> Take Profit 2 (+2.5R)
              </div>
              <div className="mt-1 font-mono text-sm font-bold text-emerald-300">{activeTrade.takeProfit2.toFixed(5)}</div>
            </div>
          </div>
        ) : null}

        {/* Confluence Breakdown Tags */}
        {activeTrade?.confluence && activeTrade.confluence.length > 0 && (
          <div className="mt-3.5 flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
            <span className="text-[11px] font-semibold text-white/40">Confirmed Confluences:</span>
            {activeTrade.confluence.map((conf, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[11px] font-medium text-white/80"
              >
                <span className="h-1 w-1 rounded-full bg-emerald-400" /> {conf}
              </span>
            ))}
          </div>
        )}
      </motion.div>

      {/* Price Ticker Strip */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
        className="flex flex-wrap items-center gap-4 rounded-[20px] border border-white/10 bg-[#0b1428]/60 backdrop-blur px-4 sm:px-5 py-3.5"
      >
        <span className="rounded-full bg-white/[0.06] border border-white/10 px-3 py-1 text-xs font-bold tracking-wide text-white">
          {selectedPair}
        </span>
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        ) : (
          <>
            <span className={cn("font-display text-lg font-bold tabular-nums", isPositive ? "text-emerald-300" : "text-red-300")}>
              {currentPrice.toFixed(5)}
            </span>
            <span className={cn("rounded-full border px-2 py-0.5 text-xs font-bold", isPositive ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-red-400/20 bg-red-400/10 text-red-300")}>
              {isPositive ? "+" : ""}{priceChange.toFixed(2)}%
            </span>
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

      {/* Main Interactive Chart Container */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className={cn("overflow-hidden rounded-[22px] border border-white/10 bg-[#0b1428]/60 backdrop-blur", isFullscreen && "fixed inset-3 z-50")}
      >
        {/* Chart Control Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <select
              value={selectedPair}
              onChange={(e) => setSelectedPair(e.target.value)}
              className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white outline-none focus:border-primary/30"
            >
              {MAJOR_PAIRS.map((p) => (
                <option key={p.symbol} value={p.symbol} className="bg-[#0b1428]">{p.symbol}</option>
              ))}
            </select>

            {/* Timeframe selector */}
            <div className="flex rounded-full border border-white/10 bg-white/[0.03] p-1">
              {TIMEFRAME_PILLS.map((tf) => (
                <button
                  key={tf}
                  onClick={() => handleTimeframeChange(tf)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
                    displayedTf === tf ? "bg-primary text-primary-foreground shadow" : "text-white/40 hover:text-white"
                  )}
                >
                  {tf}
                </button>
              ))}
            </div>

            {/* In-Chart Indicator Quick Toggles */}
            <div className="hidden md:flex items-center gap-1.5 pl-2 border-l border-white/10">
              <button
                onClick={() => setShowEma((v) => !v)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all border",
                  showEma
                    ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                    : "border-white/5 bg-white/[0.02] text-white/30 hover:text-white/60"
                )}
              >
                EMA 9/21
              </button>
              <button
                onClick={() => setShowBollinger((v) => !v)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all border",
                  showBollinger
                    ? "border-sky-500/30 bg-sky-500/10 text-sky-300"
                    : "border-white/5 bg-white/[0.02] text-white/30 hover:text-white/60"
                )}
              >
                Bollinger (20,2)
              </button>
              <button
                onClick={() => setShowSignals((v) => !v)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all border",
                  showSignals
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    : "border-white/5 bg-white/[0.02] text-white/30 hover:text-white/60"
                )}
              >
                Buy/Sell Signals ({strategyResult.signals.length})
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Sub-chart oscillator switcher */}
            <div className="flex rounded-full border border-white/10 bg-white/[0.03] p-1 text-xs">
              <button
                onClick={() => setSubChart("none")}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                  subChart === "none" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"
                )}
              >
                Sub Off
              </button>
              <button
                onClick={() => setSubChart("rsi")}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                  subChart === "rsi" ? "bg-indigo-500/20 text-indigo-300 font-bold" : "text-white/40 hover:text-white"
                )}
              >
                RSI (14)
              </button>
              <button
                onClick={() => setSubChart("macd")}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                  subChart === "macd" ? "bg-cyan-500/20 text-cyan-300 font-bold" : "text-white/40 hover:text-white"
                )}
              >
                MACD
              </button>
            </div>

            {isLoading && <Loader2 className="mx-1 h-4 w-4 animate-spin text-white/30" />}
            <button
              onClick={() => fetchMarketData(selectedPair, granularity)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/40 hover:text-white hover:bg-white/[0.08] transition-colors"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/40 hover:text-white transition-colors"
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* SVG Drawing Canvas */}
        <div
          ref={chartContainerRef}
          className={cn(
            "relative w-full",
            isFullscreen
              ? "h-[calc(100vh-160px)]"
              : subChart !== "none"
              ? "h-[480px] lg:h-[560px]"
              : "h-[420px] lg:h-[500px]"
          )}
        >
          {renderCandleChart()}

          {/* Chart Overlay Indicators Legend */}
          <div className="absolute top-3 left-4 flex flex-wrap items-center gap-3 text-[11px] bg-[#0b1428]/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 pointer-events-none">
            {showEma && (
              <>
                <span className="flex items-center gap-1.5 text-cyan-300 font-medium">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" /> EMA (9)
                </span>
                <span className="flex items-center gap-1.5 text-purple-300 font-medium">
                  <span className="h-2 w-2 rounded-full bg-purple-400" /> EMA (21)
                </span>
              </>
            )}
            {showBollinger && (
              <span className="flex items-center gap-1.5 text-sky-300 font-medium">
                <span className="h-2 w-2 rounded-full bg-sky-400" /> BB (20, 2)
              </span>
            )}
            {showSignals && (
              <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Signals ({strategyResult.signals.length})
              </span>
            )}
          </div>

          {isLoading && candleData.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0b1428]/60 backdrop-blur-sm">
              <div className="text-center">
                <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-white/40">Fetching institutional market data…</p>
              </div>
            </div>
          )}

          {!isLoading && !candleData.length && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 border border-accent/15 text-accent">
                  <BarChart3 className="h-7 w-7" />
                </div>
                <h3 className="font-display font-semibold text-white">No Chart Data</h3>
                <p className="text-sm text-white/40">Select a pair and timeframe to begin</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Bottom Control & Intelligence Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Indicators Panel */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="rounded-[20px] border border-white/10 bg-[#0b1428]/60 backdrop-blur p-5"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-white">Strategy Indicators</h3>
            <span className="text-[10px] text-primary font-bold uppercase tracking-wider">Live Controls</span>
          </div>

          <div className="mt-4 space-y-2">
            <button
              onClick={() => setShowEma((v) => !v)}
              className="w-full flex cursor-pointer items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.02] px-3 py-2.5 hover:bg-white/[0.04] transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                <span className="text-xs font-medium text-white/80">EMA (9 / 21) Trend</span>
              </div>
              <span className={cn("relative h-4 w-8 rounded-full transition-colors", showEma ? "bg-primary" : "bg-white/10")}>
                <span className={cn("absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all", showEma ? "left-4" : "left-0.5")} />
              </span>
            </button>

            <button
              onClick={() => setShowBollinger((v) => !v)}
              className="w-full flex cursor-pointer items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.02] px-3 py-2.5 hover:bg-white/[0.04] transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-sky-400" />
                <span className="text-xs font-medium text-white/80">Bollinger Bands (20, 2)</span>
              </div>
              <span className={cn("relative h-4 w-8 rounded-full transition-colors", showBollinger ? "bg-primary" : "bg-white/10")}>
                <span className={cn("absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all", showBollinger ? "left-4" : "left-0.5")} />
              </span>
            </button>

            <button
              onClick={() => setShowSignals((v) => !v)}
              className="w-full flex cursor-pointer items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.02] px-3 py-2.5 hover:bg-white/[0.04] transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-xs font-medium text-white/80">Profitable Buy & Sell Signals</span>
              </div>
              <span className={cn("relative h-4 w-8 rounded-full transition-colors", showSignals ? "bg-emerald-500" : "bg-white/10")}>
                <span className={cn("absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all", showSignals ? "left-4" : "left-0.5")} />
              </span>
            </button>

            <button
              onClick={() => setSubChart((prev) => prev === "rsi" ? "none" : "rsi")}
              className="w-full flex cursor-pointer items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.02] px-3 py-2.5 hover:bg-white/[0.04] transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-400" />
                <span className="text-xs font-medium text-white/80">RSI (14) Oscillator Sub-Panel</span>
              </div>
              <span className={cn("relative h-4 w-8 rounded-full transition-colors", subChart === "rsi" ? "bg-primary" : "bg-white/10")}>
                <span className={cn("absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all", subChart === "rsi" ? "left-4" : "left-0.5")} />
              </span>
            </button>

            <button
              onClick={() => setSubChart((prev) => prev === "macd" ? "none" : "macd")}
              className="w-full flex cursor-pointer items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.02] px-3 py-2.5 hover:bg-white/[0.04] transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <span className="text-xs font-medium text-white/80">MACD (12, 26, 9) Sub-Panel</span>
              </div>
              <span className={cn("relative h-4 w-8 rounded-full transition-colors", subChart === "macd" ? "bg-primary" : "bg-white/10")}>
                <span className={cn("absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all", subChart === "macd" ? "left-4" : "left-0.5")} />
              </span>
            </button>
          </div>

          {dailyCandles.length > 0 && (
            <div className="mt-4 border-t border-white/10 pt-3 text-[11px] text-white/30">
              {dailyCandles.length} daily bars • {dailyCandles[0]?.time} → {dailyCandles[dailyCandles.length - 1]?.time}
            </div>
          )}
        </motion.div>

        {/* Existing AI Insight Cards */}
        {insightCards.map((card, i) => {
          const Icon = INSIGHT_VISUALS[card.id].icon;
          const tone = SENTIMENT_TONE[card.sentiment];
          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 + i * 0.05 }}
              data-testid={`insight-${card.id}`}
              data-ready={card.ready ? "true" : "false"}
              data-sentiment={card.sentiment}
              className={cn(
                "rounded-[20px] border p-5 backdrop-blur transition-colors",
                card.ready
                  ? "border-white/10 bg-[#0b1428]/60 hover:border-primary/20"
                  : "border-dashed border-white/10 bg-[#0b1428]/30 opacity-70"
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl border",
                  tone.bg,
                  tone.icon === "text-emerald-300" ? "border-emerald-400/15" : tone.icon === "text-red-300" ? "border-red-400/15" : "border-white/10"
                )}
              >
                <Icon className={cn("h-4 w-4", tone.icon)} />
              </span>
              <div className="mt-3 flex items-center justify-between gap-2">
                <h3 className="font-display text-sm font-semibold text-white">{card.title}</h3>
                <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", tone.chipBorder, tone.chipText)}>
                  {card.tagline}
                </span>
              </div>
              <p className={cn("mt-2 text-xs leading-6", card.ready ? "text-white/45" : "text-white/30 italic")}>
                {card.description}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
