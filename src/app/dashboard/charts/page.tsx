"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  BarChart3,
  RefreshCw,
  Clock,
  Maximize2,
  Minimize2,
  Download,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MAJOR_PAIRS } from "@/types";

// Generate realistic-looking candle data
function generateCandleData(count: number, basePrice = 1.0850) {
  const data: Array<{ time: string; open: number; high: number; low: number; close: number }> = [];
  let currentPrice = basePrice;
  const now = new Date();
  
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setMinutes(d.getMinutes() - i * 5);
    
    const change = (Math.random() - 0.48) * 0.002;
    const open = currentPrice;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * 0.001;
    const low = Math.min(open, close) - Math.random() * 0.001;
    
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

// Get a realistic base price for each currency pair
function getPairBasePrice(symbol: string): number {
  const prices: Record<string, number> = {
    EURUSD: 1.0850,
    GBPUSD: 1.2650,
    USDJPY: 151.50,
    USDCHF: 0.8820,
    AUDUSD: 0.6520,
    USDCAD: 1.3580,
    NZDUSD: 0.5950,
    EURGBP: 0.8570,
    EURJPY: 164.20,
    GBPJPY: 191.50,
    AUDJPY: 98.80,
    CHFJPY: 171.70,
    EURAUD: 1.6640,
    GBPAUD: 1.9400,
    XAUUSD: 2335.00,
    XAGUSD: 29.50,
  };
  return prices[symbol] ?? 1.0850;
}

const INDICATORS = [
  { id: "rsi", label: "RSI", active: false },
  { id: "macd", label: "MACD", active: false },
  { id: "ma", label: "Moving Avg", active: true },
  { id: "bb", label: "Bollinger", active: false },
];

export default function ChartLensPage() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [selectedPair, setSelectedPair] = useState("EURUSD");
  const [selectedTimeframe, setSelectedTimeframe] = useState("1H");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [candleData, setCandleData] = useState(() => generateCandleData(200));
  const [currentPrice, setCurrentPrice] = useState(1.0850);
  const [priceChange, setPriceChange] = useState(0.15);
  const [isPositive, setIsPositive] = useState(true);

  // Reset chart data when pair or timeframe changes
  useEffect(() => {
    const basePrice = getPairBasePrice(selectedPair) + (Math.random() - 0.5) * 0.01;
    const count = selectedTimeframe === "1D" ? 100 : selectedTimeframe === "1H" ? 200 : 300;
    setCandleData(generateCandleData(count, basePrice));
    setCurrentPrice(basePrice);
    setPriceChange(0);
    setIsPositive(true);
  }, [selectedPair, selectedTimeframe]);

  // Simulate real-time price updates
  useEffect(() => {
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
        const basePrice = getPairBasePrice(selectedPair);
        setPriceChange(((newClose - basePrice) / basePrice) * 100);
        setIsPositive(newClose >= basePrice);

        return updated;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [selectedPair]);

  // SVG chart rendering
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
              {/* Wick */}
              <line
                x1={x + candleWidth / 2}
                y1={scaleY(d.high)}
                x2={x + candleWidth / 2}
                y2={scaleY(d.low)}
                stroke={color}
                strokeWidth="1"
              />
              {/* Body */}
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

        {/* Moving Average line */}
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
          <h1 className="text-2xl font-bold">Chart Lens</h1>
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
          <span className={cn("text-lg font-bold tabular-nums", isPositive ? "text-emerald-400" : "text-red-400")}>
            {currentPrice.toFixed(5)}
          </span>
          <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded", isPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")}>
            {isPositive ? "+" : ""}{priceChange.toFixed(2)}%
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
          <span>O: {candleData[candleData.length - 1]?.open.toFixed(5)}</span>
          <span>H: {candleData[candleData.length - 1]?.high.toFixed(5)}</span>
          <span>L: {candleData[candleData.length - 1]?.low.toFixed(5)}</span>
          <span>C: {candleData[candleData.length - 1]?.close.toFixed(5)}</span>
        </div>
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
              {["1m", "5m", "15m", "1H", "4H", "1D"].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setSelectedTimeframe(tf)}
                  className={cn(
                    "px-2.5 py-1 text-xs rounded-md transition-colors",
                    selectedTimeframe === tf
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
            <button className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="Indicators">
              <Settings2 className="h-4 w-4 text-muted-foreground" />
            </button>
            <button className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="Refresh">
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
          className={cn("w-full", isFullscreen ? "h-[calc(100vh-200px)]" : "h-[400px] lg:h-[500px]")}
        >
          {renderCandleChart()}
        </div>

        {/* Overlay when empty */}
        {!candleData.length && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-muted/30 to-background">
            <div className="text-center">
              <div className="p-4 rounded-xl bg-accent/10 mb-4 inline-block">
                <BarChart3 className="h-12 w-12 text-accent/60" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Loading Chart Data...</h3>
              <p className="text-sm text-muted-foreground">Fetching real-time market data</p>
            </div>
          </div>
        )}
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
        </motion.div>

        {/* AI Insights */}
        {[
          {
            title: "Market Sentiment",
            description: "Bullish momentum with potential resistance at recent highs. Watch for breakout confirmation.",
            icon: Clock,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
          },
          {
            title: "Pattern Detection",
            description: "Ascending triangle forming on 1H. Breakout above resistance would confirm bullish continuation.",
            icon: TrendingUp,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
          },
          {
            title: "Technical Signals",
            description: "RSI at 58 (neutral), MACD bullish crossover, price above 50 MA. Favorable conditions.",
            icon: BarChart3,
            color: "text-violet-400",
            bg: "bg-violet-500/10",
          },
        ].map((insight, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.05 }}
            className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-colors"
          >
            <div className={cn("p-2.5 rounded-lg w-fit mb-3", insight.bg)}>
              <insight.icon className={cn("h-5 w-5", insight.color)} />
            </div>
            <h3 className="font-semibold mb-1 text-sm">{insight.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
