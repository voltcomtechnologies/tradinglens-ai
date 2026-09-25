import { NextResponse } from "next/server";
import { xaiClient } from "@/lib/llm/xai";
import {
  fetchForexNews,
  fetchGlobalMarketIntelligence,
  filterForPair,
  type ForexNewsItem,
} from "@/lib/rss/forex-news";

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
      lastCommentaryScript = "",
      lastPrice = null,
      lastSignalType = null,
      lastHeadlines = [],
      is5MinCycle = false,
    } = body;

    // Fetch global news from wires (Bloomberg, Reuters, DailyFX, ForexLive, FXStreet)
    // and trading community chatter (Reddit r/Forex, FinTwit desks)
    let newsHeadlines: ForexNewsItem[] = [];
    try {
      let allNews: ForexNewsItem[] = [];
      if (typeof fetchGlobalMarketIntelligence === "function") {
        try {
          const res = await fetchGlobalMarketIntelligence();
          if (Array.isArray(res) && res.length > 0) {
            allNews = res;
          }
        } catch {
          // ignore
        }
      }
      if (allNews.length === 0 && typeof fetchForexNews === "function") {
        const res = await fetchForexNews();
        if (Array.isArray(res)) {
          allNews = res;
        }
      }

      newsHeadlines = filterForPair(allNews, symbol);
      if (newsHeadlines.length === 0 && allNews.length > 0) {
        newsHeadlines = allNews.slice(0, 5);
      }
    } catch {
      newsHeadlines = [];
    }

    // ── Check if there is new information over the 5-minute interval ──
    const priceMoved =
      typeof lastPrice === "number" &&
      lastPrice > 0 &&
      Math.abs(currentPrice - lastPrice) / lastPrice > 0.0004; // > ~4-5 pips move

    const currentSignalType = activeSignal?.type || "NONE";
    const signalChanged =
      lastSignalType !== null && currentSignalType !== lastSignalType;

    const currentTopHeadline = newsHeadlines[0]?.title || "";
    const hasNewHeadline =
      currentTopHeadline.length > 0 &&
      Array.isArray(lastHeadlines) &&
      lastHeadlines.length > 0 &&
      !lastHeadlines.includes(currentTopHeadline);

    const hasNewInformation =
      !is5MinCycle ||
      !lastCommentaryScript ||
      priceMoved ||
      signalChanged ||
      hasNewHeadline;

    // ── REPEAT LAST COMMENTARY IF NO NEW INFORMATION AFTER 5 MINUTES ──
    if (!hasNewInformation && lastCommentaryScript) {
      const cleanPreviousScript = lastCommentaryScript.replace(
        /^Market update for [^:]+:\s*Conditions remain steady[^:]+repeating our previous desk briefing:\s*/i,
        ""
      );
      const repeatedScript = `Market update for ${symbol}: Conditions remain steady over the past five minutes near ${currentPrice} with no new breaking catalysts across global Bloomberg wires or trading communities. Repeating our previous desk briefing: ${cleanPreviousScript}`;

      return NextResponse.json({
        success: true,
        symbol,
        commentaryScript: repeatedScript,
        technicalSummary: `No change • ${regime.trend || "Neutral"} trend • Holding @ ${currentPrice}`,
        fundamentalSummary: `No new macroeconomic catalysts detected in the last 5 minutes.`,
        communitySentiment: `Community order book & FinTwit sentiment remains stable for ${symbol}.`,
        activeSignal,
        headlines: newsHeadlines.slice(0, 4),
        isRepeated: true,
        hasNewInformation: false,
        timestamp: new Date().toISOString(),
      });
    }

    // ── GATHER FRESH GLOBAL INTELLIGENCE & COMMUNITY PERSPECTIVES ──
    const headlinesText = newsHeadlines
      .slice(0, 6)
      .map((h) => `- [${h.source || "Global Wire"}] ${h.title}`)
      .join("\n");

    const systemPrompt = `You are an elite institutional forex desk strategist and live global trading floor commentator for TradingLens AI.
You synthesize intelligence gathered from all across the world on ${symbol}:

1. FINANCIAL MEDIA & TERMINAL WIRES (Bloomberg, Reuters, Financial Times, central banks):
   - Central bank monetary policy divergence (Fed, ECB, BOE, BOJ rate expectations).
   - Macro drivers: Treasury yield curves, inflation prints, and global risk sentiment.
2. GLOBAL TRADING COMMUNITIES & SOCIAL SENTIMENT (FinTwit / X, TradingView top ideas, Reddit r/Forex):
   - What retail and prop trading communities are discussing on ${symbol}.
   - Positioning traps: overcrowded long/short sentiment, liquidity pools, and stop hunt zones.
3. TECHNICAL CONFLUENCE & ACTIONABLE TRADES:
   - Current price, EMA 9/21 cross, Bollinger Bands volatility squeeze/expansion, and RSI momentum.
   - Any active Buy/Sell signal with exact Entry, Stop Loss, and Take Profit targets (1:2.0 Risk/Reward).

TONE:
- Direct, authoritative, energetic, and spoken naturally like an experienced desk head talking directly over the trading floor microphone.
- Keep the script punchy, engaging, and under 125 words so it delivers crisp audio.
- DO NOT use markdown formatting (no asterisks, no bullet points, no hashes) because this is read aloud via speech audio.`;

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

Global Wire Headlines & Trading Community Feed:
${headlinesText || "Scanning global financial media and community channels."}

Deliver a live global technical, fundamental, and trading community briefing for ${symbol}.`;

    let commentaryScript = "";
    let technicalSummary = "";
    let fundamentalSummary = "";
    let communitySentiment = "";

    if (xaiClient.isAvailable()) {
      try {
        const fullResponse = await xaiClient.chatCompletion([
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ]);
        commentaryScript = fullResponse.trim();
      } catch (err) {
        console.error("Grok global commentary generation failed, using fallback:", err);
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
          ? `We have an active ${activeSignal.type} signal triggered at ${activeSignal.price}, with invalidation at ${activeSignal.stopLoss} and upside targets at ${activeSignal.takeProfit1}. Confluence is supported by ${activeSignal.confluence?.[0] || "EMA trend alignment"}.`
          : `The trend structure remains ${regime.trend?.toLowerCase() || "neutral"} with RSI reading at ${regime.rsiState || "midrange"} as we watch for an institutional liquidity sweep.`
      } Across Bloomberg wires and retail trading communities, market chatter is heavily focused on ${baseCurr} versus ${quoteCurr} central bank rate divergence. Keep risk controlled at one to two risk reward.`;
    }

    technicalSummary = activeSignal
      ? `${activeSignal.type} signal active @ ${activeSignal.price} (SL: ${activeSignal.stopLoss}, TP1: ${activeSignal.takeProfit1})`
      : `Trend ${regime.trend || "Neutral"} • RSI ${regime.rsiState || "Neutral"} • Volatility ${regime.volatilityState || "Normal"}`;

    fundamentalSummary =
      newsHeadlines[0]?.title ||
      `Central bank monetary policy and interest rate differentials guiding ${symbol} macro flow.`;

    communitySentiment =
      newsHeadlines.find((h) => h.source?.includes("Community"))?.title ||
      `Trading community positioning on FinTwit and TradingView indicates mixed bias for ${symbol}.`;

    return NextResponse.json({
      success: true,
      symbol,
      commentaryScript,
      technicalSummary,
      fundamentalSummary,
      communitySentiment,
      activeSignal,
      headlines: newsHeadlines.slice(0, 4),
      isRepeated: false,
      hasNewInformation: true,
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
