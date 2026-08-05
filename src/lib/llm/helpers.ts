import type {
  ChatMessage,
  ChatCompletionOptions,
  AnalysisType,
  MessageContent,
} from "./types";

/**
 * Detect multimodal (image-bearing) messages. Returns true if ANY of
 * the messages has a content array containing an `image_url` part.
 *
 * Used by the Groq and OpenRouter providers to pick the right model —
 * text-only models (e.g. `llama-3.3-70b-versatile`) reject arrays and
 * return `messages[i].content must be a string` when given an image,
 * so we MUST route multimodal requests to a vision-capable model.
 *
 * The `Array.isArray(c)` gate is load-bearing: it rules out
 * string-content (which can contain the literal substring
 * "image_url"). Inside the array, `TextContent` and `ImageContent`
 * are typed object shapes — elements are never null — so we only
 * need to guard against degenerate values like a stray string element
 * slipping in via a malformed payload.
 */
export function messagesContainImage(messages: ChatMessage[]): boolean {
  return messages.some((m) => {
    const c = m.content as MessageContent;
    if (!Array.isArray(c)) return false;
    return c.some(
      (part) =>
        typeof part === "object" &&
        (part as { type?: unknown }).type === "image_url",
    );
  });
}

/**
 * Resolve the model slug for a provider given the messages and caller
 * options. Used by Groq and OpenRouter so multimodal requests
 * automatically route to a vision-capable slug and we get back
 * meaningful narration instead of a "messages must be a string" 400
 * from a text-only model.
 *
 * Priority order (highest first):
 *   1. `options.model` — explicit per-call override (wins even on
 *      multimodal so advanced callers can pin a specific model. If
 *      they pick a text-only slug for an image, the upstream provider
 *      will surface a clear 4xx — preferable to silently overriding
 *      their intent.)
 *   2. `env...(vision)` when the messages contain an image
 *   3. `env...(text)` when they don't
 *   4. Hard-coded `fallbackVision` / `fallbackText`
 *
 * Env vars are resolved with `||` (not `??`) so an explicitly-blank
 * env var (`GROQ_VISION_MODEL=""` in a `.env`) falls back to the
 * hard-coded slug instead of sending an empty `model:` field upstream.
 */
export function resolveModel(
  envTextVar: string,
  envVisionVar: string,
  fallbackText: string,
  fallbackVision: string,
  messages: ChatMessage[],
  options?: ChatCompletionOptions,
): string {
  if (options?.model) return options.model;
  const wantsVision = messagesContainImage(messages);
  const envValue = wantsVision
    ? process.env[envVisionVar]
    : process.env[envTextVar];
  return envValue || (wantsVision ? fallbackVision : fallbackText);
}

export function buildUserMessage(
  textPrompt: string,
  imageDataUrl?: string | null
): ChatMessage {
  if (imageDataUrl) {
    return {
      role: "user",
      content: [
        { type: "text", text: textPrompt },
        {
          type: "image_url",
          image_url: { url: imageDataUrl, detail: "high" },
        },
      ],
    };
  }

  return { role: "user", content: textPrompt };
}

export function buildTradingSystemPrompt(
  analysisType: AnalysisType,
  pair: string,
  timeframe: string
): string {
  const basePrompt = `You are an expert forex and financial markets analyst for TradingLens AI, a professional trading intelligence platform. You have deep knowledge of technical analysis, fundamental analysis, price action, smart money concepts (SMC/ICT), order blocks, fair value gaps, and market structure.

Current context:
- Trading pair: ${pair}
- Timeframe: ${timeframe}
- Date: ${new Date().toISOString().split("T")[0]}

Important guidelines:
- Provide actionable, professional-grade analysis — not generic advice.
- Use Markdown formatting with headings (## and ###), tables, and lists for clarity.
- Include specific price levels, stop losses, take profits, and risk/reward ratios when giving trade setups.
- Always add a ⚠️ disclaimer: "This is AI-generated analysis. Always do your own research before trading."
- Be precise and quantitative rather than vague.
- When you don't have real-time data, note that and provide analysis based on common patterns.
- You MUST end your response with the following structured tags on their own lines:
  <SIGNAL>BUY</SIGNAL> (use exactly BUY, SELL, or HOLD)
  <CONFIDENCE>85</CONFIDENCE> (a number from 0 to 100)
- Do NOT wrap these tags in markdown code blocks. Output them directly as plain text.
- Example end of response:
  <SIGNAL>BUY</SIGNAL>
  <CONFIDENCE>85</CONFIDENCE>`;

  const typeSpecific: Record<AnalysisType, string> = {
    analyze: `\n\nFocus on full technical analysis: trend identification, key support/resistance levels, RSI implications, MACD signals, moving average crossovers, Bollinger Band positioning, chart patterns, candlestick formations, and a concrete trade setup with entry, stop loss, and take profit levels.`,
    sentiment: `\n\nFocus on market sentiment: retail vs institutional positioning, contrarian signals, upcoming economic events impact, fundamental drivers for both currencies, and a sentiment score from 0-100 with subscores for technical, fundamental, and positioning factors.`,
    levels: `\n\nFocus on support and resistance: identify all major and minor levels, pivot points, order blocks (bullish and bearish), liquidity zones above and below current price, fair value gaps, and market structure shifts. Use a table format for levels with type and strength ratings.`,
    opportunities: `\n\nFocus on trade opportunities: provide 2-3 concrete trade setups with clear entry criteria, stop loss levels, take profit targets, risk/reward ratios, confidence scores, and the timeframe for each setup. Include both long and short opportunities where relevant.`,
  };

  return basePrompt + typeSpecific[analysisType];
}

export function classifyAnalysisType(prompt: string): AnalysisType {
  const lower = prompt.toLowerCase();
  if (lower.includes("sentiment") || lower.includes("market feel")) return "sentiment";
  if (lower.includes("support") || lower.includes("resistance") || lower.includes("level")) return "levels";
  if (lower.includes("opportunity") || lower.includes("trade") || lower.includes("setup")) return "opportunities";
  return "analyze";
}
