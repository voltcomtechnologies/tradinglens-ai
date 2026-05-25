/**
 * OpenRouter LLM client — OpenAI-compatible chat completions API.
 * Docs: https://openrouter.ai/docs/api-reference/overview
 */

export type AnalysisType = "analyze" | "sentiment" | "levels" | "opportunities";

// ── Message types supporting both text and multimodal (vision) content ──

interface TextContent {
  type: "text";
  text: string;
}

interface ImageUrlObject {
  url: string; // data: URL or https URL
  detail?: "low" | "high" | "auto";
}

interface ImageContent {
  type: "image_url";
  image_url: ImageUrlObject;
}

type MessageContent = string | Array<TextContent | ImageContent>;

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: MessageContent;
}

interface OpenRouterRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface OpenRouterResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  error?: {
    message: string;
    code: string;
  };
}

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const DEFAULT_MODEL = "openai/gpt-4o-mini";
const REQUEST_TIMEOUT = 90_000; // 90 seconds

export async function chatCompletion(
  messages: ChatMessage[],
  options?: {
    temperature?: number;
    maxTokens?: number;
    model?: string;
  }
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const body: OpenRouterRequest = {
      model: options?.model ?? process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2048,
      stream: false,
    };

    const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.APP_URL ?? "https://tradinglens-ai.vercel.app",
        "X-Title": "TradingLens AI",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OpenRouter API error ${response.status}: ${errorText.slice(0, 500)}`
      );
    }

    const data: OpenRouterResponse = await response.json();

    if (data.error) {
      throw new Error(
        `OpenRouter error ${data.error.code}: ${data.error.message}`
      );
    }

    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("OpenRouter returned an empty response");
    }

    return content;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Build a multimodal user message that can include a chart image.
 */
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

/**
 * Build a trading analysis system prompt based on the type of analysis requested.
 */
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
- When you don't have real-time data, note that and provide analysis based on common patterns.`;

  const typeSpecific: Record<AnalysisType, string> = {
    analyze: `\n\nFocus on full technical analysis: trend identification, key support/resistance levels, RSI implications, MACD signals, moving average crossovers, Bollinger Band positioning, chart patterns, candlestick formations, and a concrete trade setup with entry, stop loss, and take profit levels.`,
    sentiment: `\n\nFocus on market sentiment: retail vs institutional positioning, contrarian signals, upcoming economic events impact, fundamental drivers for both currencies, and a sentiment score from 0-100 with subscores for technical, fundamental, and positioning factors.`,
    levels: `\n\nFocus on support and resistance: identify all major and minor levels, pivot points, order blocks (bullish and bearish), liquidity zones above and below current price, fair value gaps, and market structure shifts. Use a table format for levels with type and strength ratings.`,
    opportunities: `\n\nFocus on trade opportunities: provide 2-3 concrete trade setups with clear entry criteria, stop loss levels, take profit targets, risk/reward ratios, confidence scores, and the timeframe for each setup. Include both long and short opportunities where relevant.`,
  };

  return basePrompt + typeSpecific[analysisType];
}

/**
 * Determine the type of analysis based on the user's prompt keywords.
 */
export function classifyAnalysisType(prompt: string): AnalysisType {
  const lower = prompt.toLowerCase();
  if (lower.includes("sentiment") || lower.includes("market feel")) return "sentiment";
  if (lower.includes("support") || lower.includes("resistance") || lower.includes("level")) return "levels";
  if (lower.includes("opportunity") || lower.includes("trade") || lower.includes("setup")) return "opportunities";
  return "analyze";
}
