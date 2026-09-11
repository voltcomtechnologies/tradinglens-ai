"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  ChevronDown,
  Radio,
} from "lucide-react";
import { useSocketPrices } from "@/lib/hooks/use-socket";
import { MAJOR_PAIRS } from "@/types";

interface TickerItem {
  symbol: string;
  name: string;
  price: number;
  basePrice: number;
  change: number;
  bid: number;
  ask: number;
  updatedAt: number;
  history: number[];
}

const FALLBACK_TICKERS: Record<
  string,
  Omit<TickerItem, "updatedAt" | "history">
> = {
  EURUSD: { symbol: "EURUSD", name: "EUR/USD", price: 1.0847, basePrice: 1.0847, change: 0.24, bid: 1.0845, ask: 1.0849 },
  GBPUSD: { symbol: "GBPUSD", name: "GBP/USD", price: 1.2648, basePrice: 1.2648, change: 0.18, bid: 1.2646, ask: 1.2650 },
  USDJPY: { symbol: "USDJPY", name: "USD/JPY", price: 151.52, basePrice: 151.52, change: -0.12, bid: 151.50, ask: 151.54 },
  USDCHF: { symbol: "USDCHF", name: "USD/CHF", price: 0.9051, basePrice: 0.9051, change: 0.05, bid: 0.9049, ask: 0.9053 },
  AUDUSD: { symbol: "AUDUSD", name: "AUD/USD", price: 0.6502, basePrice: 0.6502, change: 0.31, bid: 0.6500, ask: 0.6504 },
  USDCAD: { symbol: "USDCAD", name: "USD/CAD", price: 1.3651, basePrice: 1.3651, change: -0.08, bid: 1.3649, ask: 1.3653 },
  NZDUSD: { symbol: "NZDUSD", name: "NZD/USD", price: 0.5951, basePrice: 0.5951, change: 0.15, bid: 0.5949, ask: 0.5953 },
  EURGBP: { symbol: "EURGBP", name: "EUR/GBP", price: 0.8579, basePrice: 0.8579, change: 0.06, bid: 0.8577, ask: 0.8581 },
  EURJPY: { symbol: "EURJPY", name: "EUR/JPY", price: 164.22, basePrice: 164.22, change: 0.11, bid: 164.20, ask: 164.24 },
  GBPJPY: { symbol: "GBPJPY", name: "GBP/JPY", price: 191.72, basePrice: 191.72, change: -0.05, bid: 191.70, ask: 191.74 },
  AUDJPY: { symbol: "AUDJPY", name: "AUD/JPY", price: 98.52, basePrice: 98.52, change: 0.43, bid: 98.50, ask: 98.54 },
  CHFJPY: { symbol: "CHFJPY", name: "CHF/JPY", price: 167.42, basePrice: 167.42, change: -0.17, bid: 167.40, ask: 167.44 },
  EURAUD: { symbol: "EURAUD", name: "EUR/AUD", price: 1.6691, basePrice: 1.6691, change: -0.07, bid: 1.6689, ask: 1.6693 },
  GBPAUD: { symbol: "GBPAUD", name: "GBP/AUD", price: 1.9471, basePrice: 1.9471, change: -0.13, bid: 1.9469, ask: 1.9473 },
  XAUUSD: { symbol: "XAUUSD", name: "Gold", price: 2335.2, basePrice: 2335.2, change: 0.56, bid: 2335.0, ask: 2335.4 },
  XAGUSD: { symbol: "XAGUSD", name: "Silver", price: 31.72, basePrice: 31.72, change: 0.22, bid: 31.70, ask: 31.74 },
};

/* Deterministic seed so SSR and client render identical sparklines */
function seedHistory(base: number): number[] {
  return Array.from({ length: 12 }, (_, i) => base * (1 + Math.sin(i / 2) * 0.0008));
}

function simulateTick(prev: TickerItem): TickerItem {
  const volatility = prev.price * 0.00015;
  const delta = (Math.random() - 0.48) * volatility;
  const spread = prev.ask - prev.bid || prev.price * 0.0002;
  const newPrice = prev.price + delta;
  const change = ((newPrice - prev.basePrice) / prev.basePrice) * 100;
  return {
    ...prev,
    price: newPrice,
    change,
    bid: newPrice - spread / 2,
    ask: newPrice + spread / 2,
    history: [...prev.history, newPrice].slice(-24),
    updatedAt: Date.now(),
  };
}

