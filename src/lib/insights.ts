/**
 * Chart Lens insight summaries — pure, deterministic, framework-agnostic.
 *
 * Each summarizer returns an `InsightCard` so the dashboard always renders
 * three cards in the same layout. When there isn't enough history, the
 * card is returned with `ready: false` and a soft "loading more data…"
 * blurb; the caller decides whether to dim the card, show a skeleton,
 * or just render the muted copy. We deliberately don't return `null` —
 * the Chart Lens layout must remain visually stable while data streams in.
 */

import {
  type OHLC,
  atr,
  ema,
  macd,
  rsi,
  slope,
  sma,
} from "./indicators";

// Canonical re-export so dashboard callers only import from
// `@/lib/insights`. We import + re-export (rather than using
// `export { ... } from`) because the values are also used locally
// inside this module's summarizers — `export ... from` does NOT
// bind the names into the local scope.
export type { OHLC } from "./indicators";
export { atr, ema, macd, rsi, slope, sma };

export type Sentiment = "bullish" | "bearish" | "neutral";

export type InsightCard = {
  /** Stable identifier so React can key the rendered card. */
  id: "price-action" | "ma-cross" | "rsi-macd";
  title: string;
  description: string;
  /** Short uppercase chip (e.g. "Bullish", "Overbought", "Loading…"). */
  tagline: string;
  sentiment: Sentiment;
  /** True once the underlying indicator has enough warm-up bars to give a stable read. */
  ready: boolean;
};

/**
 * Minimum bars the slowest indicator (MACD signal line, period 9 over
 * the slow EMA which itself warms up at index slow - 1 = 25) needs before
 * any of the three summaries is "ready". We round up to 35 to leave a
 * comfortable margin.
 */
export const INSIGHT_MIN_BARS = 35;

const LOADING_CARD: InsightCard = {
  id: "price-action",
  title: "Price Action",
  description: "Loading more data…",
  tagline: "Warming up",
  sentiment: "neutral",
  ready: false,
};

/**
 * Bucket for one-bar change (close vs SMA(window)).
 *   - >  +0.05 %  → bullish
 *   - <  -0.05 %  → bearish
 *   - else        → neutral
 *
 *   ±0.05 % is chosen because spreads on majors are tighter than that,
 *   so anything below it is noise.
 */
function classifyPct(pct: number): Sentiment {
  if (pct > 0.05) return "bullish";
  if (pct < -0.05) return "bearish";
  return "neutral";
}

/**
 * Card 1 — Price action over the last `window` bars.
 *
 * Metrics surfaced:
 *   - Window change (close vs close `window` bars ago) in percent.
 *   - Volatility bucket from ATR(14) / close (basis points).
 *   - Proximity (pct) to the high / low of the window — to communicate
 *     whether price is hugging a boundary.
 */
export function summarizePriceAction(
  candles: readonly OHLC[],
  window = 20,
): InsightCard {
  if (candles.length < window + 1) {
    return { ...LOADING_CARD, id: "price-action", title: "Price Action" };
  }

  const closes = candles.map((c) => c.close);
  const last = closes[closes.length - 1];
  const refClose = closes[closes.length - 1 - window];
  const changePct = ((last - refClose) / refClose) * 100;

  const atrSeries = atr(candles, 14);
  const atrNow = atrSeries[atrSeries.length - 1];
  const volatilityBps = Number.isFinite(last) && last !== 0
    ? (atrNow / last) * 10_000
    : NaN;

  let volatilityTag: "Tight" | "Normal" | "Wide" = "Normal";
  if (volatilityBps < 30) volatilityTag = "Tight";
  else if (volatilityBps > 90) volatilityTag = "Wide";

  const sliced = candles.slice(-window);
  const high = sliced.reduce((m, c) => Math.max(m, c.high), -Infinity);
  const low = sliced.reduce((m, c) => Math.min(m, c.low), Infinity);
  const rangePos = high === low ? 0.5 : (last - low) / (high - low);

  const sentiment = classifyPct(changePct);

  const direction =
    sentiment === "bullish" ? "trended up"
    : sentiment === "bearish" ? "trended down"
    : "moved sideways";

  const formattedPct = `${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%`;
  const headline =
    `${direction} ${formattedPct} over the last ${window} bars. ` +
    `Volatility is ${volatilityTag.toLowerCase()} (ATR ≈ ${volatilityBps.toFixed(0)} bps). `;

  const position =
    rangePos > 0.8 ? "Price is hugging the upper end of the recent range — watch for rejection."
    : rangePos < 0.2 ? "Price is sitting near the lower end of the recent range — possible support test."
    : "Price is mid-range; no extreme stretched positioning.";

  return {
    id: "price-action",
    title: "Price Action",
    description: headline + position,
    tagline: sentiment === "bullish" ? "Bullish"
      : sentiment === "bearish" ? "Bearish"
      : volatilityTag === "Wide" ? "Volatile"
      : "Neutral",
    sentiment,
    ready: true,
  };
}

