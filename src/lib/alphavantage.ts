/**
 * Alpha Vantage API client — real-time forex quotes & daily OHLCV data.
 * Docs: https://www.alphavantage.co/documentation/
 *
 * Free tier: 5 calls/min, 500 calls/day.
 * We use server-side caching to stay well within limits.
 */

const BASE_URL = "https://www.alphavantage.co/query";

export interface ForexQuote {
  fromCurrency: string;
  toCurrency: string;
  exchangeRate: number;
  bidPrice: number;
  askPrice: number;
  lastRefreshed: string;
  timeZone: string;
}

export interface DailyCandle {
  time: string; // ISO date string
  open: number;
  high: number;
  low: number;
  close: number;
}

export type IntradayInterval = "1min" | "5min" | "15min" | "30min" | "60min";

export interface IntradayCandle {
  time: string; // "YYYY-MM-DD HH:MM:SS" — Alpha Vantage intraday timestamp
  open: number;
  high: number;
  low: number;
  close: number;
}

interface AVExchangeRateResponse {
  "Realtime Currency Exchange Rate"?: {
    "1. From_Currency Code": string;
    "2. From_Currency Name": string;
    "3. To_Currency Code": string;
    "4. To_Currency Name": string;
    "5. Exchange Rate": string;
    "6. Last Refreshed": string;
    "7. Time Zone": string;
    "8. Bid Price": string;
    "9. Ask Price": string;
  };
  Note?: string;
  "Error Message"?: string;
}

interface AVFxDailyResponse {
  "Time Series FX (Daily)"?: Record<
    string, // date like "2024-01-15"
    {
      "1. open": string;
      "2. high": string;
      "3. low": string;
      "4. close": string;
    }
  >;
  Note?: string;
  "Error Message"?: string;
}

// ── Server-side cache (clears on cold start) ──

const quoteCache = new Map<string, { data: ForexQuote; expiresAt: number }>();
const candleCache = new Map<string, { data: DailyCandle[]; expiresAt: number }>();
const intradayCache = new Map<
  string,
  { data: IntradayCandle[]; expiresAt: number }
>();
const CACHE_TTL = 60_000; // 60 seconds

/** Clear all caches (useful for testing). */
export function clearCache(): void {
  quoteCache.clear();
  candleCache.clear();
  intradayCache.clear();
}

function getApiKey(): string {
  const key = process.env.ALPHA_VANTAGE_API_KEY;
  if (!key) throw new Error("ALPHA_VANTAGE_API_KEY is not configured");
  return key;
}

function parseNumber(val: string | undefined): number {
  return val ? Number(val) : 0;
}

/**
 * Fetch a real-time forex quote for a currency pair.
 */
export async function fetchForexQuote(
  fromCurrency: string,
  toCurrency: string
): Promise<ForexQuote> {
  const cacheKey = `${fromCurrency}_${toCurrency}`;
  const cached = quoteCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  const apiKey = getApiKey();
  const url = `${BASE_URL}?function=CURRENCY_EXCHANGE_RATE&from_currency=${fromCurrency}&to_currency=${toCurrency}&apikey=${apiKey}`;

  const response = await fetch(url, { next: { revalidate: 60 } });
  const data: AVExchangeRateResponse = await response.json();

  if (data["Error Message"]) {
    throw new Error(`Alpha Vantage error: ${data["Error Message"]}`);
  }
  if (data.Note) {
    // Typically a rate-limit note
    console.warn("Alpha Vantage note:", data.Note);
  }

  const quote = data["Realtime Currency Exchange Rate"];
  if (!quote) {
    throw new Error(`No exchange rate data returned for ${fromCurrency}/${toCurrency}`);
  }

  const result: ForexQuote = {
    fromCurrency: quote["1. From_Currency Code"],
    toCurrency: quote["3. To_Currency Code"],
    exchangeRate: parseNumber(quote["5. Exchange Rate"]),
    bidPrice: parseNumber(quote["8. Bid Price"]),
    askPrice: parseNumber(quote["9. Ask Price"]),
    lastRefreshed: quote["6. Last Refreshed"],
    timeZone: quote["7. Time Zone"],
  };

  quoteCache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL });
  return result;
}

/**
 * Fetch daily FX candles (OHLC) for a currency pair.
 * Returns up to 100 most recent trading days.
 */
