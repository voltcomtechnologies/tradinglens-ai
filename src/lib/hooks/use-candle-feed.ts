"use client";

/**
 * useCandleFeed — REST seed + live tick folding + Vercel polling fallback
 * for a `lightweight-charts` v5 candle series.
 *
 * Data flow:
 *   1. On mount + when `symbol`/`granularity` change: one REST fetch to
 *      `/api/market/data` seeds the history via `onHistory`.
 *   2. While Socket.IO is connected (`useSocketPrices().isConnected === true`):
 *      each `prices[symbol]` tick is folded into the current bucket —
 *      `onTick` for in-place HLC update, `onRollover` when the bucket time
 *      crossed a boundary (initialised from the tick per OHLC rollover
 *      convention).
 *   3. When the socket isn't connected (production on Vercel): the hook
 *      polls `/api/market/data` every 15 s and replays any newer candles
 *      via the same onTick / onRollover pipeline, walking the array so a
 *      longer-than-15s gap doesn't lose boundary buckets.
 *
 * Bucket alignment:
 *   - `"1h"` → UTC-aligned hour boundaries (`Math.floor(Date.now() / 3_600_000) * 3_600_000`).
 *   - `"1d"` → New York close (22:00 UTC), the forex industry standard for daily bars.
 *
 * SSR safety: thin — this hook is intended to be called from `lightweight-charts`
 * canvas components which already live behind `dynamic(() => import(...), { ssr: false })`.
 * The hook touches `Date.now()` and `window.setInterval` only inside `useEffect`
 * callbacks, so the SSR render path returns stable shapes.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { CandlestickData, UTCTimestamp } from "lightweight-charts";

import { useSocketPrices } from "@/lib/hooks/use-socket";
import type {
  Granularity,
  MarketDataResponse,
} from "@/app/api/market/data/route";

export type CandleFeedStatus = "loading" | "live" | "polling" | "error";

// ── Time helpers ──────────────────────────────────────────────────

const ONE_HOUR_MS = 3_600_000;
const ONE_DAY_MS = 86_400_000;
const NY_CLOSE_OFFSET_MS = 22 * ONE_HOUR_MS;
const POLL_INTERVAL_MS = 15_000;

/**
 * Convert an Alpha Vantage candle timestamp ("YYYY-MM-DD" or
 * "YYYY-MM-DD HH:MM:SS") to a `lightweight-charts` UTCTimestamp (seconds).
 */
function avTimeToLwc(time: string): UTCTimestamp {
  const normalized = time.includes(" ")
    ? `${time.replace(" ", "T")}Z`
    : `${time}T00:00:00Z`;
  return Math.floor(new Date(normalized).getTime() / 1000) as UTCTimestamp;
}

/**
 * Bucket alignment. `"1d"` aligns to New York close (22:00 UTC) which is
 * the convention retail/forex charts use; `"1h"` is just UTC-aligned hours.
 */
function bucketStartFor(nowMs: number, granularity: Granularity): number {
  if (granularity === "1h") {
    return Math.floor(nowMs / ONE_HOUR_MS) * ONE_HOUR_MS;
  }
  const shifted = nowMs - NY_CLOSE_OFFSET_MS;
  const dayStart = Math.floor(shifted / ONE_DAY_MS) * ONE_DAY_MS;
  return dayStart + NY_CLOSE_OFFSET_MS;
}

/** Map an Alpha Vantage row (daily OR intraday shape) to a LWC candle. */
function mapAvRowToLwc(row: {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}): CandlestickData<UTCTimestamp> {
  return {
    time: avTimeToLwc(row.time),
    open: row.open,
    high: row.high,
    low: row.low,
    close: row.close,
  };
}

// ── Hook ──────────────────────────────────────────────────────────

export interface CandleFeedCallbacks {
  /** Replace the entire series (initial seed only). */
  onHistory: (data: CandlestickData<UTCTimestamp>[]) => void;
  /** Update the current bucket's HLC in-place. */
  onTick: (candle: CandlestickData<UTCTimestamp>) => void;
  /** Push a new bucket (boundary crossed). Init from this tick per OHLC convention. */
  onRollover: (candle: CandlestickData<UTCTimestamp>) => void;
}

export interface UseCandleFeedOptions {
  symbol: string;
  granularity: Granularity;
  /**
   * Bumping this number forces the seed `useEffect` to re-run and refetch
   * history from `/api/market/data`. Exposed so the LiveChart refresh button
   * (and any future manual-refresh path) can drive the hook directly.
   * Defaults to 0.
   */
  refreshKey?: number;
  callbacks: CandleFeedCallbacks;
}

