import { ema, rsi, macd, atr, bollingerBands, type OHLC } from "./indicators";

export interface TradeSignal {
  id: string;
  index: number;
  time: string;
  type: "BUY" | "SELL";
  price: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  riskReward: string;
  strength: number; // 0 - 100
  confluence: string[];
  status?: "ACTIVE" | "TP1_HIT" | "TP2_HIT" | "SL_HIT";
}

export interface StrategyResult {
  signals: TradeSignal[];
  activeSignal: TradeSignal | null;
  indicators: {
    ema9: number[];
    ema21: number[];
    bb: { middle: number[]; upper: number[]; lower: number[]; bandwidth: number[] };
    rsi14: number[];
    macd: { macd: number[]; signal: number[]; histogram: number[] };
    atr14: number[];
  };
  marketRegime: {
    trend: "STRONG_BULLISH" | "BULLISH" | "NEUTRAL" | "BEARISH" | "STRONG_BEARISH";
    rsiState: string;
    volatilityState: "SQUEEZE" | "EXPANDING" | "NORMAL";
    confluenceScore: number; // 0 - 100
  };
}

/**
 * Institutional Trend & Momentum Confluence (ITMC) Strategy
 * Combines EMA 9/21, Bollinger Bands (20, 2), RSI (14), and ATR (14)
 * to generate high-probability, risk-managed Buy and Sell signals.
 */
