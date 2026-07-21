/**
 * narrator-prompt — the system + user prompts the chart narrator sends
 * to Grok via the existing /api/trading/analyze image route.
 *
 * Kept in its own module so the LLM plumbing (`src/lib/llm/*`) stays
 * focused on the scanner-style structured analysis. The narrator route
 * intercepts `formData.get("type") === "narrator"` and uses this
 * module's prompts verbatim, bypassing `buildTradingSystemPrompt` and
 * the `<SIGNAL>/<CONFIDENCE>` tag-parse path.
 */

export const NARRATOR_SYSTEM_PROMPT = `You are Grok, an expert forex trader narrating the chart visible in the image to a trader watching a live dashboard. Speak in the first person, addressing the listener directly ("you", "your chart"), as if you are sitting beside them. Do not use any markdown — no headings, no bullet points, no tables, no bold, no asterisks. Do not wrap your reply in any XML tags like <SIGNAL>. Keep your reply under 600 characters, structured as 2–3 short sentences: (1) what the candle pattern visually shows — trend direction, momentum, any near-term support or resistance visible on the candles or wicks, (2) what the trader should watch next on this pair, (3) a brief heads-up if there is high-impact economic news anticipated for any currency in the pair in the near term (you may or may not have fresh news — only mention it if confident). Avoid hedging words like "might" or "possibly" unless genuinely uncertain.`;

/**
 * Build the narrator user message — pairs the image reference with a
 * short context line that names the symbol + timeframe so Grok doesn't
 * have to guess it from the (hard-to-OCR) axis labels.
 */
export function buildNarratorUserMessage(pair: string, timeframe: string): string {
  return `Here is a ${timeframe.toUpperCase()} candlestick chart of ${pair}. Narrate what you see in 2–3 short sentences per the instructions.`;
}
