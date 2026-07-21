/**
 * utterance-edge sentence splitter + sequential TTS drafter.
 *
 * Streaming LLMs emit chunks of 1-3 chars at a time. We want TTS to fire
 * on the FIRST sentence boundary (`. `, `! `, `? `, `\n`) once we have
 * enough buffer to be meaningful, without waiting for the full reply.
 *
 * Sequence:
 *   1. `push(delta)` is called repeatedly as chunks arrive.
 *   2. The internal buffer accumulates, and on each push we look for the
 *      earliest sentence boundary that produces a `candidate.length >= MIN_LEN`
 *      string. If found, we `enqueue` it and trim the buffer past the
 *      boundary. (We re-scan only because trimming invalidates the lastIndex.)
 *   3. The first `enqueue` drains the queue by calling `speak(sentence,
 *      onEnd)`. Subsequent enqueues append to the queue; the `onEnd`
 *      callback drains the next sentence when the current one finishes.
 *   4. `finish()` flushes whatever remains in the buffer past the last
 *      boundary (a partial sentence) once the stream completes.
 *   5. `reset()` clears the buffer AND the queue. The caller invokes this
 *      whenever a NEW capture supersedes an in-flight one — that cancels
 *      the in-progress sentence via the TTS `cancel()` called by speak().
 *
 * Why a queue instead of unbounded nested speaks: `window.speechSynthesis`
 * rejects/ignores queues that overflow, and `speak` always calls `cancel()`
 * before enqueuing the next utterance. We CANNOT fire `speak` in parallel
 * because each `speak()` cancels the prior; sequential chained speaks via
 * `onEnd` is the only reliable pattern.
 *
 * Trade-off: when the stream rate is fast (e.g. token-per-30ms) we'll
 * speak sentence 1, then immediately speak sentence 2, etc. The user hears
 * short utterances back-to-back. We avoid splitting too aggressively by
 * requiring >= MIN_LEN to speak.
 */

const MIN_LEN = 35;

export interface SentenceSequencerOptions {
  speak: (text: string, onEnd?: () => void) => void;
  /** Optional callback for the partial tail flushed by `finish()`. */
  onTail?: (text: string) => void;
}

export class SentenceSequencer {
  private buf = "";
  private queue: string[] = [];
  private isDraining = false;

  constructor(private readonly opts: SentenceSequencerOptions) {}

  /** Append a streaming delta and fire any speakable sentences immediately. */
  push(delta: string): void {
    if (!delta) return;
    this.buf += delta;
    this.drainBoundaries();
  }

  /** Flush whatever's left past the last boundary. Called when the
   *  underlying stream completes. */
  finish(): void {
    const tail = this.buf.trim();
    this.buf = "";
    if (!tail) return;
    this.opts.onTail?.(tail);
    this.enqueue(tail);
  }

  /** Cancel the entire queue. The current utterance (if any) is also
   *  cancelled implicitly by the OUTER caller's decision to abort the
   *  fetch + cancel TTS. We MUST also drain the queue so a followup
   *  fresh capture doesn't replay old sentences. */
  reset(): void {
    this.buf = "";
    this.queue = [];
    this.isDraining = false;
  }

  // ── internals ─────────────────────────────────────────────────────

  private drainBoundaries(): void {
    // Re-scan from start every push \u2014 trim() invalidates regex.lastIndex.
    const regex = /[.!?]\s|\n/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(this.buf)) !== null) {
      const candidate = this.buf.slice(0, match.index + match[0].length).trim();
      if (candidate.length >= MIN_LEN) {
        this.enqueue(candidate);
        this.buf = this.buf.slice(match.index + match[0].length).trimStart();
        regex.lastIndex = 0;
      }
    }
  }

  private enqueue(sentence: string): void {
    if (!sentence) return;
    this.queue.push(sentence);
    if (this.queue.length === 1 && !this.isDraining) {
      this.drain();
    }
  }

  private drain(): void {
    const next = this.queue.shift();
    if (!next) {
      this.isDraining = false;
      return;
    }
    this.isDraining = true;
    try {
      this.opts.speak(next, () => this.drain());
    } catch {
      // Speech queue rejected the utterance (e.g. browser TTS paused);
      // stop draining rather than spin-loop.
      this.isDraining = false;
      this.queue = [];
    }
  }
}

/** Lightweight accumulator for incremental SSE event payloads.
 *  OpenAI / OpenRouter / Groq all emit `data: <json>\n\n` chunks. The
 *  payload may arrive split across multiple TCP packets, so we maintain
 *  a `carry` and only flush complete events (terminated by `\n\n`). */
export class SseLineStreamer {
  private carry = "";

  /** Feed a raw chunk from `ReadableStreamDefaultReader.read().value`. */
  push(chunk: string): string[] {
    this.carry += chunk;
    const events: string[] = [];
    let idx: number;
    while ((idx = this.carry.indexOf("\n\n")) !== -1) {
      events.push(this.carry.slice(0, idx));
      this.carry = this.carry.slice(idx + 2);
    }
    return events;
  }

  /** True if there's a partial event still buffered (no terminating \n\n). */
  hasPending(): boolean {
    return this.carry.length > 0;
  }

  reset(): void {
    this.carry = "";
  }
}

/** Extract the assistant content delta from an OpenAI-style SSE event. */
export function extractDelta(event: string): string | null {
  if (!event.startsWith("data:")) return null;
  const data = event.slice(5).trim();
  if (!data || data === "[DONE]") return null;
  try {
    const parsed = JSON.parse(data) as {
      choices?: Array<{ delta?: { content?: string } }>;
      // server-side wrapping variant
      delta?: string;
    };
    return (
      parsed.delta ??
      parsed.choices?.[0]?.delta?.content ??
      null
    );
  } catch {
    return null;
  }
}
