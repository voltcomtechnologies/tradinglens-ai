/**
 * Static fallback — pair/timeframe-aware short narration line emitted by
 * the streaming narrator route when the upstream LLM yields zero
 * usable content (provider misconfigured, content-filter trip, rate
 * limit hit, model returned empty choices, etc.).
 *
 * The line is shaped to the SAME 2-3 short sentences / < 600 chars
 * contract that `NARRATOR_SYSTEM_PROMPT` asks for, so the client never
 * surfaces the unhelpful "Narrator returned an empty reply" string on a
 * real upstream failure — the user hears a coherent short line and the
 * LLM will likely succeed on the next capture.
 *
 * Lives in its own module so:
 *   - The narration contract for the fallback is centralised — easy to
 *     tweak the wording without poking at the route.
 *   - It's trivially unit-testable (no FETCH / route mocking needed).
 *   - The same string can be reused client-side as a UI placeholder on
 *     graceful degradation if we ever want to.
 */

const FALLBACK_MAX_CHARS = 600;

/**
 * Build the fallback narration line for the given pair + timeframe.
 *
 * @param pair     Currency pair symbol as supplied to the form-data
 *                 field (e.g. "EURUSD"). Defaults to "EURUSD".
 * @param timeframe Granularity string as supplied to the form-data
 *                 field (e.g. "1h", "1d"). Will be uppercased for the
 *                 user-facing copy. Defaults to "1H".
 */
export function buildStaticNarratorFallback(
  pair: string = "EURUSD",
  timeframe: string = "1H",
): string {
  const tf = timeframe.toUpperCase();
  const line = `I couldn't get a clean read on your ${pair} chart on the ${tf} timeframe just now. The candle structure isn't clear enough for a confident narration. I'll try again on the next capture in a few minutes; in the meantime, watch for a decisive break above the most recent swing high or below the most recent swing low before committing to a position.`;
  // Defensive: hard-truncate to NARRATOR_SYSTEM_PROMPT's budget. If a
  // future edit blows the cap, prefer the early prefix over silent
  // truncation mid-sentence.
  return line.length > FALLBACK_MAX_CHARS
    ? `${line.slice(0, FALLBACK_MAX_CHARS - 1).trimEnd()}\u2026`
    : line;
}
