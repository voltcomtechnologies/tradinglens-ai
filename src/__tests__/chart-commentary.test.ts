import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/rss/forex-news", () => ({
  fetchForexNews: vi.fn().mockResolvedValue([
    {
      title: "EUR/USD advances as ECB remains hawkish while Fed considers rate cuts",
      link: "https://example.com/eurusd",
      pubDate: "2026-09-24T12:00:00Z",
    },
  ]),
  filterForPair: vi.fn().mockImplementation((items) => items),
}));

vi.mock("@/lib/llm/xai", () => ({
  xaiClient: {
    isAvailable: vi.fn().mockReturnValue(true),
    chatCompletion: vi.fn().mockResolvedValue(
      "EUR/USD is testing key resistance around 1.0865, showing strong momentum with EMA 9 above 21. Our active buy signal has a confirmed target at 1.0900. Fundamentally, divergent policy between the ECB and Federal Reserve continues to bolster euro strength into the London close."
    ),
  },
}));

import { POST } from "@/app/api/trading/chart-commentary/route";

describe("/api/trading/chart-commentary route", () => {
  it("generates structured commentary and fundamental summary for a pair", async () => {
    const req = new Request("http://localhost:3000/api/trading/chart-commentary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symbol: "EURUSD",
        currentPrice: 1.0865,
        priceChange: 0.35,
        timeframe: "1H",
        regime: {
          trend: "STRONG_BULLISH",
          rsiState: "Bullish Momentum (58.2)",
          volatilityState: "NORMAL",
        },
        activeSignal: {
          type: "BUY",
          price: 1.0855,
          stopLoss: 1.0825,
          takeProfit1: 1.0900,
          takeProfit2: 1.0930,
          riskReward: "1:2.0",
          confluence: ["EMA 9/21 Golden Cross", "Bollinger Support Bounce"],
        },
        signalsCount: 3,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.symbol).toBe("EURUSD");
    expect(typeof data.commentaryScript).toBe("string");
    expect(data.commentaryScript).toContain("EUR/USD is testing key resistance");
    expect(data.technicalSummary).toContain("BUY signal active");
    expect(data.headlines.length).toBeGreaterThan(0);
  });
});
