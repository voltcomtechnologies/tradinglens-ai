"use client";

/**
 * LiveChart — `lightweight-charts` v5 candlestick chart panel.
 *
 * Visual chrome mirrors `src/components/trading/scanner.tsx` so the camera
 * scanner and the live chart feel like siblings on /lens/trading:
 *   - same rounded-3xl, primary/20 border, card/40 backdrop blur wrapper
 *   - same animated top accent bar (`bg-gradient-to-r from-primary via-accent`)
 *   - same `Maximize`/`Minimize` toggle + "Expand" / "Compact" labels
 *   - same `min-h-[60vh]` expanded mode / `max-w-3xl mx-auto` compact mode
 *
 * SSR boundary: this file is imported by `trading-lens-core.tsx` behind
 *   `dynamic(() => import("./live-chart"), { ssr: false })` because
 *   `lightweight-charts` reads `document` at import time. The "use client"
 *   directive here is necessary but not sufficient on its own.
 *
 * Snapshot determinism: hex colours are hardcoded rather than read from CSS
 * variables so that the chromium canvas paint matches the committed baselines
 * across machines. The `e2e/tests/trading-lens-live-chart.spec.ts` spec
 * intercepts `/api/market/data` with seeded fixtures and aborts the WebSocket
 * so the chart paints a single, reproducible frame.
 *
 * Narrator integration: via forwardRef, the parent can imperatively pull
 *   a JPEG snapshot of the chart (`takeScreenshot().toBlob('image/jpeg', 0.7)`)
 *   and probe `hasData()` to know whether candles have actually rendered.
 *   Two callback props (`onSymbolChange`, `onStatusChange`) bubble state up
 *   so the parent's debounced narrator can re-fire.
 */

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Maximize,
  Minimize,
  RefreshCw,
  Activity,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  createChart,
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
  type CandlestickData,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";

import { cn } from "@/lib/utils";
import { MAJOR_PAIRS } from "@/types";
import { useCandleFeed } from "@/lib/hooks/use-candle-feed";
import { useSocketPrices } from "@/lib/hooks/use-socket";
import type { Granularity } from "@/app/api/market/data/route";

/**
 * Imperative API for the Grok narrator hook. Surfaced via `forwardRef`
 * so the parent in `trading-lens-core.tsx` can capture the canvas without
 * lifting the chart instance itself into a global.
 */
export interface LiveChartHandle {
  /** Returns a JPEG-encoded Blob of the current chart frame, or null if
   *  the chart hasn't mounted yet. Quality is fixed at 0.7 to stay
   *  comfortably under the 4MB Next.js body-parser default. */
  captureCanvas: () => Promise<Blob | null>;
  /** True iff the candle series has at least one bar rendered. The
   *  narrator hook skips captures while this is false so we never ship
   *  an empty JPEG to Grok. */
  hasData: () => boolean;
}

export type LiveChartFeedStatus = "loading" | "live" | "polling" | "error";

const PAIR_OPTIONS = MAJOR_PAIRS;
const TIMEFRAME_OPTIONS: { value: Exclude<Granularity, "1h"> | Granularity; label: string }[] =
  [
    { value: "1h", label: "1H" },
    { value: "1d", label: "1D" },
  ];

// Hardcoded hex palette so the canvas snapshot is reproducible across machines.
// Keeps parity with the project token system but doesn't depend on it at paint time.
const PALETTE = {
  bgUp: "#10b981",
  bgDown: "#ef4444",
  wickUp: "#10b981",
  wickDown: "#ef4444",
  textColor: "rgba(161, 161, 170, 0.95)",
  gridColor: "rgba(255, 255, 255, 0.05)",
  borderColor: "rgba(255, 255, 255, 0.10)",
  bgSolid: "transparent",
};

interface LiveChartProps {
  initialSymbol?: string;
  initialGranularity?: Granularity;
  className?: string;
  /** Fires whenever the user picks a different pair or timeframe. Used by
   *  the parent narrator hook to debounce re-narration on focus change. */
  onSymbolChange?: (symbol: string, granularity: Granularity) => void;
  /** Fires whenever the underlying feed status changes. */
  onStatusChange?: (status: LiveChartFeedStatus) => void;
}

