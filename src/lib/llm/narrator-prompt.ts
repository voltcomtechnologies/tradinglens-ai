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

export const NARRATOR_SYSTEM_PROMPT = `You are Grok, an expert forex trader narrating the chart visible in the image to a trader watching a live dashboard. Speak in the first person, addressing the listener directly ("you", "your chart"), as if you are sitting beside them. Do not use any markdown — no headings, no bullet points, no tables, no bold, no asterisks. Do not wrap your reply in any XML tags like <SIGNAL>. Keep your reply under 600 characters, structured as 2–3 short sentences: (1) what the candle pattern visually shows — trend direction, momentum, any near-term support or resistance visible on the candles or wicks, (2) what the trader should watch next on this pair, (3) a brief heads-up if high-impact economic news for any currency in the pair is anticipated in the near term (use the supplied headlines only when genuinely relevant — ignore them otherwise and don't fabricate). Avoid hedging words like "might" or "possibly" unless genuinely uncertain.`;

/**
 * Shape of a forex-news headline supplied to the narrator. Matches
 * `ForexNewsItem` from `src/lib/rss/forex-news.ts` so the client hook
 * can pass the SSR-fetched payload through without a transformation.
 */
export interface NarratorNewsHeadline {
  title: string;
  link: string;
  pubDate: string | null;
}

/**
 * Build the narrator user message — pairs the image reference with a
 * short context line that names the symbol + timeframe (so Grok doesn't
 * have to guess it from the axis labels) AND tacks on any pair-scoped
 * headlines the client pre-fetched from /api/forex-news.
 */
export function buildNarratorUserMessage(
  pair: string,
  timeframe: string,
  headlines: NarratorNewsHeadline[] = [],
): string {
  const base = `Here is a ${timeframe.toUpperCase()} candlestick chart of ${pair}. Narrate what you see in 2–3 short sentences per the instructions.`;
  if (headlines.length === 0) return base;
  // Cap at 3 so the user message stays well under the 600-character
  // system budget that the narrator system prompt sets.
  const bullets = headlines
    .slice(0, 3)
    .map((h) => `- ${h.title}`)
    .join("\n");
  return `${base}\n\nRecent headlines relevant to ${pair}:\n${bullets}`;
}

/**
 * Build an optional supplementary system prompt that re-frames the news
 * as authoritative context, not as a directive. The base narrator
 * instructions still dominate — Grok only references a headline if it
 * genuinely relates to the chart pattern visible on screen.
 */
export function buildNarratorSystemPromptWithNews(
  basePrompt: string,
  headlines: NarratorNewsHeadline[] = [],
): string {
  if (headlines.length === 0) return basePrompt;
  const bullets = headlines
    .slice(0, 3)
    .map((h) => `- ${h.title}`)
    .join("\n");
  // Sentences at the END of the system prompt carry higher attention
  // weight in OpenAI's chat models than ones earlier in the prompt.
  return `${basePrompt}\n\nReference headlines (only when directly relevant to the visible chart):\n${bullets}`;
}
