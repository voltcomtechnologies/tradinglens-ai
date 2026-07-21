"use client";

/**
 * useChartNarrator — streaming-capable chart narrator.
 *
 * Captures the lightweight-charts canvas, posts it as multipart/form-data
 * to `/api/trading/analyze` with `type=narrator` and
 * `Accept: text/event-stream`, then consumes the SSE response chunk by
 * chunk. Each OpenAI-style delta lands in a SentenceSequencer that fires
 * `speak(sentence, onEnd)` as soon as the first sentence boundary is
 * reached (typically `. `, `! `, `? `, `\n`), so the user hears the
 * first words well before the LLM has finished generating.
 *
 * Triggers (any one of):
 *   - symbol / granularity change  (debounced 1200ms)
 *   - 5-minute wall-clock tick     (only while document is visible)
 *   - explicit triggerNow() call   (from the "Narrate" button)
 *
 * Cancellation:
 *   - On every new capture trigger, we abort the in-flight fetch via
 *     AbortController. The server-side route's `for await` loop throws
 *     on `request.signal.aborted`, closes its ReadableStream, and the
 *     upstream LLM fetch is cancelled via the signal. No tokens leak.
 *   - The local SentenceSequencer is `.reset()` so any queued sentence
 *     is dropped, and the next speak() (from the FRESH capture) wins.
 *
 * Client guards:
 *   - `chartRef.current?.hasData()` is false → capture is skipped silently.
 *   - `navigator.onLine === false` → skipped.
 *   - JPEG blob > 3.5MB → abort before fetch (under Next.js 4MB body cap).
 *
 * The hook does NOT own `enabled` state — the parent owns it so a
 * click on the Narrator toggle is the user gesture that unlocks the
 * browser's autoplay-blocked speechSynthesis queue.
 */

import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import { NARRATOR_SYSTEM_PROMPT, buildNarratorUserMessage } from "@/lib/llm/narrator-prompt";
import {
  SentenceSequencer,
  SseLineStreamer,
  extractDelta,
} from "@/lib/narration/sentence-sequencer";
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
  /** Stream-finally speak callback; the hook chains subsequent sentences
   *  via `speak(text, onEnd)` so only one utterance is ever in flight. */
  speak: (text: string, onEnd?: () => void) => void;
  /** Cancel any in-flight native browser TTS utterance. Called whenever
   *  a new capture supersedes the previous one, on unmount, and when
   *  `enabled` flips false. The hook keeps the latest reference via a
   *  ref so callers don't have to memoize. */
  stopSpeak?: () => void;
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
const MAX_BLOB_BYTES = 3_500_000;