const LiveChart = forwardRef<LiveChartHandle, LiveChartProps>(function LiveChart(
  {
    initialSymbol = "EURUSD",
    initialGranularity = "1d",
    className,
    onSymbolChange,
    onStatusChange,
  },
  ref,
) {
  const [symbol, setSymbol] = useState(initialSymbol);
  const [granularity, setGranularity] = useState<Granularity>(initialGranularity);
  const [isExpanded, setIsExpanded] = useState(true);
  // `refreshKey` increments to force the seed effect in `useCandleFeed`
  // to re-run and pull fresh history. Mutating `symbol` to its own value
  // would be a React no-op (Object.is short-circuit).
  const [refreshKey, setRefreshKey] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  // Mint a fresh chart instance once per mount. `series.update` is the
  // mutation path for in-place updates — `setData` only on symbol/granularity
  // change.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: PALETTE.bgSolid },
        textColor: PALETTE.textColor,
        fontFamily: "inherit",
      },
      width: container.clientWidth,
      height: container.clientHeight || 360,
      grid: {
        vertLines: { color: PALETTE.gridColor, style: LineStyle.Solid },
        horzLines: { color: PALETTE.gridColor, style: LineStyle.Solid },
      },
      rightPriceScale: { borderColor: PALETTE.borderColor },
      timeScale: {
        borderColor: PALETTE.borderColor,
        timeVisible: granularity === "1h",
        secondsVisible: false,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: PALETTE.borderColor, style: LineStyle.Dashed },
        horzLine: { color: PALETTE.borderColor, style: LineStyle.Dashed },
      },
    });
    chartRef.current = chart;

    const series = chart.addSeries(CandlestickSeries, {
      upColor: PALETTE.bgUp,
      downColor: PALETTE.bgDown,
      borderVisible: false,
      wickUpColor: PALETTE.wickUp,
      wickDownColor: PALETTE.wickDown,
    });
    seriesRef.current = series;

    // External ResizeObserver so the canvas knows when the chrome resizes
    // (framer-motion `layout`, the fullscreen toggle, the browser window).
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (chartRef.current) {
        chartRef.current.applyOptions({ width, height });
      }
    });
    ro.observe(container);
    resizeObserverRef.current = ro;

    return () => {
      // Standard lightweight-charts v5 teardown — `chart.remove()` releases
      // the canvas, detaches internal listeners, and unbinds ResizeObservers
      // it owns. We additionally disconnect OUR ResizeObserver to release
      // the entry that points at the now-detached container.
      ro.disconnect();
      resizeObserverRef.current = null;
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // Re-fit `fitContent()` after symbol/granularity changes so the new data
  // range fills the viewport. Reproduction of the chart history is done via
  // `setData` underneath; this just reflows the time scale axes.
  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.timeScale().fitContent();
  }, [symbol, granularity]);

  // ── Imperative handle for the Grok narrator hook ─────────────────
  // Empty deps — `captureCanvas` and `hasData` only touch refs that are
  // stable for the lifetime of the mount. Recreating the handle on every
  // render would cause the parent's `useEffect([chartRef])` to thrash.
  useImperativeHandle(
    ref,
    () => ({
      captureCanvas: () =>
        new Promise((resolve) => {
          const chart = chartRef.current;
          if (!chart) return resolve(null);
          try {
            const canvas = chart.takeScreenshot();
            canvas.toBlob(
              (blob) => resolve(blob),
              "image/jpeg",
              0.7,
            );
          } catch {
            // takeScreenshot can throw on a detached/zero-size canvas
            // (e.g. during the framer-motion layout animation). Resolve
            // null so the narrator hook can skip silently.
            resolve(null);
          }
        }),
      hasData: () => {
        try {
          return (seriesRef.current?.data()?.length ?? 0) > 0;
        } catch {
          return false;
        }
      },
    }),
    [],
  );

  // ── State-change callbacks for the parent ───────────────────────
  useEffect(() => {
    onSymbolChange?.(symbol, granularity);
  }, [symbol, granularity, onSymbolChange]);

  // ── Live data plumbing ───────────────────────────────────────────
  const { status, lastError } = useCandleFeed({
    symbol,
    granularity,
    refreshKey,
    callbacks: {
      onHistory: (data: CandlestickData<UTCTimestamp>[]) => {
        if (!seriesRef.current) return;
        seriesRef.current.setData(data);
      },
      onTick: (candle) => {
        if (!seriesRef.current) return;
        seriesRef.current.update(candle);
      },
      onRollover: (candle) => {
        if (!seriesRef.current) return;
        seriesRef.current.update(candle);
      },
    },
  });

  // Bubble status up so the parent can show "waiting for data…" affordances.
  useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  const { prices } = useSocketPrices();
  const livePrice = prices[symbol];

  // ── UI handlers ──────────────────────────────────────────────────
  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);
  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  // Drive the fullscreen toggle on Escape (parity with scanner.tsx).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isExpanded) setIsExpanded(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isExpanded]);

  const trendUp = livePrice ? livePrice.change >= 0 : true;

  // ── Render ───────────────────────────────────────────────────────

  return (
    <motion.div
      layout
      transition={{ type: "spring", bounce: 0, duration: 0.4 }}
      className={cn(
        "relative w-full overflow-hidden border border-primary/20 bg-card/40 backdrop-blur-xl transition-all duration-500",
        isExpanded
          ? "w-full min-h-[60vh] sm:min-h-[70vh] rounded-3xl flex flex-col shadow-2xl shadow-primary/10"
          : "max-w-3xl mx-auto rounded-3xl",
        className
      )}
    >
      {/* Top accent bar — same gradient as the scanner's, animated. */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary z-20 animate-pulse" />

      {/* Header */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-primary/10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/40 rounded-xl blur-lg animate-pulse" />
            <div className="relative p-2.5 rounded-xl bg-primary/10 border border-primary/20">
              <Activity className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wider uppercase text-foreground">
              Live Markets
            </h3>
            <p className="text-xs text-muted-foreground">
              Real-time candlestick stream · {symbol} · {granularity.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Symbol picker */}
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            aria-label="Currency pair"
            className={cn(
              "h-8 px-2 rounded-lg text-xs font-medium border border-border bg-background",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            )}
          >
            {PAIR_OPTIONS.map((p) => (
              <option key={p.symbol} value={p.symbol}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Timeframe pills */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/50 border border-border/50 shadow-inner">
            {TIMEFRAME_OPTIONS.map((tf) => (
              <button
                key={tf.value}
                onClick={() => setGranularity(tf.value as Granularity)}
                aria-pressed={granularity === tf.value}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  granularity === tf.value
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Live status badge */}
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider",
              status === "live" && "bg-emerald-500/10 text-emerald-400",
              status === "polling" && "bg-amber-500/10 text-amber-400",
              status === "error" && "bg-red-500/10 text-red-400",
              status === "loading" && "bg-muted text-muted-foreground"
            )}
          >
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                status === "live" && "bg-emerald-400 animate-pulse",
                status === "polling" && "bg-amber-400",
                status === "error" && "bg-red-400",
                status === "loading" && "bg-muted-foreground"
              )}
            />
            {status}
          </span>

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            aria-label="Refresh chart data"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-all border border-transparent hover:border-primary/20"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>

          {/* Expand toggle — labels mirror scanner.tsx verbatim */}
          <button
            onClick={toggleExpanded}
            aria-pressed={isExpanded}
            aria-label={isExpanded ? "Compact chart" : "Expand chart"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-all border border-transparent hover:border-primary/20"
          >
            {isExpanded ? (
              <Minimize className="h-3.5 w-3.5" />
            ) : (
              <Maximize className="h-3.5 w-3.5" />
            )}
            {isExpanded ? "Compact" : "Expand"}
          </button>
        </div>
      </div>

      {/* Live price badge — sits on top of the canvas, glassy */}
      <AnimatePresence>
        {livePrice && (
          <motion.div
            key={`price-${livePrice.updatedAt}`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "absolute top-16 right-6 z-10 flex items-center gap-2 px-3 py-1.5 rounded-lg",
              "bg-background/70 backdrop-blur-sm border border-border",
              "text-xs font-semibold tabular-nums"
            )}
          >
            {trendUp ? (
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-red-400" />
            )}
            <span className={trendUp ? "text-emerald-400" : "text-red-400"}>
              {livePrice.price.toFixed(5)}
            </span>
            <span className="text-muted-foreground">
              {trendUp ? "+" : ""}
              {livePrice.change.toFixed(5)}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chart viewport */}
      <div
        data-testid="live-chart-container"
        ref={containerRef}
        className={cn(
          "relative w-full",
          isExpanded ? "flex-1" : "h-[360px] sm:h-[420px]"
        )}
      />

      {/* Footer status / errors */}
      <div className="relative z-10 flex items-center justify-between px-6 py-3 border-t border-primary/10 text-[11px] text-muted-foreground">
        <span>
          Status: <span className="text-foreground font-medium">{status}</span>
          {lastError ? (
            <span className="ml-2 text-red-400">· {lastError}</span>
          ) : null}
        </span>
        <span className="hidden sm:inline">
          Press <kbd className="px-1 py-0.5 rounded border border-border">Esc</kbd>{" "}
          to compact
        </span>
      </div>
    </motion.div>
  );
});

export default LiveChart;
