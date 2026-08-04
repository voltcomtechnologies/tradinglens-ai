/**
 * Pure technical-analysis primitives. Framework-agnostic — no React, no DOM.
 *
 * Every series-returning function returns an array the SAME LENGTH as its
 * input, padded with `NaN` for warm-up bars. This keeps indices aligned
 * with the caller-supplied candle array (so e.g. `rsi[i]` corresponds to
 * `candleData[i].close`) and lets `useMemo` callers iterate without
 * bounds-checking each bar.
 *
 * Conventions:
 *   - Standard SMA is the arithmetic mean of the last `period` values.
 *   - EMA uses the canonical `k = 2 / (period + 1)` seeding from SMA.
 *   - RSI is Wilder's smoothed version (`avgGain/avgLoss` seeded from a
 *     simple mean over the first `period` bars, then exponentially
 *     smoothed).
 *   - MACD fast/slow/signal defaults are 12 / 26 / 9 — the industry
 *     standard that every charting tool ships with.
 *   - ATR is Wilder-smoothed true range.
 *
 * NaN is preferred over 0 for warm-up so callers can distinguish
 * "no signal yet" from "the value literally is zero".
 */

export type OHLC = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
};

/** Padded copy: output is the same length as `values`, warm-up positions set to NaN. */
function padOutput(values: number[], period: number): number[] {
  const out = new Array<number>(values.length).fill(NaN);
  for (let i = period - 1; i < values.length; i++) out[i] = values[i];
  return out;
}

/**
 * Simple moving average. SMA[i] is defined for i >= period-1, NaN before.
 */
export function sma(values: readonly number[], period: number): number[] {
  if (period <= 0) throw new Error("sma: period must be > 0");
  if (values.length < period) return new Array(values.length).fill(NaN);
  const out = new Array<number>(values.length).fill(NaN);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

/**
 * Exponential moving average. Seeded from SMA(period) on bar `period-1`,
 * then propagated with `out[i] = values[i] * k + out[i-1] * (1-k)` where
 * `k = 2 / (period + 1)`.
 */
export function ema(values: readonly number[], period: number): number[] {
  if (period <= 0) throw new Error("ema: period must be > 0");
  if (values.length < period) return new Array(values.length).fill(NaN);
  const k = 2 / (period + 1);
  const out = new Array<number>(values.length).fill(NaN);
  // Seed with SMA of the first `period` values.
  let seed = 0;
  for (let i = 0; i < period; i++) seed += values[i];
  out[period - 1] = seed / period;
  for (let i = period; i < values.length; i++) {
    out[i] = values[i] * k + out[i - 1] * (1 - k);
  }
  return out;
}

/**
 * Wilder RSI on `closes` with default period 14. Output scales 0..100.
 * First valid RSI is at index `period` (Wilder requires period deltas
 * to seed avgGain/avgLoss plus one bar of propagation).
 */
export function rsi(closes: readonly number[], period = 14): number[] {
  if (period <= 0) throw new Error("rsi: period must be > 0");
  const n = closes.length;
  const out = new Array<number>(n).fill(NaN);
  if (n <= period) return out;

  // First deltas.
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const delta = closes[i] - closes[i - 1];
    if (delta >= 0) avgGain += delta;
    else avgLoss += -delta;
  }
  avgGain /= period;
  avgLoss /= period;
  // Degenerate cases follow ta-lib / TradingView convention:
  //   - no movement at all (every delta = 0)  -> 50 (true neutral)
  //   - all gains (avgLoss === 0)              -> 100
  //   - all losses (avgGain === 0)             -> 0
  //   - mixed                                  -> 100 - 100 / (1 + RS)
  out[period] = avgGain === 0 && avgLoss === 0
    ? 50
    : avgLoss === 0
    ? 100
    : avgGain === 0
    ? 0
    : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < n; i++) {
    const delta = closes[i] - closes[i - 1];
    const gain = delta > 0 ? delta : 0;
    const loss = delta < 0 ? -delta : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    out[i] = avgGain === 0 && avgLoss === 0
      ? 50
      : avgLoss === 0
      ? 100
      : avgGain === 0
      ? 0
      : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return out;
}

