import { describe, expect, it } from "vitest";
import {
  INSIGHT_MIN_BARS,
  summarizeMaCross,
  summarizePriceAction,
  summarizeRsiMacd,
  type OHLC,
} from "@/lib/insights";

// ── Helpers ────────────────────────────────────────────────────────────────

function makeCandles(closes: number[], startTime = "2024-01-01T00:00:00Z"): OHLC[] {
  let t = new Date(startTime).getTime();
  return closes.map((c, i) => {
    const open = i > 0 ? closes[i - 1] : c;
    const high = Math.max(open, c) + 0.001;
    const low = Math.min(open, c) - 0.001;
    t += 5 * 60_000;
    return {
      time: new Date(t).toISOString(),
      open: round5(open),
      high: round5(high),
      low: round5(low),
      close: round5(c),
    };
  });
}

function round5(n: number): number {
  return Number(n.toFixed(5));
}

// ── Loading-state contract ──────────────────────────────────────────────────

describe("warming-up contract", () => {
  it("returns ready=false cards when bars < INSIGHT_MIN_BARS (price-action)", () => {
    const short = makeCandles([1, 1.001, 1.002, 1.003]); // 4 bars
    const card = summarizePriceAction(short);
    expect(card.ready).toBe(false);
    expect(card.tagline).toBe("Warming up");
  });

  it("returns ready=false cards for MA-cross when bars < INSIGHT_MIN_BARS", () => {
    // 30 bars total — under INSIGHT_MIN_BARS (35), regardless of the
    // slow-period fallback path. The early-return guard wins.
    const card = summarizeMaCross(makeCandles(Array(30).fill(1.0)));
    expect(card.ready).toBe(false);
    expect(card.id).toBe("ma-cross");
  });

  it("returns ready=false cards for RSI/MACD when bars < INSIGHT_MIN_BARS", () => {
    const card = summarizeRsiMacd(makeCandles(Array(20).fill(1.0)));
    expect(card.ready).toBe(false);
    expect(card.id).toBe("rsi-macd");
  });

  it("makes the contract visible: the constant matches the smallest accepted length", () => {
    expect(INSIGHT_MIN_BARS).toBeGreaterThanOrEqual(30);
  });
});

// ── Price action sentiment ──────────────────────────────────────────────────

describe("summarizePriceAction", () => {
  it("is bullish on a monotonic uptrend over the window", () => {
    const closes = Array.from({ length: 40 }, (_, i) => 1.00 + i * 0.001);  // +0.04% over last 20
    const card = summarizePriceAction(makeCandles(closes));
    expect(card.ready).toBe(true);
    expect(card.sentiment).toBe("bullish");
    expect(["Bullish", "Volatile"]).toContain(card.tagline);
  });

  it("is bearish on a monotonic downtrend over the window", () => {
    const closes = Array.from({ length: 40 }, (_, i) => 1.04 - i * 0.001);
    const card = summarizePriceAction(makeCandles(closes));
    expect(card.ready).toBe(true);
    expect(card.sentiment).toBe("bearish");
  });

  it("is neutral when price is flat over the window", () => {
    const closes = Array.from({ length: 40 }, () => 1.10 + (Math.random() - 0.5) * 0.0001);
    const card = summarizePriceAction(makeCandles(closes));
    expect(card.ready).toBe(true);
    expect(card.sentiment).toBe("neutral");
  });
});

// ── MA cross ────────────────────────────────────────────────────────────────

describe("summarizeMaCross", () => {
  it("flags golden bias when fast SMA sits above slow SMA on an uptrend", () => {
    const closes = Array.from({ length: 80 }, (_, i) => 1.0 + i * 0.002);  // +0.16% overall → fast above slow
    const card = summarizeMaCross(makeCandles(closes));
    expect(card.ready).toBe(true);
    expect(card.sentiment).toBe("bullish");
    expect(card.tagline).toBe("Golden bias");
  });

  it("flags death bias when fast SMA sits below slow SMA on a downtrend", () => {
    const closes = Array.from({ length: 80 }, (_, i) => 1.2 - i * 0.002);
    const card = summarizeMaCross(makeCandles(closes));
    expect(card.ready).toBe(true);
    expect(card.sentiment).toBe("bearish");
    expect(card.tagline).toBe("Death bias");
  });

  it("labels the card 'Insufficient history' when the slow window can't fit", () => {
    // 35 bars total \u2014 above INSIGHT_MIN_BARS but below slow=50.
    // The description surfaces the slope-only fallback (so the
    // information isn't lost) but the chip must NOT read as a
    // directional signal because the underlying window can't support it.
    const closes = Array.from({ length: 35 }, (_, i) => 1.0 + i * 0.003);
    const card = summarizeMaCross(makeCandles(closes));
    expect(card.ready).toBe(false);
    expect(card.tagline).toBe("Insufficient history");
    expect(card.sentiment).toBe("neutral");
    // Slope information leaked through the description body so the
    // user can still see the direction without acting on the chip.
    // The "bars needed" framing makes honest that this is preliminary.
    expect(card.description).toMatch(/Pending: SMA\(20\) interim is rising/);
    expect(card.description).toMatch(/Need ~15 more bars/);
  });
});

// ── RSI / MACD ──────────────────────────────────────────────────────────────

describe("summarizeRsiMacd", () => {
  it("flags overbought → bearish override on a runaway uptrend", () => {
    // Steady gains across >35 bars → RSI saturates above 70.
    const closes = Array.from({ length: 60 }, (_, i) => 1.0 + i * 0.005);
    const card = summarizeRsiMacd(makeCandles(closes));
    expect(card.ready).toBe(true);
    expect(card.tagline).toBe("Overbought");
    // Overbought RSI flips the overall sentiment to bearish
    // (mean-reversion read).
    expect(card.sentiment).toBe("bearish");
  });

  it("flags oversold → bullish override on a runaway downtrend", () => {
    const closes = Array.from({ length: 60 }, (_, i) => 1.5 - i * 0.005);
    const card = summarizeRsiMacd(makeCandles(closes));
    expect(card.ready).toBe(true);
    expect(card.tagline).toBe("Oversold");
    expect(card.sentiment).toBe("bullish");
  });

  it("treats a flat series as neutral, not overbought", () => {
    const closes = Array(50).fill(1.10);
    const card = summarizeRsiMacd(makeCandles(closes));
    expect(card.ready).toBe(true);
    // RSI degenerate path returns 50 (no movement → centerline).
    // MACD histogram is 0 → "Flat" tagline. Overall sentiment
    // stays neutral so a perfectly calm series is never mislabelled
    // "Overbought".
    expect(card.sentiment).toBe("neutral");
    expect(card.tagline).toBe("Flat");
  });
});
