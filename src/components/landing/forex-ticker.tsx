"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
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
}

const FALLBACK_TICKERS: Record<string, Omit<TickerItem, "updatedAt">> = {
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
    updatedAt: Date.now(),
  };
}

function formatPrice(price: number, symbol: string): string {
  // Metals and JPY pairs: 2 decimals
  if (symbol.startsWith("XAU") || symbol.startsWith("XAG") || symbol.endsWith("JPY")) {
    return price.toFixed(2);
  }
  return price.toFixed(5);
}

function TickerCard({ item }: { item: TickerItem }) {
  const isPositive = item.change >= 0;
  const priceStr = formatPrice(item.price, item.symbol);
  const changeStr = `${isPositive ? "+" : ""}${item.change.toFixed(2)}%`;

  return (
    <div className="flex items-center gap-3 px-4 py-2 shrink-0 border-r border-primary/10 last:border-r-0">
      <div className="flex flex-col">
        <span className="text-xs font-bold tracking-wider text-foreground/90">
          {item.symbol}
        </span>
        <span className="text-[10px] text-muted-foreground">{item.name}</span>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-sm font-semibold tabular-nums text-foreground">
          {priceStr}
        </span>
        <div
          className={`flex items-center gap-0.5 text-[10px] font-medium ${
            isPositive ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {isPositive ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {changeStr}
        </div>
      </div>
    </div>
  );
}

export function ForexTicker() {
  const { prices: socketPrices, isConnected } = useSocketPrices();
  const [tickers, setTickers] = useState<TickerItem[]>(() =>
    MAJOR_PAIRS.map((pair) => ({
      ...FALLBACK_TICKERS[pair.symbol],
      updatedAt: Date.now(),
    }))
  );
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReduced, setPrefersReduced] = useState(false);
  const simulationRef = useRef<number | undefined>(undefined);

  // Merge socket prices into tickers
  useEffect(() => {
    if (!isConnected || Object.keys(socketPrices).length === 0) return;

    setTickers((prev) =>
      prev.map((t) => {
        const live = socketPrices[t.symbol];
        if (!live) return t;
        return {
          ...t,
          price: live.price,
          bid: live.bid,
          ask: live.ask,
          change: (live.change / (live.price - live.change || 1)) * 100,
          updatedAt: live.updatedAt,
        };
      })
    );
  }, [socketPrices, isConnected]);

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
      setTickers((prev) => prev.map((t) => simulateTick(t)));
    }, 3000);

    return () => {
      if (simulationRef.current) clearInterval(simulationRef.current);
    };
  }, [isConnected, prefersReduced]);

  // Duplicate ticker list for seamless infinite scroll
  const duplicatedTickers = useMemo(() => [...tickers, ...tickers], [tickers]);

  return (
    <div
      className="relative w-full overflow-hidden border-y border-primary/15 bg-card/40 backdrop-blur-sm"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Status indicator */}
      <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center px-3 bg-gradient-to-r from-background via-background/90 to-transparent">
        <div className="flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-primary" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
            Live
          </span>
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
            }`}
          />
        </div>
      </div>

      {/* Fade right edge */}
      <div className="absolute right-0 top-0 bottom-0 z-10 w-16 bg-gradient-to-l from-background to-transparent pointer-events-none" />

      {/* Scrolling ticker */}
      <div
        className="flex items-center py-2 pl-20"
        aria-hidden="true"
      >
        <div
          className={`flex items-center gap-0 ${
            isPaused || prefersReduced ? "" : "animate-ticker-scroll"
          }`}
          style={{
            animationPlayState: isPaused || prefersReduced ? "paused" : "running",
          }}
        >
          {duplicatedTickers.map((item, i) => (
            <TickerCard key={`${item.symbol}-${i}`} item={item} />
          ))}
        </div>
      </div>
      {/* Static accessible summary */}
      <span className="sr-only">
        Live forex prices ticker showing {tickers.length} currency pairs.
        {isConnected
          ? " Connected to real-time price feed."
          : " Showing simulated prices."}
      </span>
    </div>
  );
}
