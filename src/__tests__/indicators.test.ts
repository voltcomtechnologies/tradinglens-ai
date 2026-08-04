import { describe, expect, it } from "vitest";
import {
  atr,
  ema,
  macd,
  rsi,
  slope,
  sma,
  trueRange,
  type OHLC,
} from "@/lib/indicators";

describe("sma", () => {
  it("returns NaN during warm-up", () => {
    const out = sma([1, 2, 3], 3);
    expect(out.length).toBe(3);
    expect(Number.isNaN(out[0])).toBe(true);
    expect(Number.isNaN(out[1])).toBe(true);
    expect(out[2]).toBeCloseTo(2, 6);
  });

  it("computes a sliding mean over a known series", () => {
    const out = sma([1, 2, 3, 4, 5], 3);
    expect(out[2]).toBeCloseTo(2, 6);
    expect(out[3]).toBeCloseTo(3, 6);
    expect(out[4]).toBeCloseTo(4, 6);
  });

  it("throws on non-positive periods", () => {
    expect(() => sma([1, 2, 3], 0)).toThrow();
    expect(() => sma([1, 2, 3], -5)).toThrow();
  });
});

describe("ema", () => {
  it("seeds from SMA at index period-1", () => {
    const out = ema([1, 2, 3], 3);
    expect(out[2]).toBeCloseTo(2, 6);
  });

  it("propagates with k = 2 / (period + 1)", () => {
    // [10, 10, 10, 10, 20] with period 3 → seed=10 at i=2, then i=3=10,
    // i=4 = 20 * (2/4) + 10 * (2/4) = 15
    const out = ema([10, 10, 10, 10, 20], 3);
    expect(out[2]).toBeCloseTo(10, 6);
    expect(out[4]).toBeCloseTo(15, 6);
  });
});

describe("rsi", () => {
  it("clamps to 100 when all moves are gains", () => {
    const out = rsi(Array.from({ length: 20 }, (_, i) => 100 + i), 14);
    expect(out[14]).toBe(100);
    expect(out[19]).toBe(100);
  });

  it("returns 50 on a perfectly flat series (ta-lib / TradingView convention)", () => {
    const flat = Array(20).fill(1.10);
    const out = rsi(flat, 14);
    expect(out[14]).toBe(50);
    expect(out[19]).toBe(50);
  });

  it("returns 0 when all moves are losses", () => {
    const out = rsi(Array.from({ length: 20 }, (_, i) => 200 - i), 14);
    expect(out[14]).toBe(0);
    expect(out[19]).toBe(0);
  });

  it("returns NaN until enough bars for a delta window", () => {
    const out = rsi([1, 2, 3], 14);
    expect(out.length).toBe(3);
    out.forEach((v) => expect(Number.isNaN(v)).toBe(true));
  });

  it("produces a non-zero signal on a trending series", () => {
    // Strictly uptrending — RSI > 70 by construction.
    const up = Array.from({ length: 30 }, (_, i) => 100 + i * 2);
    const out = rsi(up, 14);
    for (let i = 14; i < out.length; i++) {
      expect(out[i]).toBeGreaterThan(70);
    }
  });
});

describe("macd", () => {
  it("produces a valid histogram on a long enough series", () => {
    const closes = Array.from({ length: 60 }, (_, i) => 100 + Math.sin(i / 3) * 5 + i * 0.1);
    const { macd: line, signal, histogram } = macd(closes, 12, 26, 9);
    expect(line.length).toBe(closes.length);
    expect(signal.length).toBe(closes.length);
    expect(histogram.length).toBe(closes.length);

    // After warm-up (slow EMA warms up at index 25, signal EMA at +8 = 33),
    // the histogram should have well-defined numeric values.
    for (let i = 34; i < closes.length; i++) {
      expect(Number.isFinite(histogram[i])).toBe(true);
      expect(histogram[i]).toBeCloseTo(line[i] - signal[i], 6);
    }
  });

  it("is NaN-padded at the front", () => {
    const { macd: line, signal, histogram } = macd([1, 2, 3, 4, 5], 12, 26, 9);
    expect(Number.isNaN(line[0])).toBe(true);
    expect(Number.isNaN(signal[0])).toBe(true);
    expect(Number.isNaN(histogram[0])).toBe(true);
  });
});

describe("trueRange + atr", () => {
  const candle = (o: number, h: number, l: number, c: number): OHLC => ({
    time: "t", open: o, high: h, low: l, close: c,
  });

  it("first bar's TR is high-low (no prev close)", () => {
    const candles = [candle(10, 12, 9, 11)];
    expect(trueRange(candles)[0]).toBe(3);
  });

  it("uses prev close for subsequent bars", () => {
    const candles = [
      candle(10, 12, 9, 11),
      // prev close=11. high-low=1, |high-prevClose|=|11.5-11|=0.5, |low-prevClose|=|10.4-11|=0.6
      candle(11, 11.5, 10.4, 11.2),
    ];
    expect(trueRange(candles)[1]).toBeCloseTo(1.1, 6);
  });

  it("atr is NaN until enough bars", () => {
    const candles = [candle(10, 12, 9, 11)];
    const out = atr(candles, 14);
    expect(out.length).toBe(1);
    expect(Number.isNaN(out[0])).toBe(true);
  });
});

describe("slope", () => {
  it("is positive on a rising series", () => {
    expect(slope([1, 2, 3, 4, 5], 4)).toBeGreaterThan(0);
  });

  it("is negative on a falling series", () => {
    expect(slope([5, 4, 3, 2, 1], 4)).toBeLessThan(0);
  });

  it("is zero on a flat series", () => {
    expect(slope([3, 3, 3, 3, 3], 4)).toBe(0);
  });

  it("ignores NaN warm-up bars", () => {
    const series = [NaN, NaN, 1, 2, 3, 4, 5];
    expect(slope(series, 4)).toBeGreaterThan(0);
  });
});
