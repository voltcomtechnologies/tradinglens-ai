import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  fetchForexQuote,
  fetchDailyCandles,
  type ForexQuote,
  type DailyCandle,
} from "@/lib/alphavantage";

export interface MarketDataResponse {
  quote: ForexQuote | null;
  candles: DailyCandle[];
  error?: string;
  fromCache?: boolean;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") || "EURUSD";
  const includeCandles = searchParams.get("candles") !== "false";

  // Map composite symbol like "EURUSD" → from="EUR", to="USD"
  // Alpha Vantage uses separate from_currency/to_currency params
  let fromCurrency: string;
  let toCurrency: string;

  if (symbol.length === 6) {
    fromCurrency = symbol.slice(0, 3);
    toCurrency = symbol.slice(3, 6);
  } else if (symbol.includes("/")) {
    [fromCurrency, toCurrency] = symbol.split("/");
  } else {
    return NextResponse.json(
      { error: "Invalid symbol format. Use 'EURUSD' or 'EUR/USD'." },
      { status: 400 }
    );
  }

  try {
    // Fetch quote and candles in parallel (2 API calls — within free tier limits)
    const [quote, candles] = await Promise.all([
      fetchForexQuote(fromCurrency, toCurrency).catch((err) => {
        console.warn(`Quote fetch failed for ${symbol}:`, (err as Error).message);
        return null;
      }),
      includeCandles
        ? fetchDailyCandles(fromCurrency, toCurrency).catch((err) => {
            console.warn(`Candle fetch failed for ${symbol}:`, (err as Error).message);
            return [] as DailyCandle[];
          })
        : ([] as DailyCandle[]),
    ]);

    return NextResponse.json<MarketDataResponse>({
      quote,
      candles,
    });
  } catch (error) {
    console.error(`Market data fetch failed for ${symbol}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch market data", quote: null, candles: [] },
      { status: 500 }
    );
  }
}
