import { NextRequest, NextResponse } from "next/server";
import {
  fetchForexNews,
  filterForPair,
  type ForexNewsItem,
} from "@/lib/rss/forex-news";

// Next.js Data Cache — re-exported so the route's upstream fetch is cached
// at the CDN/edge for 5 minutes across server restarts. Combined with the
// in-process module-scope cache in `forex-news.ts`, we get cache-within-cache.
export const revalidate = 300;

interface ForexNewsResponseBody {
  items: ForexNewsItem[];
  pair: string | null;
  source: string;
  cachedAt: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pair = searchParams.get("pair");
    const all = await fetchForexNews();
    const items = pair ? filterForPair(all, pair) : all;
    const body: ForexNewsResponseBody = {
      items,
      pair: pair ?? null,
      source: "dailyfx",
      cachedAt: new Date().toISOString(),
    };
    return NextResponse.json(body, {
      headers: {
        // Encourage shared CDN caching: even if the in-process cache is
        // cold, downstream caches can serve repeats for ~60s within a 5-min
        // upstream TTL. Important on shared Vercel/edge.
        "cache-control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "forex-news fetch failed";
    return NextResponse.json({ error: message, items: [] }, { status: 502 });
  }
}
