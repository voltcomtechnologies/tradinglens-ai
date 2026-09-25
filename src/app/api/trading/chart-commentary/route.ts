import { NextResponse } from "next/server";
import { xaiClient } from "@/lib/llm/xai";
import { fetchForexNews, filterForPair, type ForexNewsItem } from "@/lib/rss/forex-news";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      symbol = "EURUSD",
      currentPrice = 1.085,
      priceChange = 0,
      timeframe = "1H",
      regime = {},
      activeSignal = null,
      signalsCount = 0,
    } = body;

    // Fetch pair-scoped economic news headlines
    let newsHeadlines: ForexNewsItem[] = [];
    try {
      const allNews = await fetchForexNews();
      newsHeadlines = filterForPair(allNews, symbol);
    } catch {
      newsHeadlines = [];
    }

    const headlinesText = newsHeadlines.slice(0, 4).map((h) => `- ${h.title}`).join("\n");

    const systemPrompt = `You are an elite institutional forex analyst and live trading floor commentator.
Your job is to provide live conversational spoken commentary for traders analyzing ${symbol} on the Chart Lens dashboard.

You must cover TWO essential dimensions in your commentary:
1. TECHNICAL SETUP & SIGNALS:
   - Current price, trend momentum, EMA 9/21 baseline, Bollinger Bands position, and RSI momentum.
   - Any active Buy/Sell signal with exact Entry, Stop Loss, and Take Profit targets (Risk/Reward 1:2.0).
2. FUNDAMENTAL ANALYSIS:
   - Central bank policy stance (e.g. Federal Reserve vs ECB / BOE / BOJ rate expectations).
   - Macroeconomic drivers: inflation trends, yields, geopolitical risk sentiment, and any upcoming high-impact economic calendar events.

Tone: Professional, direct, authoritative, and spoken naturally like an experienced desk trader speaking directly to the user ("we're seeing", "you should watch", "our active setup").
Keep the spoken script punchy, engaging, and under 120 words so it speaks smoothly and crisply without filler.
Do not use markdown formatting (no asterisks, no bullet points, no hashes) in the commentary script because it is being read aloud by voice.`;

    const userPrompt = `Pair: ${symbol}
Current Price: ${currentPrice} (${priceChange >= 0 ? "+" : ""}${Number(priceChange).toFixed(2)}%)
Timeframe: ${timeframe}
Market Regime: Trend is ${regime.trend || "Neutral"}, RSI is ${regime.rsiState || "Balanced"}, Volatility is ${regime.volatilityState || "Normal"}
Active Strategy Signal: ${
      activeSignal
        ? `${activeSignal.type} at ${activeSignal.price}, Stop Loss: ${activeSignal.stopLoss}, Take Profit 1: ${activeSignal.takeProfit1}, Take Profit 2: ${activeSignal.takeProfit2}, R:R: ${activeSignal.riskReward}, Confluences: ${activeSignal.confluence?.join(", ")}`
        : "None currently triggered, scanning for high-conviction confluence."
    }
Total Historical Signals on Chart: ${signalsCount}

Recent Economic & Fundamental Headlines:
${headlinesText || "No immediate high-impact headlines in the last few hours."}

Synthesize a live technical & fundamental commentary briefing.`;

    let commentaryScript = "";
    let technicalSummary = "";
    let fundamentalSummary = "";

    if (xaiClient.isAvailable()) {
      try {
        const fullResponse = await xaiClient.chatCompletion([
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ]);
        commentaryScript = fullResponse.trim();
      } catch (err) {
        console.error("Grok commentary generation failed, using fallback:", err);
      }
    }

    // High quality institutional fallback if API key temporarily unavailable
    if (!commentaryScript) {
      const isUp = priceChange >= 0;
      const baseCurr = symbol.slice(0, 3);
      const quoteCurr = symbol.slice(3, 6);
      commentaryScript = `${symbol} is trading around ${currentPrice}, ${
        isUp ? "gaining ground" : "pulling back"
      } ${Math.abs(priceChange).toFixed(2)}% on the ${timeframe} chart. ${
        activeSignal
          ? `We have a confirmed ${activeSignal.type} signal triggered at ${activeSignal.price}, with invalidation at ${activeSignal.stopLoss} and upside targets at ${activeSignal.takeProfit1}. Confluence is supported by ${activeSignal.confluence?.[0] || "EMA trend alignment"}.`
          : `The trend structure remains ${regime.trend?.toLowerCase() || "neutral"} with RSI reading at ${regime.rsiState || "midrange"} as we watch for an institutional liquidity sweep.`
      } Fundamentally, divergence between ${baseCurr} central bank rate expectations and ${quoteCurr} economic data is dictating near-term order flow. Keep risk controlled at one to two risk reward.`;
    }

    technicalSummary = activeSignal
      ? `${activeSignal.type} signal active @ ${activeSignal.price} (SL: ${activeSignal.stopLoss}, TP1: ${activeSignal.takeProfit1})`
      : `Trend ${regime.trend || "Neutral"} • RSI ${regime.rsiState || "Neutral"} • Volatility ${regime.volatilityState || "Normal"}`;

    fundamentalSummary = newsHeadlines[0]?.title || `Central bank monetary policy and interest rate differentials guiding ${symbol} macro flow.`;

    return NextResponse.json({
      success: true,
      symbol,
      commentaryScript,
      technicalSummary,
      fundamentalSummary,
      activeSignal,
      headlines: newsHeadlines.slice(0, 3),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error generating live chart commentary:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate chart commentary" },
      { status: 500 }
    );
  }
}
