import type { ChatMessage, AnalysisType } from "./types";

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