/**
 * Card 2 — SMA fast/slow cross state (default 20 / 50).
 *
 * Metrics surfaced:
 *   - Whether fast SMA is above slow SMA right now (bullish cross state).
 *   - Distance of price to fast SMA in percent.
 *   - Slope of the fast SMA over its last 5 bars — tells us whether
 *     the cross just happened or trend is established.
 *
 * If the dataset is shorter than `slow`, we fall back to SMA(20) / SMA(20)
 * slope comparison (effectively a slope-only read) so the card still says
 * something useful.
 */
export function summarizeMaCross(
  candles: readonly OHLC[],
  fast = 20,
  slow = 50,
): InsightCard {
  const closes = candles.map((c) => c.close);

  if (closes.length < INSIGHT_MIN_BARS) {
    return { ...LOADING_CARD, id: "ma-cross", title: "MA Cross" };
  }

  const fastLine = sma(closes, fast);
  const slowLine = closes.length >= slow ? sma(closes, slow) : null;

  const lastIdx = closes.length - 1;
  const fastNow = fastLine[lastIdx];
  const closeNow = closes[lastIdx];
  const fastSlope = slope(fastLine, 5);

  const distancePct = fastNow !== 0
    ? ((closeNow - fastNow) / fastNow) * 100
    : 0;

  let sentiment: Sentiment;
  let tagline: string;
  let headline: string;

  if (slowLine) {
    const slowNow = slowLine[lastIdx];
    const fastAboveSlow = fastNow > slowNow;
    const slowSlope = slope(slowLine, 5);
    sentiment =
      fastAboveSlow && fastSlope > 0 ? "bullish"
      : !fastAboveSlow && fastSlope < 0 ? "bearish"
      : "neutral";
    tagline = fastAboveSlow ? "Golden bias" : "Death bias";
    const slowTag = slowSlope > 0 ? "rising"
      : slowSlope < 0 ? "falling"
      : "flat";
    const fastTag = fastSlope > 0 ? "rising"
      : fastSlope < 0 ? "falling"
      : "flat";
    headline =
      `SMA(${fast}) is ${fastAboveSlow ? "above" : "below"} SMA(${slow}) — ` +
      `${fastTag} vs ${slowTag}. ` +
      `Price is ${Math.abs(distancePct).toFixed(2)}% ${distancePct >= 0 ? "above" : "below"} the fast average.`;
  } else {
    // Slow SMA can't fit yet. Label the card `ready: false` and pin
    // the chip to "Insufficient history" so users don't act on a
    // directional signal that the underlying window can't support.
    // The description body leaks a *preliminary* partial read (slope
    // + price distance vs fast MA) so the underlying direction is
    // still observable for educational value — but the phrasing is
    // deliberately framed as preliminary, not actionable.
    sentiment = "neutral";
    tagline = "Insufficient history";
    const slopeTag = fastSlope > 0 ? "rising"
      : fastSlope < 0 ? "falling"
      : "flat";
    const barsNeeded = Math.max(0, slow - closes.length);
    headline =
      `Need ~${barsNeeded} more bar${barsNeeded === 1 ? "" : "s"} for the ` +
      `SMA(${slow}) cross. Pending: SMA(${fast}) interim is ${slopeTag}, ` +
      `price ${distancePct >= 0 ? "+" : ""}${distancePct.toFixed(2)}% vs it.`;
  }

  return {
    id: "ma-cross",
    title: "MA Cross",
    description: headline,
    tagline,
    sentiment,
    // Ready=false when the slow window doesn't fit so the page can
    // dim the card; gradient/RSI/price-action cards remain green-lit.
    ready: slowLine !== null,
  };
}

/**
 * Card 3 — RSI(14) zone + MACD(12,26,9) histogram sign and recent cross.
 *
 * Metrics surfaced:
 *   - RSI bucket: Overbought >70, Oversold <30, else Neutral with lean.
 *   - MACD histogram sign.
 *   - Whether MACD line crossed above/below its signal within the last 3
 *     bars (the most-recent decisive moment).
 */
