"use client";

/**
 * useChartNarrator — captures the lightweight-charts canvas, posts it
 * to `/api/trading/analyze` with `type=narrator`, and pipes the result
 * into the supplied `speak` callback.
 *
 * Triggers (any one of):
 *   - symbol / granularity change  (debounced 1200ms)
 *   - 5-minute wall-clock tick     (only while document is visible)
 *   - explicit triggerNow() call   (from the "Narrate" button)
 *
 * Skips silently when:
 *   - `enabled === false`          (no auto-firing even after first user gesture)
 *   - `chartRef.current?.hasData()` returns false (no candles painted yet)
 *
 * The hook does NOT own `enabled` state — the parent owns it so a
 * click on the Narrator toggle is the user gesture that unlocks the
 * browser's autoplay-blocked speechSynthesis queue.
 */

import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import { NARRATOR_SYSTEM_PROMPT, buildNarratorUserMessage } from "@/lib/llm/narrator-prompt";
import type { LiveChartHandle } from "@/components/trading/live-chart";

export type NarratorStatus =
  | "idle"
  | "capturing"
  | "thinking"
  | "speaking"
  | "error"
  | "muted";

export interface UseChartNarratorOptions {
  chartRef: RefObject<LiveChartHandle | null>;
  symbol: string;
  granularity: string;
  /** When false, no automatic triggers fire. manual triggerNow() still works. */
  enabled: boolean;
  /** Pass through to useSpeechSynthesis.speak — kept here so the hook
   *  doesn't need to import useSpeechSynthesis directly (testability). */
  speak: (text: string) => void;
  onInsight?: (text: string) => void;
}

export interface UseChartNarratorResult {
  status: NarratorStatus;
  latestInsight: string | null;
  error: string | null;
  triggerNow: () => Promise<void>;
}

const DEBOUNCE_MS = 1200;
const INTERVAL_MS = 5 * 60 * 1000;

export function useChartNarrator(
  opts: UseChartNarratorOptions,
): UseChartNarratorResult {
  const { chartRef, symbol, granularity, enabled, speak, onInsight } = opts;
  const [status, setStatus] = useState<NarratorStatus>("muted");
  const [latestInsight, setLatestInsight] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reflect enable state on the status badge — separate from the live
  // capture state machine so the UI shows "muted" not "idle" when off.
  useEffect(() => {
    if (enabled) {
      setStatus((prev) => (prev === "muted" ? "idle" : prev));
    } else {
      setStatus("muted");
    }
  }, [enabled]);

  const captureAndAnalyze = useCallback(async () => {
    // Client guards: chart must have data and navigator must be online.
    if (!chartRef.current) return;
    if (!chartRef.current.hasData()) return;
    if (typeof navigator !== "undefined" && navigator.onLine === false) return;

    let blob: Blob | null = null;
    try {
      setStatus("capturing");
      blob = await chartRef.current.captureCanvas();
    } catch (e) {
      setError(`Capture failed: ${e instanceof Error ? e.message : String(e)}`);
      setStatus("error");
      return;
    }
    if (!blob) {
      setStatus("idle");
      return;
    }
    if (blob.size > 3_500_000) {
      // Just under Next.js default 4MB body limit. Reject before fetch.
      setError("Chart image too large to narrate");
      setStatus("error");
      return;
    }

    try {
      setStatus("thinking");
      const filename = `chart-${symbol}-${Date.now()}.jpg`;
      const file = new File([blob], filename, { type: "image/jpeg" });
      const form = new FormData();
      form.append("type", "narrator");
      form.append("pair", symbol);
      form.append("timeframe", granularity);
      form.append("image", file);
      form.append("prompt", buildNarratorUserMessage(symbol, granularity));
      // The system prompt is injected server-side via the type discriminator.
      // We also stash it as a hidden field for upstream observability.
      form.append("_systemPrompt", NARRATOR_SYSTEM_PROMPT);

      const res = await fetch("/api/trading/analyze", {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        throw new Error(`Analyze route HTTP ${res.status}`);
      }
      const data: { content?: string; pair?: string; timeframe?: string } =
        await res.json().catch(() => ({}));
      const text = String(data?.content || "").trim();
      if (!text) {
        setError("Narrator returned an empty reply");
        setStatus("error");
        return;
      }
      // Trim for TTS-readability — the system prompt targets 600 chars already.
      const capped = text.length > 1500 ? `${text.slice(0, 1497)}…` : text;
      setLatestInsight(capped);
      onInsight?.(capped);
      setStatus("speaking");
      speak(capped);
      // Speak handlers in useSpeechSynthesis call onend via the parent's
      // status setter — but for the narrator status we just relax to idle
      // once speak() has been kicked off; speech duration is async.
      setStatus("idle");
    } catch (e) {
      setError(
        `Narrator request failed: ${e instanceof Error ? e.message : String(e)}`,
      );
      setStatus("error");
    }
  }, [chartRef, symbol, granularity, speak, onInsight]);

  // Reset errors to idle so the badge doesn't stay red forever.
  useEffect(() => {
    if (status !== "error") return;
    const t = setTimeout(() => setStatus("idle"), 5000);
    return () => clearTimeout(t);
  }, [status]);

  // Debounced trigger on symbol / granularity change.
  const captureRef = useRef(captureAndAnalyze);
  captureRef.current = captureAndAnalyze;
  useEffect(() => {
    if (!enabled) return;
    const t = setTimeout(() => {
      void captureRef.current();
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [enabled, symbol, granularity]);

  // 5-minute heartbeat — only when the page is foregrounded.
  useEffect(() => {
    if (!enabled) return;
    const tick = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      void captureRef.current();
    };
    const iv = setInterval(tick, INTERVAL_MS);
    return () => clearInterval(iv);
  }, [enabled]);

  return { status, latestInsight, error, triggerNow: captureAndAnalyze };
}