function formatPrice(price: number, symbol: string): string {
  // Metals and JPY pairs: 2 decimals
  if (
    symbol.startsWith("XAU") ||
    symbol.startsWith("XAG") ||
    symbol.endsWith("JPY")
  ) {
    return price.toFixed(2);
  }
  return price.toFixed(5);
}

/* Forex market hours: opens Sun 22:00 UTC, closes Fri 22:00 UTC */
function isMarketOpen(date: Date): boolean {
  const day = date.getUTCDay();
  const hour = date.getUTCHours() + date.getUTCMinutes() / 60;
  return (
    (day >= 1 && day <= 4) ||
    (day === 5 && hour < 22) ||
    (day === 0 && hour >= 22)
  );
}

/* ---------------- Sparkline ---------------- */
function Sparkline({
  data,
  positive,
}: {
  data: number[];
  positive: boolean;
}) {
  const W = 44;
  const H = 16;
  if (data.length < 2) {
    return <svg width={W} height={H} aria-hidden="true" />;
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map(
      (v, i) =>
        `${((i / (data.length - 1)) * (W - 4) + 2).toFixed(2)},${(
          H -
          2 -
          ((v - min) / range) * (H - 4)
        ).toFixed(2)}`
    )
    .join(" ");

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      className="shrink-0 opacity-90"
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke={positive ? "#10b981" : "#ef4444"}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ---------------- Ticker card ---------------- */
function TickerCard({ item }: { item: TickerItem }) {
  const isPositive = item.change >= 0;
  const priceStr = formatPrice(item.price, item.symbol);
  const changeStr = `${isPositive ? "+" : ""}${item.change.toFixed(2)}%`;

  // Flash the price cell when it changes
  const prevPrice = useRef(item.price);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    if (item.price !== prevPrice.current) {
      setFlash(item.price > prevPrice.current ? "up" : "down");
      prevPrice.current = item.price;
      const t = setTimeout(() => setFlash(null), 650);
      return () => clearTimeout(t);
    }
  }, [item.price]);

  return (
    <div className="flex items-center gap-2.5 px-4 h-full shrink-0 border-r border-white/[0.06] last:border-r-0">
      <span className="text-[11px] font-bold tracking-wider text-foreground/90 whitespace-nowrap">
        {item.name}
      </span>
      <Sparkline data={item.history} positive={isPositive} />
      <span
        className={`text-[13px] font-semibold tabular-nums rounded-md px-1.5 py-0.5 transition-colors duration-500 whitespace-nowrap ${
          flash === "up"
            ? "bg-bullish/20 text-bullish"
            : flash === "down"
              ? "bg-bearish/20 text-bearish"
              : "text-foreground"
        }`}
      >
        {priceStr}
      </span>
      <span
        className={`flex items-center gap-0.5 text-[11px] font-medium whitespace-nowrap ${
          isPositive ? "text-bullish" : "text-bearish"
        }`}
      >
        {isPositive ? (
          <TrendingUp className="h-3 w-3" />
        ) : (
          <TrendingDown className="h-3 w-3" />
        )}
        {changeStr}
      </span>
    </div>
  );
}