/**
 * MACD = EMA(fast) - EMA(slow); signal = EMA(MACD, signalPeriod).
 *   - macd[i]:    the raw MACD line.
 *   - signal[i]:  the 9-bar EMA of MACD.
 *   - histogram[i]: macd - signal (the "bars" traders talk about).
 *
 * Returns three arrays the same length as `closes`, NaN-padded where any
 * of the underlying EMAs is still warming up.
 */
export function macd(
  closes: readonly number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9,
): { macd: number[]; signal: number[]; histogram: number[] } {
  const emaFast = ema(closes, fastPeriod);
  const emaSlow = ema(closes, slowPeriod);
  const n = closes.length;
  const macdLine = new Array<number>(n).fill(NaN);
  for (let i = 0; i < n; i++) {
    if (!Number.isNaN(emaFast[i]) && !Number.isNaN(emaSlow[i])) {
      macdLine[i] = emaFast[i] - emaSlow[i];
    }
  }
  // Signal line is an EMA over the macdLine series, but we have to skip
  // the NaN warm-up at the front so the EMA seed isn't poisoned.
  const validStart = macdLine.findIndex((v) => !Number.isNaN(v));
  const signalLine = new Array<number>(n).fill(NaN);
  const histogram = new Array<number>(n).fill(NaN);
  if (validStart >= 0 && n - validStart >= signalPeriod) {
    const seed = new Array<number>(signalPeriod);
    for (let i = 0; i < signalPeriod; i++) seed[i] = macdLine[validStart + i];
    const seedAvg = seed.reduce((s, v) => s + v, 0) / signalPeriod;
    signalLine[validStart + signalPeriod - 1] = seedAvg;
    const k = 2 / (signalPeriod + 1);
    for (let i = validStart + signalPeriod; i < n; i++) {
      signalLine[i] = macdLine[i] * k + signalLine[i - 1] * (1 - k);
    }
    for (let i = validStart + signalPeriod - 1; i < n; i++) {
      if (!Number.isNaN(signalLine[i])) {
        histogram[i] = macdLine[i] - signalLine[i];
      }
    }
  }
  return { macd: macdLine, signal: signalLine, histogram };
}

/** Per-bar true range: max( high-low, |high-prevClose|, |low-prevClose| ). */
export function trueRange(candles: readonly OHLC[]): number[] {
  const n = candles.length;
  const out = new Array<number>(n).fill(NaN);
  if (n === 0) return out;
  out[0] = candles[0].high - candles[0].low;
  for (let i = 1; i < n; i++) {
    const c = candles[i];
    const prevClose = candles[i - 1].close;
    out[i] = Math.max(
      c.high - c.low,
      Math.abs(c.high - prevClose),
      Math.abs(c.low - prevClose),
    );
  }
  return out;
}

/**
 * Average true range (Wilder smoothing). Requires at least `period` bars.
 * Output[period - 1] is the SMA of true-range for indices 0..period-1;
 * subsequent bars use the Wilder recursive formula.
 */
export function atr(candles: readonly OHLC[], period = 14): number[] {
  if (period <= 0) throw new Error("atr: period must be > 0");
  const tr = trueRange(candles);
  const n = tr.length;
  const out = new Array<number>(n).fill(NaN);
  if (n < period) return out;
  let seed = 0;
  for (let i = 0; i < period; i++) seed += tr[i];
  out[period - 1] = seed / period;
  for (let i = period; i < n; i++) {
    out[i] = (out[i - 1] * (period - 1) + tr[i]) / period;
  }
  return out;
}

/**
 * Slope of the last `lookback` bars of `series`, expressed in the
 * series' native units per bar (signed). Used by the MA-cross insight
 * to determine whether fast/slow averages are rising, flat, or falling.
 *
 * Skips NaN values at the front so the slope is over real points only.
 */
export function slope(series: readonly number[], lookback = 5): number {
  let last = NaN;
  let prev = NaN;
  let count = 0;
  for (let i = series.length - 1; i >= 0 && count < lookback + 1; i--) {
    if (Number.isNaN(series[i])) continue;
    if (Number.isNaN(last)) {
      last = series[i];
    } else if (Number.isNaN(prev)) {
      prev = series[i];
      break;
    }
    count++;
  }
  if (Number.isNaN(last) || Number.isNaN(prev)) return 0;
  return last - prev;
}