export function useCandleFeed(opts: UseCandleFeedOptions): {
  status: CandleFeedStatus;
  lastError: string | null;
} {
  const { symbol, granularity, refreshKey = 0, callbacks } = opts;

  // Refs to avoid stale-closure bugs in the polling timer and the tick fold.
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const lastBucketRef = useRef<{
    bucketMs: number;
    open: number;
    high: number;
    low: number;
  } | null>(null);

  // Re-render status only — not used for correctness inside the effect closures.
  const { prices, isConnected } = useSocketPrices();
  const [status, setStatus] = useState<CandleFeedStatus>("loading");
  const [lastError, setLastError] = useState<string | null>(null);

  // ── 1) Initial REST seed (runs on symbol/granularity change) ──────

  useEffect(() => {
    if (!symbol) return;

    let cancelled = false;
    setStatus("loading");

    (async () => {
      try {
        const url = `/api/market/data?symbol=${encodeURIComponent(symbol)}&granularity=${granularity}`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status} fetching ${url}`);
        }
        const data = (await res.json()) as MarketDataResponse;
        if (cancelled) return;

        const lwc = data.candles
          .map(mapAvRowToLwc)
          .sort((a, b) => Number(a.time) - Number(b.time));

        callbacksRef.current.onHistory(lwc);

        const last = lwc[lwc.length - 1];
        if (last) {
          lastBucketRef.current = {
            bucketMs: Number(last.time) * 1000,
            open: last.open,
            high: last.high,
            low: last.low,
          };
        }
        // Real status (live vs polling) is set by the effect below once
        // socket state is known.
        setStatus(isConnected ? "live" : "polling");
        setLastError(null);
      } catch (err) {
        if (cancelled) return;
        console.warn("useCandleFeed history fetch failed:", err);
        setLastError((err as Error).message);
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      // Wipe bucket state so a stale bucket doesn't leak into the new symbol.
      lastBucketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, granularity, refreshKey]);

  // ── 2) Live tick folding via useSocketPrices ─────────────────────

  const liveTick = symbol ? prices[symbol] : undefined;
  const liveTickAt = liveTick?.updatedAt;

  useEffect(() => {
    if (!symbol || !liveTick) return;
    if (status === "loading" || status === "error") return;

    const tickPrice = liveTick.price;
    const tickBucketMs = bucketStartFor(Date.now(), granularity);
    const prev = lastBucketRef.current;

    if (!prev || tickBucketMs > prev.bucketMs) {
      // Bucket rollover OR first tick after seed → initialise from this tick.
      const newBucket: CandlestickData<UTCTimestamp> = {
        time: (tickBucketMs / 1000) as UTCTimestamp,
        open: tickPrice,
        high: tickPrice,
        low: tickPrice,
        close: tickPrice,
      };
      lastBucketRef.current = {
        bucketMs: tickBucketMs,
        open: tickPrice,
        high: tickPrice,
        low: tickPrice,
      };
      callbacksRef.current.onRollover(newBucket);
    } else if (tickBucketMs === prev.bucketMs) {
      // Same bucket → fold the tick into HLC.
      const nextHigh = Math.max(prev.high, tickPrice);
      const nextLow = Math.min(prev.low, tickPrice);
      const updated: CandlestickData<UTCTimestamp> = {
        time: (tickBucketMs / 1000) as UTCTimestamp,
        open: prev.open,
        high: nextHigh,
        low: nextLow,
        close: tickPrice,
      };
      lastBucketRef.current = {
        bucketMs: prev.bucketMs,
        open: prev.open,
        high: nextHigh,
        low: nextLow,
      };
      callbacksRef.current.onTick(updated);
    }
    // If `tickBucketMs < prev.bucketMs` (clock skew), ignore silently.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, granularity, liveTickAt, status]);

  // ── 3) Vercel polling fallback (Socket.IO unavailable) ───────────

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!symbol) return;
    if (isConnected) return; // socket path is active — skip polling
    if (status === "loading" || status === "error") return;

    const interval = window.setInterval(async () => {
      try {
        const url = `/api/market/data?symbol=${encodeURIComponent(symbol)}&granularity=${granularity}`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = (await res.json()) as MarketDataResponse;
        const fresh = data.candles.map(mapAvRowToLwc)
          .sort((a, b) => Number(a.time) - Number(b.time));
        if (fresh.length === 0) return;

        const lastKnownBucket = lastBucketRef.current?.bucketMs ?? 0;

        for (const candle of fresh) {
          const candleMs = Number(candle.time) * 1000;
          if (candleMs > lastKnownBucket) {
            // New bucket (could be one OR several after a >15s gap).
            const freshBucketMs = bucketStartFor(candleMs, granularity);
            lastBucketRef.current = {
              bucketMs: freshBucketMs,
              open: candle.open,
              high: candle.high,
              low: candle.low,
            };
            callbacksRef.current.onRollover(candle);
          } else {
            // Backfill into current bucket.
            const prev = lastBucketRef.current;
            if (!prev) {
              lastBucketRef.current = {
                bucketMs: candleMs,
                open: candle.open,
                high: candle.high,
                low: candle.low,
              };
              callbacksRef.current.onRollover(candle);
              continue;
            }
            const nextHigh = Math.max(prev.high, candle.high);
            const nextLow = Math.min(prev.low, candle.low);
            lastBucketRef.current = {
              bucketMs: prev.bucketMs,
              open: prev.open,
              high: nextHigh,
              low: nextLow,
            };
            callbacksRef.current.onTick({
              time: candle.time,
              open: prev.open,
              high: nextHigh,
              low: nextLow,
              close: candle.close,
            });
          }
        }
      } catch (err) {
        console.warn("useCandleFeed polling fetch failed:", err);
      }
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [symbol, granularity, isConnected, status]);

  return { status, lastError };
}
