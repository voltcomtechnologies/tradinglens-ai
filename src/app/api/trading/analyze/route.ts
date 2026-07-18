import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  chatCompletion,
  buildTradingSystemPrompt,
  buildUserMessage,
  classifyAnalysisType,
} from "@/lib/llm";

/** Normalize any thrown value into a proper Error with message and stack */
function toError(e: unknown): Error {
  if (e instanceof Error) return e;
  return new Error(typeof e === "string" ? e : JSON.stringify(e));
}

function parseSignalTags(content: string): { signal: "buy" | "sell" | "hold"; confidence: number; cleanContent: string } {
  const signalMatch = content.match(/<SIGNAL>\s*(BUY|SELL|HOLD)\s*<\/SIGNAL>/i);
  const confidenceMatch = content.match(/<CONFIDENCE>\s*(\d{1,3})%?\s*<\/CONFIDENCE>/i);

  const signal: "buy" | "sell" | "hold" = signalMatch
    ? (signalMatch[1].toLowerCase() as "buy" | "sell" | "hold")
    : "hold";

  let confidence = confidenceMatch ? parseInt(confidenceMatch[1], 10) : 70;
  if (Number.isNaN(confidence)) confidence = 70;
  confidence = Math.max(0, Math.min(100, confidence));

  const cleanContent = content
    .replace(/<SIGNAL>[\s\S]*?<\/SIGNAL>\s*/gi, "")
    .replace(/<CONFIDENCE>[\s\S]*?<\/CONFIDENCE>\s*/gi, "")
    .trim();

  return { signal, confidence, cleanContent };
}

// Fallback mock responses used when the AI API is unavailable
const MOCK_RESPONSES: Record<string, (pair: string) => string> = {
  analyze: (pair) => `## Technical Analysis: ${pair}

**Service Status:** AI analysis is temporarily unavailable — showing demo content instead.

**Current Trend:** Bearish on the 1H timeframe with potential reversal at key support.

### Key Levels
- **Resistance:** 1.0875, 1.0920, 1.0950
- **Support:** 1.0800, 1.0765, 1.0730

### Technical Indicators
- **RSI (14):** 42.3 — Bearish momentum, approaching oversold
- **MACD:** Signal line below MACD line, bearish crossover
- **MA (50):** Price below 50 MA — bearish signal

### Trade Setup
- **Entry Zone:** 1.0810 - 1.0820 (on confirmation)
- **Stop Loss:** 1.0780 (below recent low)
- **Take Profit 1:** 1.0850 | **Take Profit 2:** 1.0890
- **Risk/Reward:** 1:2.3

> ⚠️ This is demo analysis. Configure OpenRouter for live AI analysis.

<SIGNAL>SELL</SIGNAL>
<CONFIDENCE>72</CONFIDENCE>`,
  sentiment: (pair) => `## Market Sentiment: ${pair}

**Service Status:** AI analysis is temporarily unavailable — showing demo content instead.

**Overall:** Bearish (62% of retail traders long)

### Fundamental Factors
- **USD:** Dollar strengthening on hawkish Fed comments
- **EUR:** Euro under pressure from weak manufacturing data

### Sentiment Score: **32/100** (Bearish)
- Technical: 35 | Fundamental: 28 | Positioning: 35

> ⚠️ This is demo analysis. Configure OpenRouter for live AI analysis.

<SIGNAL>HOLD</SIGNAL>
<CONFIDENCE>65</CONFIDENCE>`,
  levels: (pair) => `## Support & Resistance: ${pair}

**Service Status:** AI analysis is temporarily unavailable — showing demo content instead.

### Major Levels (Daily)
| Level | Type | Strength |
|-------|------|----------|
| 1.0950 | Resistance | Strong |
| 1.0875 | Pivot | Key |
| 1.0800 | Support | Strong |
| 1.0730 | Support | Major |

> ⚠️ This is demo analysis. Configure OpenRouter for live AI analysis.

<SIGNAL>HOLD</SIGNAL>
<CONFIDENCE>60</CONFIDENCE>`,
  opportunities: (pair) => `## Trade Opportunities

**Service Status:** AI analysis is temporarily unavailable — showing demo content instead.

### Setup #1: ${pair} Short
- **Entry:** Market or pullback to 1.0835
- **Stop:** 1.0865 | **Target:** 1.0770
- **RR:** 1:2.4 | **Confidence:** 7/10

### Setup #2: ${pair} Long
- **Entry:** 1.0800 (on support bounce)
- **Stop:** 1.0765 | **Target:** 1.0875
- **RR:** 1:2.5 | **Confidence:** 6/10

> ⚠️ This is demo analysis. Configure OpenRouter for live AI analysis.

<SIGNAL>SELL</SIGNAL>
<CONFIDENCE>68</CONFIDENCE>`,
};