export async function fetchDailyCandles(
  fromCurrency: string,
  toCurrency: string
): Promise<DailyCandle[]> {
  const cacheKey = `candles_${fromCurrency}_${toCurrency}`;
  const cached = candleCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  const apiKey = getApiKey();
  const url = `${BASE_URL}?function=FX_DAILY&from_symbol=${fromCurrency}&to_symbol=${toCurrency}&apikey=${apiKey}`;

  const response = await fetch(url, { next: { revalidate: 60 } });
  const data: AVFxDailyResponse = await response.json();

  if (data["Error Message"]) {
    throw new Error(`Alpha Vantage error: ${data["Error Message"]}`);
  }
  if (data.Note) {
    console.warn("Alpha Vantage note:", data.Note);
  }

  const timeSeries = data["Time Series FX (Daily)"];
  if (!timeSeries) {
    throw new Error(`No daily data returned for ${fromCurrency}/${toCurrency}`);
  }

  const result: DailyCandle[] = Object.entries(timeSeries)
    .map(([date, values]) => ({
      time: date, // "YYYY-MM-DD"
      open: parseNumber(values["1. open"]),
      high: parseNumber(values["2. high"]),
      low: parseNumber(values["3. low"]),
      close: parseNumber(values["4. close"]),
    }))
    .sort((a, b) => a.time.localeCompare(b.time));

  candleCache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL });
  return result;
}

type AVTimeSeriesRow = {
  "1. open": string;
  "2. high": string;
  "3. low": string;
  "4. close": string;
};
type AVTimeSeriesMap = Record<string, AVTimeSeriesRow>;

interface AVMetaData {
  "1. Information": string;
  "2. From Symbol": string;
  "3. To Symbol": string;
  "4. Last Refreshed": string;
  "5. Interval": string;
  "6. Output Size": string;
  "7. Time Zone": string;
}

interface AVFxIntradayResponse {
  "Meta Data"?: AVMetaData;
  Note?: string;
  "Error Message"?: string;
  // The time-series key embeds the interval, e.g. `"Time Series FX (60min)"`.
  // Widen to `string` (rather than template-literal index) so the dynamic
  // `Object.keys(data).find` accessor in `fetchIntradayCandles` reads cleanly
  // without a keyof cast at the call site. Literal-named properties above are
  // subtypes of the index's union (TS2411 otherwise).
  [timeSeriesKey: string]:
    | AVMetaData
    | AVTimeSeriesMap
    | string
    | undefined;
}

/**
 * Fetch intraday FX candles (OHLC) for a currency pair at the requested
 * granularity. Returns up to 100 most-recent buckets when `outputsize=compact`
 * (default for the chart UI), or the full available history with `full`.
 *
 * Note: Alpha Vantage returns the interval embedded in the time-series key
 * (`"Time Series FX (60min)"` etc.). We detect it dynamically rather than
 * hard-coding it, so callers can pass any valid `IntradayInterval`.
 */
export async function fetchIntradayCandles(
  fromCurrency: string,
  toCurrency: string,
  interval: IntradayInterval
): Promise<IntradayCandle[]> {
  const cacheKey = `intraday_${fromCurrency}_${toCurrency}_${interval}`;
  const cached = intradayCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  const apiKey = getApiKey();
  const url = `${BASE_URL}?function=FX_INTRADAY&from_symbol=${fromCurrency}&to_symbol=${toCurrency}&interval=${interval}&outputsize=compact&apikey=${apiKey}`;

  const response = await fetch(url, { next: { revalidate: 60 } });
  const data: AVFxIntradayResponse = await response.json();

  if (data["Error Message"]) {
    throw new Error(`Alpha Vantage error: ${data["Error Message"]}`);
  }
  if (data.Note) {
    // Typically a rate-limit note
    console.warn("Alpha Vantage note:", data.Note);
  }

  // Detect the time-series key dynamically — its shape depends on the interval.
  // The wide `string` index signature on `AVFxIntradayResponse` returns the
  // full intersection union; we narrow at the lookup site with `as` so the
  // rest of this function reads `AVTimeSeriesMap` statically.
  const timeSeriesKey = Object.keys(data).find((k) =>
    k.startsWith("Time Series FX")
  );
  const timeSeries = timeSeriesKey
    ? (data[timeSeriesKey] as AVTimeSeriesMap | undefined)
    : undefined;
  if (!timeSeries) {
    throw new Error(
      `No intraday data returned for ${fromCurrency}/${toCurrency} @ ${interval}`
    );
  }

  const result: IntradayCandle[] = Object.entries(timeSeries)
    .map(([timestamp, values]) => ({
      time: timestamp, // "YYYY-MM-DD HH:MM:SS"
      open: parseNumber(values["1. open"]),
      high: parseNumber(values["2. high"]),
      low: parseNumber(values["3. low"]),
      close: parseNumber(values["4. close"]),
    }))
    .sort((a, b) => a.time.localeCompare(b.time));

  intradayCache.set(cacheKey, {
    data: result,
    expiresAt: Date.now() + CACHE_TTL,
  });
  return result;
}