export function summarizeRsiMacd(candles: readonly OHLC[]): InsightCard {
  const closes = candles.map((c) => c.close);
  if (closes.length < INSIGHT_MIN_BARS) {
    return { ...LOADING_CARD, id: "rsi-macd", title: "RSI / MACD" };
  }

  const rsiSeries = rsi(closes, 14);
  const rsiNow = rsiSeries[rsiSeries.length - 1];

  let rsiTag: "Overbought" | "Oversold" | "Bullish lean" | "Bearish lean" | "Neutral";
  if (rsiNow >= 70) rsiTag = "Overbought";
  else if (rsiNow <= 30) rsiTag = "Oversold";
  else if (rsiNow >= 55) rsiTag = "Bullish lean";
  else if (rsiNow <= 45) rsiTag = "Bearish lean";
  else rsiTag = "Neutral";

  const mac = macd(closes);
  const histNow = mac.histogram[mac.histogram.length - 1];
  const signalPrev = mac.signal[mac.signal.length - 2];
  const macdPrev = mac.macd[mac.macd.length - 2];
  const signalNow = mac.signal[mac.signal.length - 1];
  const macdNow = mac.macd[mac.macd.length - 1];

  // Sub-pip noise floor. MACD on a perfectly flat input returns
  // IEEE-754 subtraction noise on the order of 1e-16 which breaks
  // strict `> 0` / `< 0` classification into fake directional reads.
  // 1e-7 in price-relative units is well below the smallest tradeable
  // pip (1e-5 for majors, 1e-3 for JPY pairs) so any value below it
  // is trivially zero and gets bucketed as 'Flat'.
  const NOISE_EPSILON = 1e-7;
  const histClean = Math.abs(histNow) < NOISE_EPSILON ? 0 : histNow;

  // Same noise floor for cross detection — a "cross" requires a
  // measurable gap on both sides of the line, not just numerical
  // sign flips from rounding. Strict `> NOISE_EPSILON` (rather than
  // `>=`) means a gap that lands exactly at the boundary does NOT
  // register as a cross; this is intentional — anything in the
  // (-ε, ε) band is treated as "still rubbing" rather than "just
  // crossed".
  const bullishCross =
    Number.isFinite(signalPrev) && Number.isFinite(macdPrev) &&
    Number.isFinite(signalNow) && Number.isFinite(macdNow) &&
    macdPrev - signalPrev < NOISE_EPSILON && macdNow - signalNow > NOISE_EPSILON;
  const bearishCross =
    Number.isFinite(signalPrev) && Number.isFinite(macdPrev) &&
    Number.isFinite(signalNow) && Number.isFinite(macdNow) &&
    macdPrev - signalPrev > -NOISE_EPSILON && macdNow - signalNow < -NOISE_EPSILON;

  let macdTag: "Bullish cross" | "Bearish cross" | "Bullish" | "Bearish" | "Flat";
  if (bullishCross) macdTag = "Bullish cross";
  else if (bearishCross) macdTag = "Bearish cross";
  else if (histClean > 0) macdTag = "Bullish";
  else if (histClean < 0) macdTag = "Bearish";
  else macdTag = "Flat";

  // Combined sentiment — RSI dominates if it is at an extreme.
  const sentiment: Sentiment =
    rsiTag === "Overbought" ? "bearish"
    : rsiTag === "Oversold" ? "bullish"
    : macdTag === "Bullish cross" || macdTag === "Bullish" ? "bullish"
    : macdTag === "Bearish cross" || macdTag === "Bearish" ? "bearish"
    : "neutral";

  // Display the cleaned (noise-floor-zeroed) histogram so the
  // description matches the chip instead of carrying the IEEE-754
  // —6.66e-16 ghost value.
  const description =
    `RSI(14) at ${rsiNow.toFixed(1)} — ${rsiTag.toLowerCase()}. ` +
    `MACD histogram is ${histClean >= 0 ? "+" : ""}${histClean.toFixed(5)} ` +
    `(${macdTag.toLowerCase()}).`;

  return {
    id: "rsi-macd",
    title: "RSI / MACD",
    description,
    tagline:
      rsiTag === "Overbought" || rsiTag === "Oversold" ? rsiTag
      : macdTag,
    sentiment,
    ready: true,
  };
}
