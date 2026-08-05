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

/**
 * Parse a "use this slug instead: <slug>" migration hint from an error
 * message or a JSON error envelope returned by Groq / OpenRouter when
 * a model has been deprecated or moved to a paid tier.
 *
 * Returns the suggested slug (e.g. "deepseek/deepseek-v3-flash") or
 * null if no migration hint is found.
 *
 * Recognised message shapes (case-insensitive):
 *   "...use this slug instead: <slug>"
 *   "...use this model: <slug>"
 *   "...use model <slug> instead"
 *   "...use the model: <slug>"
 *   "...please use <slug>"
 *
 * Robust to:
 *   - JSON envelope (`{"error":{"message":"..."}}` or `{"message":"..."}`)
 *     — we drill into the message field first, then regex against that.
 *   - Both backtick and double-quote delimiters around the slug.
 *   - Slugs containing `/`, `.`, `-`, `_` (the Groq / OpenRouter charset).
 *
 * NOT extracted:
 *   - Things that look like slugs but aren't tied to a "use X" verb
 *     (avoids false positives on embedded model names in error text).
 *   - Plain URL paths that happen to contain `/` (the start-of-slug
 *     requires alphanumeric, so a path like `/v1/chat` won't match).
 */
export function extractMigratedSlug(
  errorTextOrMessage: string | null | undefined,
): string | null {
  if (!errorTextOrMessage) return null;
  const text = String(errorTextOrMessage).trim();
  if (!text) return null;

  // If the caller handed us a full JSON error body, drill into the
  // message field first so we match against the human-readable text
  // instead of a JSON-escaped version of it.
  if (text.startsWith("{")) {
    try {
      const parsed = JSON.parse(text) as {
        error?: { message?: string };
        message?: string;
      };
      const inner = parsed.error?.message ?? parsed.message;
      if (inner) {
        const fromInner = extractMigratedSlug(inner);
        if (fromInner) return fromInner;
      }
    } catch {
      // Not JSON or malformed — fall through to regex on the raw text.
    }
  }

  // Anchored to a "use(…) (…):" or "(…):<slug>" form so casual mentions
  // of "model X" elsewhere in the error don't get pulled out.
  // Two changes from the original regex:
  //   1. The trailing `(?:this\s+slug\s+instead|...)` group is now OPTIONAL
  //      so we match the bare "Please use X" form (no model/slug completer).
  //   2. The slug char class now includes `:` because OpenRouter uses
  //      `:free` and `:nitro` suffixes (e.g. `google/gemini-2.0-flash-exp:free`)
  //      that we MUST preserve when forming the retry URL.
  const match = text.match(
    /(?:please\s+)?use\s+(?:this\s+slug\s+instead|this\s+model|the\s+model|the\s+slug|model|slug)?\s*[:\-]?\s*[`"']?([A-Za-z0-9][A-Za-z0-9._/:\\-]{0,127})[`"']?/i,
  );
  return match ? match[1] : null;
}

/**
 * POST a chat-completions request and retry once with a migrated slug
 * if the upstream suggests one in its error envelope.
 *
 * Why this exists: Groq and OpenRouter rotate free-tier slugs fairly
 * often — e.g. OpenRouter recently moved `deepseek/deepseek-v4-flash`
 * to paid-only, leaving Vercel deployments that pinned it via env var
 * stuck. Rather than requiring operators to notice, edit a Vercel env
 * var, and redeploy, the provider layer can self-heal: on the first
 * !OK response, we parse the error for a "use this slug instead: X"
 * hint and retry once with X.
 *
 * Crucially, the retry happens OFF THE BACK of the failed response —
 * we discard the body and re-POST with the new model. This is cleaner
 * than trying to replay the body (which is consumed by
 * `response.text()`) and avoids any risk of the upstream half-handling
 * the retry on a connection that was already in an error state.
 *
 * Capped at 1 retry to prevent infinite ping-pong (e.g. if the
 * suggested slug is also unavailable and suggests another). The
 * upper layer in `index.ts` will still surface the error to the
 * next-provider fallback chain if this returns a failed Response.
 *
 * Boundaries this helper does NOT cover (deliberate):
 *   - Mid-stream SSE errors are NOT retried. Once the response body
 *     opens, partial deltas have already been yielded to the caller;
 *     re-POSTing and streaming a fresh response would duplicate /
 *     interleave content. Surfacing the error is the correct UX
 *     because the upstream-fallback chain in `index.ts` then picks
 *     up the next provider for the next request.
 *   - Paid-only "use X instead" suggestions. If X is itself behind a
 *     paywall (e.g. OpenRouter suggesting a paid-tier slug), the
 *     retry will fail identically. The migration error message
 *     preserved on the thrown error makes this case debuggable; the
 *     next-provider chain (Groq) is the realistic recovery path
 *     for those deployments.
 */
export async function fetchWithMigrationRetry(args: {
  url: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
  signal: AbortSignal | undefined;
  providerName: string;
}): Promise<Response> {
  const initial = await fetch(args.url, {
    method: "POST",
    headers: args.headers,
    body: JSON.stringify(args.body),
    signal: args.signal,
  });
  if (initial.ok) return initial;

  const errorText = await initial.text();
  const migratedSlug = extractMigratedSlug(errorText);
  if (!migratedSlug) {
    throw new Error(
      `${args.providerName} API error ${initial.status}: ${errorText.slice(0, 500)}`,
    );
  }

  // Retry once with the suggested slug. We deliberately do NOT recurse
  // here — a single retry is enough, and a second failure surfaces
  // with full migration context for the operator (and for the
  // next-provider fallback chain in `index.ts`).
  const retryBody = { ...args.body, model: migratedSlug };
  const retry = await fetch(args.url, {
    method: "POST",
    headers: args.headers,
    body: JSON.stringify(retryBody),
    signal: args.signal,
  });
  if (retry.ok) return retry;
  const retryErrorText = await retry.text();
  throw new Error(
    `${args.providerName} API error ${initial.status} (model "${String(args.body.model)}" deprecated → suggested "${migratedSlug}") → retry ${retry.status}: ${retryErrorText.slice(0, 500)}`,
  );
}

export function classifyAnalysisType(prompt: string): AnalysisType {
  const lower = prompt.toLowerCase();
  if (lower.includes("sentiment") || lower.includes("market feel")) return "sentiment";
  if (lower.includes("support") || lower.includes("resistance") || lower.includes("level")) return "levels";
  if (lower.includes("opportunity") || lower.includes("trade") || lower.includes("setup")) return "opportunities";
  return "analyze";
}
