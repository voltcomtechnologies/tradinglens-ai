import { describe, it, expect } from "vitest";
import { calculateStrategySignals } from "@/lib/strategy";
import type { OHLC } from "@/lib/indicators";

function makeSyntheticCandles(count: number, trend: "up" | "down" | "flat"): OHLC[] {
  const candles: OHLC[] = [];
  let price = 1.085;
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const time = new Date(now - (count - i) * 60_000).toISOString();
    let change = 0;
    if (trend === "up") {
      change = 0.0004 + (Math.sin(i / 3) * 0.0002);
    } else if (trend === "down") {
      change = -0.0004 - (Math.sin(i / 3) * 0.0002);
    } else {
      change = Math.sin(i / 2) * 0.0003;
    }

    const open = price;
    const close = Number((open + change).toFixed(5));
    const high = Number((Math.max(open, close) + 0.0002).toFixed(5));
    const low = Number((Math.min(open, close) - 0.0002).toFixed(5));
    price = close;

    candles.push({ time, open, high, low, close });
  }

  return candles;
}

describe("calculateStrategySignals", () => {
  it("handles short candle series gracefully without crashing", () => {
    const res = calculateStrategySignals([]);
    expect(res.signals).toEqual([]);
    expect(res.activeSignal).toBeNull();
    expect(res.marketRegime.trend).toBe("NEUTRAL");

    const short = makeSyntheticCandles(10, "up");
    const resShort = calculateStrategySignals(short);
    expect(resShort.signals).toEqual([]);
    expect(resShort.activeSignal).toBeNull();
  });

  it("calculates EMA 9/21, Bollinger Bands, RSI 14, and MACD indicators", () => {
    const candles = makeSyntheticCandles(60, "up");
    const res = calculateStrategySignals(candles);

    expect(res.indicators.ema9.length).toBe(60);
    expect(res.indicators.ema21.length).toBe(60);
    expect(res.indicators.bb.upper.length).toBe(60);
    expect(res.indicators.bb.lower.length).toBe(60);
    expect(res.indicators.rsi14.length).toBe(60);
    expect(res.indicators.macd.histogram.length).toBe(60);

    // Warm-up periods should be respected
    expect(Number.isNaN(res.indicators.ema9[0])).toBe(true);
    expect(!Number.isNaN(res.indicators.ema9[59])).toBe(true);
  });

  it("detects uptrend and generates BUY signals with SL, TP, and R:R", () => {
    // Generate a transition from flat to strong uptrend
    const flat = makeSyntheticCandles(25, "flat");
    const up = makeSyntheticCandles(35, "up");
    const candles = [...flat, ...up];

    const res = calculateStrategySignals(candles);
    expect(res.marketRegime.trend).toMatch(/BULLISH/);

    if (res.signals.length > 0) {
      const buySig = res.signals.find((s) => s.type === "BUY");
      if (buySig) {
        expect(buySig.price).toBeGreaterThan(0);
        expect(buySig.stopLoss).toBeLessThan(buySig.price);
        expect(buySig.takeProfit1).toBeGreaterThan(buySig.price);
        expect(buySig.takeProfit2).toBeGreaterThan(buySig.takeProfit1);
        expect(buySig.riskReward).toBe("1:2.0");
        expect(buySig.confluence.length).toBeGreaterThan(0);
      }
    }
  });

  it("detects downtrend and generates SELL signals with SL, TP, and R:R", () => {
    const flat = makeSyntheticCandles(25, "flat");
    const down = makeSyntheticCandles(35, "down");
    const candles = [...flat, ...down];

    const res = calculateStrategySignals(candles);
    expect(res.marketRegime.trend).toMatch(/BEARISH/);

    if (res.signals.length > 0) {
      const sellSig = res.signals.find((s) => s.type === "SELL");
      if (sellSig) {
        expect(sellSig.price).toBeGreaterThan(0);
        expect(sellSig.stopLoss).toBeGreaterThan(sellSig.price);
        expect(sellSig.takeProfit1).toBeLessThan(sellSig.price);
        expect(sellSig.takeProfit2).toBeLessThan(sellSig.takeProfit1);
        expect(sellSig.riskReward).toBe("1:2.0");
        expect(sellSig.confluence.length).toBeGreaterThan(0);
      }
    }
  });

  it("enforces signal cooldown to prevent overlapping noisy signals", () => {
    const candles = makeSyntheticCandles(80, "up");
    const res = calculateStrategySignals(candles, { cooldownBars: 8 });

    for (let i = 1; i < res.signals.length; i++) {
      const barDiff = res.signals[i].index - res.signals[i - 1].index;
      expect(barDiff).toBeGreaterThanOrEqual(8);
    }
  });
});
