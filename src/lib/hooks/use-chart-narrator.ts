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
 * News integration:
 *   - Before posting the multipart body, we fetch pair-scoped headlines
 *     from /api/forex-news so Grok can mention upcoming news events
 *     relevant to the focused pair. The fetch is promise.all'd with the
 *     capture so we don't add latency. Headlines are cached in a
 *     module-scope map by `pair` for 60s — moving between pairs
 *     invalidates the cache; rapid capture fires on the SAME pair
 *     reuse the cached list, avoiding RSS-endpoint hammering.
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
import {
  NARRATOR_SYSTEM_PROMPT,
  buildNarratorUserMessage,
  type NarratorNewsHeadline,
} from "@/lib/llm/narrator-prompt";
import {
  SentenceSequencer,
  SseLineStreamer,
  extractDelta,
  extractStreamError,
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
// Reuse the same headlines list for as long as the narrator's
// 5-minute heartbeat typically lives. A cache SHORTER than the
// heartbeat interval (e.g. the original 60s) misses the cache on
// every heartbeat and re-fetches the RSS endpoint, defeating the
// rate-limit purpose. Bumping TTL to match INTERVAL_MS means only
// the debounced symbol-change trigger can ever cause a cache reset
// before the next heartbeat. The upstream RSS itself refreshes every
// ~5 min so there is no staleness cost.
const HEADLINES_TTL_MS = 5 * 60 * 1000;

// Module-scope headline cache keyed by pair symbol. We use module-scope
// (rather than a ref) so that even if the React component remounts the
// hook, repeat captures on the SAME pair skip the RSS roundtrip.
interface HeadlinesCacheEntry {
  fetchedAt: number;
  headlines: NarratorNewsHeadline[];
}
const headlinesCache: Map<string, HeadlinesCacheEntry> = new Map();

/**
 * Server-validated response shape from /api/forex-news. We only read
 * `items` — the route also returns `pair` / `source` / `cachedAt`.
 */
interface ForexNewsResponseBody {
  items?: NarratorNewsHeadline[];
}

/**
 * Fetch pair-scoped headlines, reusing a 60s cache per pair symbol. The
 * hook calls this on every capture; the RSS endpoint only sees one
 * request per pair per ~minute in the worst case.
 *
 * Returns [] silently on any failure (network 502, JSON parse, etc.).
 * The narrator system prompt tolerates zero headlines — Grok simply
 * won't reference any news in that capture.
 */
async function fetchHeadlinesForPair(
  pair: string,
  signal: AbortSignal,
): Promise<NarratorNewsHeadline[]> {
  const cached = headlinesCache.get(pair);
  if (cached && Date.now() - cached.fetchedAt < HEADLINES_TTL_MS) {
    return cached.headlines;
  }
  try {
    const res = await fetch(
      `/api/forex-news?pair=${encodeURIComponent(pair)}`,
      {
        cache: "no-store",
        signal,
      },
    );
    if (!res.ok) return cached?.headlines ?? [];
    const data = (await res.json()) as ForexNewsResponseBody;
    const next = Array.isArray(data.items) ? data.items : [];
    headlinesCache.set(pair, { fetchedAt: Date.now(), headlines: next });
    return next;
  } catch {
    // AbortError or network failure — fall through.
    return cached?.headlines ?? [];
  }
}

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
    let headlines: NarratorNewsHeadline[] = [];
    const ac = new AbortController();
    abortRef.current = ac;

    // Capture canvas + fetch headlines IN PARALLEL. Both are independent;
    // the slower of the two dictates the latency floor. Headlines fetch is
    // best-effort: on failure we send the prompt without them and Grok
    // simply skips the news sentence.
    setStatus("capturing");
    try {
      const results = await Promise.allSettled([
        chartRef.current.captureCanvas(),
        fetchHeadlinesForPair(symbol, ac.signal),
      ]);
      const blobResult = results[0];
      const newsResult = results[1];
      if (blobResult.status === "fulfilled" && blobResult.value) {
        blob = blobResult.value;
      } else if (blobResult.status === "rejected") {
        throw blobResult.reason instanceof Error
          ? blobResult.reason
          : new Error(String(blobResult.reason));
      }
      if (newsResult.status === "fulfilled") {
        headlines = newsResult.value;
      }
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
    if (ac.signal.aborted) return;

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
      form.append(
        "prompt",
        buildNarratorUserMessage(symbol, granularity, headlines),
      );
      // Send the client-supplied system prompt verbatim. The route
      // honours it only when `type === "narrator"` (see app/api/trading/
      // analyze/route.ts) — non-narrator uploads always go through
      // `buildTradingSystemPrompt` server-side.
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
      // If the server emitted an `{error:"..."}` event mid-stream, we
      // surface its message verbatim instead of the generic "empty
      // reply" fallback — the upstream cause (auth, content-filter,
      // model unavailable) is far more useful for the user than a
      // blanket error string.
      let upstreamError: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (ac.signal.aborted) break;
        // Decode UTF-8 in streaming mode so multi-byte characters split
        // across packets don't corrupt.
        const chunk = decoder.decode(value, { stream: true });
        const events = sse.push(chunk);
        for (const evt of events) {
          // Order matters: error events are surfaced FIRST so a stream
          // that starts with content then fails (e.g. Groq token-cut
          // mid-reply) doesn't display a half-answer and then error-out
          // on the next capture.
          const serverError = extractStreamError(evt);
          if (serverError) {
            // First-error-wins is more useful than last-error-wins: if
            // multiple `{error:...}` events arrive (an unlikely edge
            // case, but possible if the server retries or surfaces a
            // chain of failures), the user sees the most-informative
            // early cause rather than the most-recently-arrived one.
            upstreamError ??= serverError;
            // Don't break the loop — there may still be trailing deltas
            // when an upstream provider emits a final chunk before
            // closing. We surface the error message at the end.
            continue;
          }
          const delta = extractDelta(evt);
          if (delta == null) {
            // Sentinel "[DONE]" or non-data event (heartbeat).
            continue;
          }
          cumulative += delta;
          seq.push(delta);
        }
      }
      // Final SSE flush. Two distinct concerns MUST be handled:
      //   1. The streaming TextDecoder holds back bytes that complete
      //      multi-byte UTF-8 characters until the next read. Calling
      //      `decoder.decode()` with no args flushes those bytes — but
      //      the returned residue string must be pushed through SSE
      //      first, otherwise a payload that splits a multi-byte
      //      character across the boundary loses those bytes.
      //   2. After that push, any unterminated event still sitting in
      //      the SSE carry is surfaced via `drain()` so a missing
      //      trailing `\n\n` (transport proxy / edge cache truncation)
      //      doesn't drop the last chunk.
      // The order matters: residue-push first, carry-drain second.
      const tail = decoder.decode();
      if (tail) sse.push(tail);
      const trailingEvents = sse.drain();
      for (const evt of trailingEvents) {
        const serverError = extractStreamError(evt);
        if (serverError) {
          upstreamError ??= serverError;
          continue;
        }
        const d = extractDelta(evt);
        if (d) {
          cumulative += d;
          seq.push(d);
        }
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

      // The server told us something went wrong upstream. Surface the
      // exact message before checking the empty-reply path so the user
      // doesn't see the misleading "returned an empty reply" string on
      // top of a real upstream cause.
      if (upstreamError) {
        setError(`Narrator upstream error: ${upstreamError}`);
        setStatus("error");
        return;
      }

      const trimmed =
        cumulative.length > 1500 ? `${cumulative.slice(0, 1497)}\u2026` : cumulative.trim();
      if (trimmed) {
        setLatestInsight(trimmed);
        onInsight?.(trimmed);
      } else {
        // Zero deltas AND no server-emitted error event \u2014 typically means
        // the server fell back to a friendly narration that still came
        // through as a delta, OR a transport-level bug ate every chunk.
        // If the server's fallback ran, the SSE stream should've emitted
        // a delta event for it. If we land here, something downstream
        // of the server (transport / parser) ate the original payload.
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