export async function GET() {
  let session;
  try {
    session = await auth();
  } catch (authError) {
    const authErr = toError(authError);
    console.error("[analyze] Auth error:", authErr.message, authErr.stack);
    return NextResponse.json(
      { error: "Unauthorized", detail: authErr.message },
      { status: 401 }
    );
  }

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const analyses = await prisma.chartAnalysis.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        imageUrl: true,
        pair: true,
        timeframe: true,
        analysisType: true,
        aiResponse: true,
        signals: true,
        createdAt: true,
      },
    });

    const formatted = analyses.map((analysis) => {
      const signals = (analysis.signals as Record<string, unknown>) || {};
      const direction =
        typeof signals.direction === "string" ? signals.direction.toLowerCase() : "hold";
      const confidence =
        typeof signals.confidence === "number" ? signals.confidence : 70;

      return {
        id: analysis.id,
        imageUrl: analysis.imageUrl,
        pair: analysis.pair || "EURUSD",
        timeframe: analysis.timeframe || "1H",
        analysisType: analysis.analysisType,
        content: analysis.aiResponse,
        signal: ["buy", "sell", "hold"].includes(direction) ? direction : "hold",
        confidence,
        createdAt: analysis.createdAt.toISOString(),
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    const err = toError(error);
    console.error("[analyze] Failed to fetch history:", err.message);
    return NextResponse.json(
      { error: "Failed to fetch scan history" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  let session;
  try {
    session = await auth();
  } catch (authError) {
    const authErr = toError(authError);
    console.error("[analyze] Auth error:", authErr.message, authErr.stack);
    return NextResponse.json(
      { error: "Unauthorized", detail: authErr.message },
      { status: 401 }
    );
  }

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

    // Handle image upload (store as base64 data URL)
    if (imageFile) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const base64 = buffer.toString("base64");
      imageUrl = `data:${imageFile.type};base64,${base64}`;
    }

    const resolvedPair = pair || "EURUSD";
    const resolvedTimeframe = timeframe || "1H";
    const analysisType = classifyAnalysisType(prompt || "analyze");

    // Fetch user's preferred LLM provider (gracefully handle missing column/migration)
    let llmProvider: "openrouter" | "groq" | "auto" = "auto";
    try {
      const userProfile = await prisma.profile.findUnique({
        where: { userId: session.user.id },
        select: { llmProvider: true },
      });
      llmProvider = (userProfile?.llmProvider as "openrouter" | "groq" | "auto") || "auto";
    } catch (profileError) {
      const msg = toError(profileError).message;
      if (msg.includes("column") || msg.includes("llmProvider")) {
        console.warn("[analyze] llmProvider column not found, defaulting to auto:", msg);
      } else {
        throw profileError; // Re-throw real database errors — outer catch will log
      }
      llmProvider = "auto";
    }

    // Attempt AI analysis via preferred provider, fall back to mock on failure
    let responseContent: string;
    let aiUsed = false;
    let providerName: string | null = null;

    try {
      const systemPrompt = buildTradingSystemPrompt(
        analysisType,
        resolvedPair,
        resolvedTimeframe
      );

      const userMessage = buildUserMessage(
        prompt || `Provide a ${analysisType} analysis for ${resolvedPair} on the ${resolvedTimeframe} timeframe`,
        imageUrl
      );

      const { content, providerName: actualProviderName } = await chatCompletion(
        llmProvider,
        [
          { role: "system", content: systemPrompt },
          userMessage,
        ],
        { temperature: 0.7 }
      );
      responseContent = content;
      aiUsed = true;
      providerName = actualProviderName;
    } catch (aiError) {
      const aiErr = toError(aiError);
      console.error("[analyze] AI analysis failed, falling back to mock:", aiErr.message, aiErr.stack);
      const mockFn = MOCK_RESPONSES[analysisType] ?? MOCK_RESPONSES.analyze;
      responseContent = mockFn(resolvedPair);
      providerName = "Demo";
    }

    // Parse structured signal tags from the LLM response
    const { signal: parsedSignal, confidence: parsedConfidence, cleanContent } = parseSignalTags(responseContent);

    // Derive signals — use parsed values when available
    const signals = {
      pair: resolvedPair,
      direction: parsedSignal.toUpperCase(),
      confidence: parsedConfidence,
      timeframe: resolvedTimeframe,
    };

    // Save analysis to database
    const analysis = await prisma.chartAnalysis.create({
      data: {
        userId: session.user.id,
        imageUrl,
        pair: resolvedPair,
        timeframe: resolvedTimeframe,
        analysisType: "technical",
        userPrompt: prompt || "Chart analysis",
        aiResponse: cleanContent,
        signals,
      },
    });

    return NextResponse.json({
      id: analysis.id,
      content: cleanContent,
      imageUrl,
      aiUsed,
      providerName,
      pair: resolvedPair,
      timeframe: resolvedTimeframe,
      signal: parsedSignal,
      confidence: parsedConfidence,
    });
  } catch (error) {
    const err = toError(error);
    console.error("[analyze] Unhandled error:", err.message);
    console.error("[analyze] Stack trace:", err.stack);
    const isAdmin = session?.user?.role === "ADMIN";
    return NextResponse.json(
      {
        error: "Analysis failed",
        message: err.message,
        ...(isAdmin && { stack: err.stack }),
      },
      { status: 500 }
    );
  }
}
