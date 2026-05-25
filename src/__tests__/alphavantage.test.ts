import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("fetchForexQuote", () => {
  beforeEach(() => {
    vi.stubEnv("ALPHA_VANTAGE_API_KEY", "X5G0VATXEQ5EBWAA");
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.useRealTimers();
    // Clear module cache so next import gets fresh state
    vi.resetModules();
  });

  it("fetches a forex quote and returns parsed data", async () => {
    const mockResponse = {
      "Realtime Currency Exchange Rate": {
        "1. From_Currency Code": "EUR",
        "2. From_Currency Name": "Euro",
        "3. To_Currency Code": "USD",
        "4. To_Currency Name": "United States Dollar",
        "5. Exchange Rate": "1.0850",
        "6. Last Refreshed": "2025-05-21 10:30:00",
        "7. Time Zone": "UTC",
        "8. Bid Price": "1.0848",
        "9. Ask Price": "1.0852",
      },
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { fetchForexQuote } = await import("@/lib/alphavantage");

    const result = await fetchForexQuote("EUR", "USD");

    expect(result.fromCurrency).toBe("EUR");
    expect(result.toCurrency).toBe("USD");
    expect(result.exchangeRate).toBe(1.085);
    expect(result.bidPrice).toBe(1.0848);
    expect(result.askPrice).toBe(1.0852);
    expect(result.lastRefreshed).toBe("2025-05-21 10:30:00");
  });

  it("throws when ALPHA_VANTAGE_API_KEY is not configured", async () => {
    vi.stubEnv("ALPHA_VANTAGE_API_KEY", "");

    const { fetchForexQuote } = await import("@/lib/alphavantage");

    await expect(fetchForexQuote("CHF", "JPY")).rejects.toThrow(
      "ALPHA_VANTAGE_API_KEY is not configured"
    );
  });

  it("throws when the API returns an error message", async () => {
    const errorResponse = {
      "Error Message": "Invalid API call. Please retry.",
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(errorResponse),
    });

    const { fetchForexQuote } = await import("@/lib/alphavantage");

    await expect(fetchForexQuote("GBP", "NZD")).rejects.toThrow(
      "Alpha Vantage error"
    );
  });

  it("throws when the quote object is missing", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    const { fetchForexQuote } = await import("@/lib/alphavantage");

    await expect(fetchForexQuote("AUD", "CAD")).rejects.toThrow(
      "No exchange rate data"
    );
  });

  it("caches results and returns from cache within TTL", async () => {
    vi.useFakeTimers();

    const mockResponse = {
      "Realtime Currency Exchange Rate": {
        "1. From_Currency Code": "GBP",
        "2. From_Currency Name": "British Pound",
        "3. To_Currency Code": "USD",
        "4. To_Currency Name": "United States Dollar",
        "5. Exchange Rate": "1.2500",
        "6. Last Refreshed": "2025-05-21 10:00:00",
        "7. Time Zone": "UTC",
        "8. Bid Price": "1.2498",
        "9. Ask Price": "1.2502",
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { fetchForexQuote } = await import("@/lib/alphavantage");

    // First call — should hit the API
    const result1 = await fetchForexQuote("GBP", "USD");
    expect(result1.exchangeRate).toBe(1.25);

    // Second call within TTL — should use cache
    const result2 = await fetchForexQuote("GBP", "USD");
    expect(result2.exchangeRate).toBe(1.25);

    // fetch should only be called once
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("re-fetches after cache TTL expires", async () => {
    vi.useFakeTimers();

    const mockResponse = {
      "Realtime Currency Exchange Rate": {
        "1. From_Currency Code": "USD",
        "2. From_Currency Name": "US Dollar",
        "3. To_Currency Code": "JPY",
        "4. To_Currency Name": "Japanese Yen",
        "5. Exchange Rate": "151.00",
        "6. Last Refreshed": "2025-05-21 10:00:00",
        "7. Time Zone": "UTC",
        "8. Bid Price": "150.98",
        "9. Ask Price": "151.02",
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { fetchForexQuote } = await import("@/lib/alphavantage");

    // First call
    await fetchForexQuote("USD", "JPY");
    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Advance past TTL
    vi.advanceTimersByTime(61_000);

    // Second call — should re-fetch
    await fetchForexQuote("USD", "JPY");
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("logs a warning when rate limit note is present", async () => {
    const rateLimitedResponse = {
      "Realtime Currency Exchange Rate": {
        "1. From_Currency Code": "EUR",
        "2. From_Currency Name": "Euro",
        "3. To_Currency Code": "USD",
        "4. To_Currency Name": "United States Dollar",
        "5. Exchange Rate": "1.0850",
        "6. Last Refreshed": "2025-05-21 10:30:00",
        "7. Time Zone": "UTC",
        "8. Bid Price": "1.0848",
        "9. Ask Price": "1.0852",
      },
      Note: "Thank you for using Alpha Vantage! Our standard API rate limit is 5 calls per minute.",
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(rateLimitedResponse),
    });

    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { fetchForexQuote } = await import("@/lib/alphavantage");

    const result = await fetchForexQuote("EUR", "NZD");
    expect(result.exchangeRate).toBe(1.085);
    expect(consoleSpy).toHaveBeenCalledWith(
      "Alpha Vantage note:",
      expect.stringContaining("rate limit")
    );

    consoleSpy.mockRestore();
  });

  it("correctly constructs the API URL with parameters", async () => {
    const mockResponse = {
      "Realtime Currency Exchange Rate": {
        "1. From_Currency Code": "AUD",
        "2. From_Currency Name": "Australian Dollar",
        "3. To_Currency Code": "USD",
        "4. To_Currency Name": "United States Dollar",
        "5. Exchange Rate": "0.6500",
        "6. Last Refreshed": "2025-05-21 10:00:00",
        "7. Time Zone": "UTC",
        "8. Bid Price": "0.6498",
        "9. Ask Price": "0.6502",
      },
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { fetchForexQuote } = await import("@/lib/alphavantage");

    await fetchForexQuote("AUD", "USD");

    const calledUrl = (global.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as string;

    expect(calledUrl).toContain("function=CURRENCY_EXCHANGE_RATE");
    expect(calledUrl).toContain("from_currency=AUD");
    expect(calledUrl).toContain("to_currency=USD");
    expect(calledUrl).toContain("apikey=X5G0VATXEQ5EBWAA");
  });
});

// ─── fetchDailyCandles ────────────────────────────────────────────

describe("fetchDailyCandles", () => {
  beforeEach(() => {
    vi.stubEnv("ALPHA_VANTAGE_API_KEY", "X5G0VATXEQ5EBWAA");
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.useRealTimers();
    vi.resetModules();
  });

  it("fetches daily candles and returns parsed array", async () => {
    const mockResponse = {
      "Meta Data": {
        "1. Information": "FX Daily Prices",
        "2. From Symbol": "EUR",
        "3. To Symbol": "USD",
      },
      "Time Series FX (Daily)": {
        "2025-05-21": {
          "1. open": "1.0830",
          "2. high": "1.0865",
          "3. low": "1.0820",
          "4. close": "1.0850",
        },
        "2025-05-20": {
          "1. open": "1.0810",
          "2. high": "1.0840",
          "3. low": "1.0805",
          "4. close": "1.0830",
        },
      },
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { fetchDailyCandles } = await import("@/lib/alphavantage");

    const result = await fetchDailyCandles("EUR", "USD");

    expect(result).toHaveLength(2);
    // Sorted ascending by date
    expect(result[0].time).toBe("2025-05-20");
    expect(result[0].open).toBe(1.081);
    expect(result[0].high).toBe(1.084);
    expect(result[0].low).toBe(1.0805);
    expect(result[0].close).toBe(1.083);
    expect(result[1].time).toBe("2025-05-21");
  });

  it("throws when no time series data is returned", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ "Meta Data": {} }),
    });

    const { fetchDailyCandles } = await import("@/lib/alphavantage");

    await expect(fetchDailyCandles("NZD", "USD")).rejects.toThrow(
      "No daily data"
    );
  });

  it("throws on API error message", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          "Error Message": "This API function does not exist.",
        }),
    });

    const { fetchDailyCandles } = await import("@/lib/alphavantage");

    await expect(fetchDailyCandles("EUR", "CHF")).rejects.toThrow(
      "Alpha Vantage error"
    );
  });

  it("uses correct API function FX_DAILY", async () => {
    const mockResponse = {
      "Meta Data": {},
      "Time Series FX (Daily)": {
        "2025-05-21": {
          "1. open": "1.1000",
          "2. high": "1.1050",
          "3. low": "1.0990",
          "4. close": "1.1020",
        },
      },
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { fetchDailyCandles } = await import("@/lib/alphavantage");

    await fetchDailyCandles("GBP", "JPY");

    const calledUrl = (global.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as string;

    expect(calledUrl).toContain("function=FX_DAILY");
    expect(calledUrl).toContain("from_symbol=GBP");
    expect(calledUrl).toContain("to_symbol=JPY");
  });

  it("caches candles within TTL", async () => {
    vi.useFakeTimers();

    const mockResponse = {
      "Meta Data": {},
      "Time Series FX (Daily)": {
        "2025-05-21": {
          "1. open": "1.1000",
          "2. high": "1.1050",
          "3. low": "1.0990",
          "4. close": "1.1020",
        },
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { fetchDailyCandles } = await import("@/lib/alphavantage");

    await fetchDailyCandles("EUR", "GBP");
    await fetchDailyCandles("EUR", "GBP");

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("separates cache keys for quotes and candles", async () => {
    const quoteResponse = {
      "Realtime Currency Exchange Rate": {
        "1. From_Currency Code": "EUR",
        "2. From_Currency Name": "Euro",
        "3. To_Currency Code": "AUD",
        "4. To_Currency Name": "Australian Dollar",
        "5. Exchange Rate": "1.6690",
        "6. Last Refreshed": "2025-05-21 10:30:00",
        "7. Time Zone": "UTC",
        "8. Bid Price": "1.6688",
        "9. Ask Price": "1.6692",
      },
    };

    const candlesResponse = {
      "Meta Data": {},
      "Time Series FX (Daily)": {
        "2025-05-21": {
          "1. open": "1.6680",
          "2. high": "1.6710",
          "3. low": "1.6670",
          "4. close": "1.6690",
        },
      },
    };

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(quoteResponse),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(candlesResponse),
      });

    const { fetchForexQuote, fetchDailyCandles } = await import(
      "@/lib/alphavantage"
    );

    // Both should fetch since they use different cache keys
    await fetchForexQuote("EUR", "AUD");
    await fetchDailyCandles("EUR", "AUD");

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