export function useChartNarrator(
  opts: UseChartNarratorOptions,
): UseChartNarratorResult {
  const { chartRef, symbol, granularity, enabled, speak, onInsight } = opts;
  const [status, setStatus] = useState<NarratorStatus>("muted");
  const [latestInsight, setLatestInsight] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Mutable refs for cancellation across rapid symbol/granularity switches.
  // We don't put them in React state — state updates would race with the
  // streaming read loop and produce torn UI updates.
  const abortRef = useRef<AbortController | null>(null);
  const sequencerRef = useRef<SentenceSequencer | null>(null);
  // Keep the latest stopSpeak via a ref so cancelInFlight's identity stays
  // stable (no useEffect loop) even if the parent re-renders with a new
  // closure each render.
  const stopSpeakRef = useRef<(() => void) | undefined>(opts.stopSpeak);
  stopSpeakRef.current = opts.stopSpeak;

  /**
   * Cancel any in-flight fetch + queued TTS so the next capture call
   * starts clean. Used on every new trigger, on unmount, and when
   * `enabled` toggles off.
   */
  const cancelInFlight = useCallback(() => {
    if (abortRef.current) {
      try {
        abortRef.current.abort();
      } catch {
        // ignore
      }
      abortRef.current = null;
    }
    if (sequencerRef.current) {
      sequencerRef.current.reset();
    }
    // Also stop any active browser TTS utterance so the OLD sentence
    // doesn't keep playing over the fresh capture's first sentence.
    try {
      stopSpeakRef.current?.();
    } catch {
      // ignore
    }
  }, []);

  // Reflect enable state on the status badge AND halt any in-flight
  // capture when the user mutes the narrator mid-stream.
  useEffect(() => {
    if (enabled) {
      setStatus((prev) => (prev === "muted" ? "idle" : prev));
    } else {
      setStatus("muted");
      cancelInFlight();
    }
  }, [enabled, cancelInFlight]);

  // Tear down on unmount so the page doesn't leak a live fetch / TTS.
  useEffect(() => {
    return () => {
      cancelInFlight();
    };
  }, [cancelInFlight]);

  const captureAndAnalyze = useCallback(async () => {
    // Step 1 \u2014 cancel anything still in flight from the prior capture.
    cancelInFlight();

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
    if (blob.size > MAX_BLOB_BYTES) {
      setError("Chart image too large to narrate");
      setStatus("error");
      return;
    }

    const ac = new AbortController();
    abortRef.current = ac;
    const seq = new SentenceSequencer({ speak, onTail: () => undefined });
    sequencerRef.current = seq;

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
      form.append("_systemPrompt", NARRATOR_SYSTEM_PROMPT);

      const res = await fetch("/api/trading/analyze", {
        method: "POST",
        body: form,
        signal: ac.signal,
        headers: {
          // Opt the narrator into the streaming path on the server.
          Accept: "text/event-stream",
        },
      });
      if (!res.ok) {
        throw new Error(`Analyze route HTTP ${res.status}`);
      }
      if (!res.body) {
        throw new Error("Narrator stream returned an empty body");
      }

      setStatus("speaking");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      const sse = new SseLineStreamer();
      let cumulative = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (ac.signal.aborted) break;
        // Decode UTF-8 in streaming mode so multi-byte characters split
        // across packets don't corrupt.
        const chunk = decoder.decode(value, { stream: true });
        const events = sse.push(chunk);
        for (const evt of events) {
          const delta = extractDelta(evt);
          if (delta == null) {
            // Sentinel "[DONE]" or non-data event.
            continue;
          }
          cumulative += delta;
          seq.push(delta);
        }
      }
      // Flush any multi-byte residue left in the decoder (and any
      // trailing partial SSE event) so the last characters of the
      // stream aren't silently dropped.
      const tail = decoder.decode();
      if (tail) {
        sse.push(tail).forEach((evt) => {
          const d = extractDelta(evt);
          if (d) {
            cumulative += d;
            seq.push(d);
          }
        });
      }
      // Drain any unsaid tail as a single final sentence.
      seq.finish();

      // If we were cancelled mid-stream, do NOT commit the partial text
      // to latestInsight / do NOT call onInsight \u2014 the next capture will
      // overwrite anyway and we don't want a half-finished sentence
      // displayed.
      if (ac.signal.aborted) {
        return;
      }

      const trimmed =
        cumulative.length > 1500 ? `${cumulative.slice(0, 1497)}\u2026` : cumulative.trim();
      if (trimmed) {
        setLatestInsight(trimmed);
        onInsight?.(trimmed);
      } else {
        setError("Narrator returned an empty reply");
        setStatus("error");
        return;
      }
      setStatus("idle");
    } catch (e) {
      // Distinguish intentional cancellation from real errors. The
      // fetch throws a DOMException("AbortError") when we cancel it.
      if (ac.signal.aborted) {
        return;
      }
      setError(
        `Narrator request failed: ${e instanceof Error ? e.message : String(e)}`,
      );
      setStatus("error");
    }
  }, [chartRef, symbol, granularity, speak, onInsight, cancelInFlight]);

  // Reset errors to idle so the badge doesn't stay red forever.
  useEffect(() => {
    if (status !== "error") return;
    const t = setTimeout(() => setStatus("idle"), 5000);
    return () => clearTimeout(t);
  }, [status]);

  // Debounced trigger on symbol / granularity change. Crucially, we
  // run `cancelInFlight()` synchronously on every change \u2014 a sub-second
  // symbol switch should HALT any in-flight fetch + drop any queued
  // TTS so the next capture starts fresh. The 1.2s setTimeout only
  // schedules the next capture AFTER the previous one has been
  // cancelled, so only the LAST symbol choice within any debounce
  // window fires a capture.
  const captureRef = useRef(captureAndAnalyze);
  captureRef.current = captureAndAnalyze;
  useEffect(() => {
    if (!enabled) return;
    cancelInFlight();
    const t = setTimeout(() => {
      void captureRef.current();
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [enabled, symbol, granularity, cancelInFlight]);

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