export function calculateStrategySignals(
  candles: readonly OHLC[],
  options: {
    cooldownBars?: number;
    minConfidence?: number;
  } = {}
): StrategyResult {
  const { cooldownBars = 8, minConfidence = 60 } = options;

  if (!candles || candles.length < 25) {
    return {
      signals: [],
      activeSignal: null,
      indicators: {
        ema9: [],
        ema21: [],
        bb: { middle: [], upper: [], lower: [], bandwidth: [] },
        rsi14: [],
        macd: { macd: [], signal: [], histogram: [] },
        atr14: [],
      },
      marketRegime: {
        trend: "NEUTRAL",
        rsiState: "Awaiting Data",
        volatilityState: "NORMAL",
        confluenceScore: 50,
      },
    };
  }

  const closes = candles.map((c) => c.close);
  const ema9 = ema(closes, 9);
  const ema21 = ema(closes, 21);
  const bb = bollingerBands(closes, 20, 2);
  const rsi14 = rsi(closes, 14);
  const macdData = macd(closes, 12, 26, 9);
  const atr14 = atr(candles, 14);

  const signals: TradeSignal[] = [];
  let lastSignalIndex = -cooldownBars;

  const n = candles.length;
  // Start after indicator warmup (min 22 bars for EMA21 and BB20)
  for (let i = 22; i < n; i++) {
    const prevEma9 = ema9[i - 1];
    const currEma9 = ema9[i];
    const prevEma21 = ema21[i - 1];
    const currEma21 = ema21[i];
    const currRsi = rsi14[i];
    const prevRsi = rsi14[i - 1];
    const currMacdHist = macdData.histogram[i];
    const prevMacdHist = macdData.histogram[i - 1];
    const currBB = { upper: bb.upper[i], lower: bb.lower[i], mid: bb.middle[i] };
    const currAtr = atr14[i] || Math.abs(candles[i].high - candles[i].low) || 0.001;

    const candle = candles[i];
    const prevCandle = candles[i - 1];

    if (
      Number.isNaN(currEma9) ||
      Number.isNaN(currEma21) ||
      Number.isNaN(currRsi) ||
      Number.isNaN(currBB.upper) ||
      Number.isNaN(currBB.lower)
    ) {
      continue;
    }

    if (i - lastSignalIndex < cooldownBars) {
      continue;
    }

    const isBullishCross = prevEma9 <= prevEma21 && currEma9 > currEma21;
    const isBearishCross = prevEma9 >= prevEma21 && currEma9 < currEma21;

    const isEma9Above21 = currEma9 > currEma21;
    const isEma9Below21 = currEma9 < currEma21;

    // Confluence for BUY
    const buyFactors: string[] = [];
    let buyScore = 0;

    // 1. Trend alignment
    if (isBullishCross) {
      buyFactors.push("EMA 9/21 Golden Cross");
      buyScore += 35;
    } else if (isEma9Above21) {
      buyFactors.push("Uptrend Baseline (EMA 9 > 21)");
      buyScore += 20;
    }

    // 2. Price Action / Mean Reversion Pullback
    const pulledBackToEma =
      candle.low <= currEma21 * 1.0005 && candle.close >= currEma9;
    const bouncedOffLowerBB =
      prevCandle.low <= bb.lower[i - 1] * 1.001 && candle.close > prevCandle.close;

    if (bouncedOffLowerBB) {
      buyFactors.push("Bollinger Lower Band Support Bounce");
      buyScore += 25;
    } else if (pulledBackToEma) {
      buyFactors.push("EMA Dynamic Pullback & Rejection");
      buyScore += 20;
    } else if (candle.close > currBB.mid && prevCandle.close <= bb.middle[i - 1]) {
      buyFactors.push("Bollinger Midline Breakout");
      buyScore += 15;
    }

    // 3. Momentum (RSI & MACD)
    if (!Number.isNaN(currRsi)) {
      if (currRsi > 50 && currRsi < 70) {
        buyFactors.push(`RSI Bullish Momentum (${currRsi.toFixed(1)})`);
        buyScore += 20;
      } else if (prevRsi < 40 && currRsi >= 40) {
        buyFactors.push(`RSI Exiting Oversold (${currRsi.toFixed(1)})`);
        buyScore += 25;
      }
    }

    if (!Number.isNaN(currMacdHist)) {
      if (currMacdHist > 0 && currMacdHist > (prevMacdHist || 0)) {
        buyFactors.push("MACD Histogram Expanding Green");
        buyScore += 15;
      } else if (prevMacdHist < 0 && currMacdHist >= 0) {
        buyFactors.push("MACD Bullish Zero Cross");
        buyScore += 20;
      }
    }

    // Confluence for SELL
    const sellFactors: string[] = [];
    let sellScore = 0;

    // 1. Trend alignment
    if (isBearishCross) {
      sellFactors.push("EMA 9/21 Death Cross");
      sellScore += 35;
    } else if (isEma9Below21) {
      sellFactors.push("Downtrend Baseline (EMA 9 < 21)");
      sellScore += 20;
    }

    // 2. Price Action / Mean Reversion Pullback
    const rejectedAtEma =
      candle.high >= currEma21 * 0.9995 && candle.close <= currEma9;
    const rejectedAtUpperBB =
      prevCandle.high >= bb.upper[i - 1] * 0.999 && candle.close < prevCandle.close;

    if (rejectedAtUpperBB) {
      sellFactors.push("Bollinger Upper Band Rejection");
      sellScore += 25;
    } else if (rejectedAtEma) {
      sellFactors.push("EMA Dynamic Resistance Rejection");
      sellScore += 20;
    } else if (candle.close < currBB.mid && prevCandle.close >= bb.middle[i - 1]) {
      sellFactors.push("Bollinger Midline Breakdown");
      sellScore += 15;
    }

    // 3. Momentum (RSI & MACD)
    if (!Number.isNaN(currRsi)) {
      if (currRsi < 50 && currRsi > 30) {
        sellFactors.push(`RSI Bearish Momentum (${currRsi.toFixed(1)})`);
        sellScore += 20;
      } else if (prevRsi > 60 && currRsi <= 60) {
        sellFactors.push(`RSI Exiting Overbought (${currRsi.toFixed(1)})`);
        sellScore += 25;
      }
    }

    if (!Number.isNaN(currMacdHist)) {
      if (currMacdHist < 0 && currMacdHist < (prevMacdHist || 0)) {
        sellFactors.push("MACD Histogram Expanding Red");
        sellScore += 15;
      } else if (prevMacdHist > 0 && currMacdHist <= 0) {
        sellFactors.push("MACD Bearish Zero Cross");
        sellScore += 20;
      }
    }

    // Decision: High-probability entry with strict risk limits
    if (buyScore >= minConfidence && buyScore > sellScore && (isBullishCross || bouncedOffLowerBB || (isEma9Above21 && pulledBackToEma))) {
      const entryPrice = candle.close;
      const riskPips = Math.max(currAtr * 1.5, Math.abs(entryPrice - candle.low) * 1.1);
      const stopLoss = Number((entryPrice - riskPips).toFixed(5));
      const takeProfit1 = Number((entryPrice + riskPips * 1.5).toFixed(5));
      const takeProfit2 = Number((entryPrice + riskPips * 2.5).toFixed(5));

      signals.push({
        id: `sig-buy-${i}-${candle.time}`,
        index: i,
        time: candle.time,
        type: "BUY",
        price: entryPrice,
        stopLoss,
        takeProfit1,
        takeProfit2,
        riskReward: "1:2.0",
        strength: Math.min(98, buyScore),
        confluence: buyFactors,
      });
      lastSignalIndex = i;
    } else if (sellScore >= minConfidence && sellScore > buyScore && (isBearishCross || rejectedAtUpperBB || (isEma9Below21 && rejectedAtEma))) {
      const entryPrice = candle.close;
      const riskPips = Math.max(currAtr * 1.5, Math.abs(candle.high - entryPrice) * 1.1);
      const stopLoss = Number((entryPrice + riskPips).toFixed(5));
      const takeProfit1 = Number((entryPrice - riskPips * 1.5).toFixed(5));
      const takeProfit2 = Number((entryPrice - riskPips * 2.5).toFixed(5));

      signals.push({
        id: `sig-sell-${i}-${candle.time}`,
        index: i,
        time: candle.time,
        type: "SELL",
        price: entryPrice,
        stopLoss,
        takeProfit1,
        takeProfit2,
        riskReward: "1:2.0",
        strength: Math.min(98, sellScore),
        confluence: sellFactors,
      });
      lastSignalIndex = i;
    }
  }

  // Evaluate execution status of historical signals
  for (let s = 0; s < signals.length; s++) {
    const sig = signals[s];
    let resolved = false;
    for (let k = sig.index + 1; k < n; k++) {
      const bar = candles[k];
      if (sig.type === "BUY") {
        if (bar.low <= sig.stopLoss) {
          sig.status = "SL_HIT";
          resolved = true;
          break;
        } else if (bar.high >= sig.takeProfit2) {
          sig.status = "TP2_HIT";
          resolved = true;
          break;
        } else if (bar.high >= sig.takeProfit1) {
          sig.status = "TP1_HIT";
        }
      } else {
        if (bar.high >= sig.stopLoss) {
          sig.status = "SL_HIT";
          resolved = true;
          break;
        } else if (bar.low <= sig.takeProfit2) {
          sig.status = "TP2_HIT";
          resolved = true;
          break;
        } else if (bar.low <= sig.takeProfit1) {
          sig.status = "TP1_HIT";
        }
      }
    }
    if (!resolved && !sig.status) {
      sig.status = "ACTIVE";
    }
  }

  // Active or most recent signal
  const activeSignal = signals.length > 0 ? signals[signals.length - 1] : null;

  // Determine current market regime
  const lastIdx = n - 1;
  const lastE9 = ema9[lastIdx];
  const lastE21 = ema21[lastIdx];
  const lastRsi = rsi14[lastIdx] ?? 50;
  const lastBw = bb.bandwidth[lastIdx] ?? 0.01;

  let trend: StrategyResult["marketRegime"]["trend"] = "NEUTRAL";
  if (!Number.isNaN(lastE9) && !Number.isNaN(lastE21)) {
    const diffPct = (lastE9 - lastE21) / lastE21;
    if (diffPct > 0.0015) trend = "STRONG_BULLISH";
    else if (diffPct > 0) trend = "BULLISH";
    else if (diffPct < -0.0015) trend = "STRONG_BEARISH";
    else trend = "BEARISH";
  }

  let rsiState = "Neutral (45 - 55)";
  if (lastRsi >= 70) rsiState = `Overbought (${lastRsi.toFixed(1)})`;
  else if (lastRsi <= 30) rsiState = `Oversold (${lastRsi.toFixed(1)})`;
  else if (lastRsi > 55) rsiState = `Bullish Momentum (${lastRsi.toFixed(1)})`;
  else if (lastRsi < 45) rsiState = `Bearish Momentum (${lastRsi.toFixed(1)})`;

  let volatilityState: StrategyResult["marketRegime"]["volatilityState"] = "NORMAL";
  if (lastBw < 0.003) volatilityState = "SQUEEZE";
  else if (lastBw > 0.012) volatilityState = "EXPANDING";

  const confluenceScore = activeSignal?.strength ?? (trend === "STRONG_BULLISH" || trend === "STRONG_BEARISH" ? 75 : 50);

  return {
    signals,
    activeSignal,
    indicators: {
      ema9,
      ema21,
      bb,
      rsi14,
      macd: macdData,
      atr14,
    },
    marketRegime: {
      trend,
      rsiState,
      volatilityState,
      confluenceScore,
    },
  };
}
