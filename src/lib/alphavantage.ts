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
const CACHE_TTL = 60_000; // 60 seconds

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
