/**
 * Deterministic seed fixtures for the Playwright snapshot tests.
 *
 * The /lens/trading live chart normally pulls history from
 * `/api/market/data?symbol=EURUSD&granularity=1d`. To make the snapshot
 * immune to "today's date" drift and to free-tier rate-limit flakiness, the
 * `trading-lens-live-chart.spec.ts` spec intercepts that route via
 * `page.route()` and serves this fixture instead.
 *
 * The candle array is a fixed 100-row EUR/USD timeline anchored to arbitrary
 * historical dates (2024-06-19 → 2024-09-30) so it doesn't accidentally match
 * a live currency ratio. The hangs from each Open are derived by a small
 * mulberry32 PRNG seeded with `0xC0FFEE` — the same constant everywhere — so
 * that a deliberately-introduced layout change regenerates the same shape
 * across machines. Bumping the seed gives a deterministic-but-different
 * timeline; copy the file to a sibling fixture if you need a fresh canvas.
 */

export interface SeededCandle {
  time: string; // ISO date string for daily, "YYYY-MM-DD HH:MM:SS" for intraday
  open: number;
  high: number;
  low: number;
  close: number;
}

// ── Tiny seeded PRNG (mulberry32) so the fixture is repeatable. ──

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Fixture generation ───────────────────────────────────────────

function generateDailyCandles(count: number): SeededCandle[] {
  const rand = mulberry32(0xc0ffee);
  // Anchor range: 2024-06-19 → 2024-09-30, in trading-day order.
  const startMs = new Date("2024-06-19T00:00:00Z").getTime();
  const candles: SeededCandle[] = [];

  let prevClose = 1.085; // base price
  for (let i = 0; i < count; i++) {
    const dayMs = startMs + i * 86_400_000;
    const date = new Date(dayMs);
    const iso = date.toISOString().slice(0, 10);

    const open = Number((prevClose + (rand() - 0.5) * 0.0015).toFixed(5));
    const close = Number((open + (rand() - 0.5) * 0.003).toFixed(5));
    const high = Number((Math.max(open, close) + rand() * 0.0025).toFixed(5));
    const low = Number((Math.min(open, close) - rand() * 0.0025).toFixed(5));

    candles.push({ time: iso, open, high, low, close });
    prevClose = close;
  }
  return candles;
}

export const SEEDED_100_DAILY: SeededCandle[] = generateDailyCandles(100);

export const SEEDED_QUOTE = {
  fromCurrency: "EUR",
  toCurrency: "USD",
  exchangeRate: 1.085,
  bidPrice: 1.0848,
  askPrice: 1.0852,
  lastRefreshed: "2024-09-30 16:00:00",
  timeZone: "UTC",
};

export const SEEDED_MARKET_DATA_RESPONSE = {
  quote: SEEDED_QUOTE,
  candles: SEEDED_100_DAILY,
  granularity: "1d" as const,
  fromCache: true,
};
