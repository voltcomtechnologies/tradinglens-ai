import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const prompt = formData.get("prompt") as string | null;
    const pair = formData.get("pair") as string | null;
    const timeframe = formData.get("timeframe") as string | null;
    const imageFile = formData.get("image") as File | null;

    if (!prompt && !imageFile) {
      return NextResponse.json(
        { error: "Prompt or image required" },
        { status: 400 }
      );
    }

    let imageUrl: string | null = null;

    // Handle image upload (store as base64 data URL for demo)
    if (imageFile) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const base64 = buffer.toString("base64");
      imageUrl = `data:${imageFile.type};base64,${base64}`;
    }

    // Simulate AI analysis — in production, call OpenAI/Claude API
    const mockResponses: Record<string, string> = {
      analyze: `## 📊 Technical Analysis: ${pair || "EURUSD"}

**Current Trend:** Bearish on the 1H timeframe with potential reversal at key support.

### Key Levels
- **Resistance:** 1.0875, 1.0920, 1.0950
- **Support:** 1.0800, 1.0765, 1.0730

### Technical Indicators
- **RSI (14):** 42.3 — Bearish momentum, approaching oversold
- **MACD:** Signal line below MACD line, bearish crossover
- **MA (50):** Price below 50 MA — bearish signal
- **Bollinger Bands:** Price touching lower band — potential bounce

### Pattern Recognition
- **Flag pattern** forming on the 15min chart
- **Engulfing candle** at support level — watch for confirmation

### Trade Setup
- **Entry Zone:** 1.0810 - 1.0820 (on confirmation)
- **Stop Loss:** 1.0780 (below recent low)
- **Take Profit 1:** 1.0850 (first resistance)
- **Take Profit 2:** 1.0890 (major resistance)
- **Risk/Reward:** 1:2.3

> ⚠️ This is an AI-generated analysis. Always do your own research before trading.`,
      sentiment: `## 🌍 Market Sentiment: ${pair || "EURUSD"}

**Overall:** Bearish (62% of retail traders long)

### Fundamental Factors
- **USD:** Dollar strengthening on hawkish Fed comments
- **EUR:** Euro under pressure from weak manufacturing data
- **Geopolitical:** Trade tensions creating uncertainty

### Institutional Positioning
- **Commercial hedgers:** Net short
- **Large speculators:** Net long, decreasing
- **Retail:** 62% long, 38% short (contrarian signal: bearish)

### Key Events This Week
| Date | Event | Impact |
|------|-------|--------|
| Mon | Manufacturing PMI | Medium |
| Wed | FOMC Minutes | High |
| Fri | Non-Farm Payrolls | High |

### Sentiment Score: **32/100** (Bearish)
- Technical: 35
- Fundamental: 28
- Positioning: 35`,
      levels: `## 🎯 Support & Resistance: ${pair || "EURUSD"}

### Major Levels (Daily)
| Level | Type | Strength |
|-------|------|----------|
| 1.0950 | Resistance | Strong |
| 1.0920 | Resistance | Medium |
| 1.0875 | Pivot | Key |
| 1.0800 | Support | Strong |
| 1.0765 | Support | Major |
| 1.0730 | Support | Strong |

### Order Block Analysis
- **Bullish OB:** 1.0780 - 1.0800 (unmitigated)
- **Bearish OB:** 1.0880 - 1.0900 (partially mitigated)

### Liquidity Zones
- **Above:** 1.0920 (buy stops)
- **Below:** 1.0770 (sell stops)

### Smart Money Concepts
- **Displacement:** Bearish move from 1.0920
- **MSS (Market Structure Shift):** Confirmed on 4H
- **FVG (Fair Value Gap):** 1.0840 - 1.0855`,
      opportunities: `## 🎯 Trade Opportunities

### Setup #1: EURUSD Short
- **Signal:** Bearish flag breakout
- **Entry:** Market or pullback to 1.0835
- **Stop:** 1.0865
- **Target:** 1.0770
- **RR:** 1:2.4
- **Confidence:** 7/10
- **Timeframe:** 4H

### Setup #2: GBPUSD Long
- **Signal:** Double bottom at support
- **Entry:** 1.2650 (break of neckline)
- **Stop:** 1.2610
- **Target:** 1.2740
- **RR:** 1:2.25
- **Confidence:** 6/10
- **Timeframe:** 1H

### Setup #3: XAUUSD
- **Signal:** Trend line bounce
- **Entry:** 2,350
- **Stop:** 2,335
- **Target:** 2,380
- **RR:** 1:2
- **Confidence:** 8/10
- **Timeframe:** Daily`,
    };

    // Determine response type based on prompt
    let responseContent: string;
    const lowerPrompt = (prompt || "").toLowerCase();
    if (lowerPrompt.includes("sentiment") || lowerPrompt.includes("market feel")) {
      responseContent = mockResponses.sentiment;
    } else if (lowerPrompt.includes("support") || lowerPrompt.includes("resistance") || lowerPrompt.includes("level")) {
      responseContent = mockResponses.levels;
    } else if (lowerPrompt.includes("opportunity") || lowerPrompt.includes("trade") || lowerPrompt.includes("setup")) {
      responseContent = mockResponses.opportunities;
    } else {
      responseContent = mockResponses.analyze;
    }

    // Save analysis to database
    const analysis = await prisma.chartAnalysis.create({
      data: {
        userId: session.user.id,
        imageUrl,
        pair: pair || "EURUSD",
        timeframe: timeframe || "1H",
        analysisType: "technical",
        userPrompt: prompt || "Chart analysis",
        aiResponse: responseContent,
        signals: {
          pair: pair || "EURUSD",
          direction: "SELL",
          confidence: 7,
          timeframe: timeframe || "1H",
        },
      },
    });

    return NextResponse.json({
      id: analysis.id,
      content: responseContent,
      imageUrl,
    });
  } catch (error) {
    console.error("Analysis failed:", error);
    return NextResponse.json(
      { error: "Analysis failed" },
      { status: 500 }
    );
  }
}