/* ---------------- Ticker ---------------- */
export function ForexTicker() {
  const { prices: socketPrices, isConnected } = useSocketPrices();
  const [baseTickers, setBaseTickers] = useState<TickerItem[]>(() =>
    MAJOR_PAIRS.map((pair) => ({
      ...FALLBACK_TICKERS[pair.symbol],
      history: seedHistory(FALLBACK_TICKERS[pair.symbol].price),
      updatedAt: Date.now(),
    }))
  );
  const [prefersReduced, setPrefersReduced] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [clock, setClock] = useState<string | null>(null);
  const [marketOpen, setMarketOpen] = useState(true);
  const simulationRef = useRef<number | undefined>(undefined);

  // Merge live socket prices during render (no state-sync effect needed)
  const tickers = useMemo(() => {
    if (!isConnected || Object.keys(socketPrices).length === 0) {
      return baseTickers;
    }
    return baseTickers.map((t) => {
      const live = socketPrices[t.symbol];
      if (!live) return t;
      return {
        ...t,
        price: live.price,
        bid: live.bid,
        ask: live.ask,
        change: (live.change / (live.price - live.change || 1)) * 100,
        history: [...t.history, live.price].slice(-24),
        updatedAt: live.updatedAt,
      };
    });
  }, [baseTickers, socketPrices, isConnected]);

  // Detect reduced motion preference
  useEffect(() => {
    const check = () =>
      setPrefersReduced(
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      );
    check();
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    mql.addEventListener("change", check);
    return () => mql.removeEventListener("change", check);
  }, []);

  // Simulate price movement when socket is not connected
  useEffect(() => {
    if (isConnected || prefersReduced) {
      if (simulationRef.current) clearInterval(simulationRef.current);
      return;
    }

    simulationRef.current = window.setInterval(() => {
      setBaseTickers((prev) => prev.map((t) => simulateTick(t)));
    }, 3000);

    return () => {
      if (simulationRef.current) clearInterval(simulationRef.current);
    };
  }, [isConnected, prefersReduced]);

  // UTC clock + market status
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setClock(now.toUTCString().slice(17, 25));
      setMarketOpen(isMarketOpen(now));
    };
    update();
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, []);

  // Duplicate ticker list for seamless infinite scroll
  const duplicatedTickers = useMemo(() => [...tickers, ...tickers], [tickers]);

  return (
    <>
      <AnimatePresence mode="wait">
        {collapsed ? (
          /* ---------- Collapsed: floating restore pill ---------- */
          <motion.button
            key="collapsed"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => setCollapsed(false)}
            aria-label="Show live market ticker"
            className="fixed bottom-4 right-4 z-[60] flex items-center gap-2 pl-3.5 pr-4 py-2.5 rounded-full glass-strong border border-primary/30 shadow-xl shadow-black/50 text-sm font-medium hover:border-primary/60 transition-colors"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-bullish opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-bullish" />
            </span>
            <Activity className="h-3.5 w-3.5 text-primary" />
            Live Markets
          </motion.button>
        ) : (
          /* ---------- Expanded: broadcast bar ---------- */
          <motion.div
            key="expanded"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-0 inset-x-0 z-[60]"
            role="marquee"
            aria-label="Live forex prices"
          >
            <div className="h-11 glass-strong border-t border-primary/25 flex items-center overflow-hidden shadow-[0_-10px_36px_rgba(0,0,0,0.5)]">
              {/* Left broadcast badge */}
              <div className="flex items-center gap-2 px-3.5 h-full shrink-0 border-r border-primary/15 bg-primary/[0.07]">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-bullish opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-bullish" />
                </span>
                <span className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold tracking-[0.18em] text-primary">
                  <Radio className="h-3 w-3" />
                  LIVE
                </span>
                <span
                  className={`hidden md:inline text-[10px] font-semibold tracking-wider whitespace-nowrap ${
                    marketOpen ? "text-bullish" : "text-amber-400"
                  }`}
                >
                  {marketOpen ? "MARKET OPEN" : "MARKET CLOSED"}
                </span>
              </div>

              {/* Scrolling marquee */}
              <div className="relative flex-1 h-full overflow-hidden mask-fade-edges-x">
                <div
                  className="flex items-center h-full w-max animate-ticker-scroll hover:[animation-play-state:paused]"
                  style={{
                    animationPlayState:
                      prefersReduced ? "paused" : "running",
                    animationDuration: "55s",
                  }}
                >
                  {duplicatedTickers.map((item, i) => (
                    <TickerCard key={`${item.symbol}-${i}`} item={item} />
                  ))}
                </div>
              </div>

              {/* Right controls */}
              <div className="flex items-center gap-2.5 pl-3 pr-2.5 h-full shrink-0 border-l border-primary/15">
                <span className="hidden lg:inline text-[11px] font-semibold tabular-nums text-muted-foreground whitespace-nowrap">
                  {clock ?? "--:--:--"}{" "}
                  <span className="text-muted-foreground/60">UTC</span>
                </span>
                <button
                  onClick={() => setCollapsed(true)}
                  aria-label="Hide market ticker"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Static accessible summary */}
      <span className="sr-only">
        Live forex prices ticker showing {tickers.length} currency pairs.
        {isConnected
          ? " Connected to real-time price feed."
          : " Showing simulated prices."}
      </span>
    </>
  );
}
