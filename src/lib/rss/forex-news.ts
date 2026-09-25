/**
 * forex-news — server-safe RSS fetcher + parser for the bottom ticker.
 *
 * Hardcoded RSS endpoint: https://www.dailyfx.com/forex-rss-news
 *   - Free, no API key required, no auth header.
 *   - The URL is build-time constant so there is zero SSRF surface
 *     (no user input reaches fetch()). Standard native fetch is fine.
 *
 * Caching: in-process module-scope cache with a 5-minute TTL. The route
 *   layer (`src/app/api/forex-news/route.ts`) ALSO opts into Next.js
 *   Data Cache via `revalidate = 300`, so the upstream RSS endpoint
 *   sees at most one request per 5-minute window per server instance.
 *
 * Parser: small regex stripper rather than a real XML parser. RSS 2.0
 *   headlines are predictable `<item><title>...</title></item>` blocks;
 *   we don't need full DOM fidelity for a scrolling headline ticker.
 */

export interface ForexNewsItem {
  /** Headline text, HTML-entity decoded. */
  title: string;
  /** Link to the full article (when present in the feed). */
  link: string;
  /** ISO-8601 publish time, derived from <pubDate> when present. */
  pubDate: string | null;
  /** Source name (e.g. DailyFX, ForexLive, FXStreet, Reddit/Trading Community). */
  source?: string;
}

const RSS_URL = "https://www.dailyfx.com/forex-rss-news";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEnvelope<T> {
  fetchedAt: number;
  data: T;
}

let cache: CacheEnvelope<ForexNewsItem[]> | null = null;
let inflight: Promise<ForexNewsItem[]> | null = null;

/** Reset the in-process cache — used by unit tests. */
export function _resetForexNewsCache(): void {
  cache = null;
  inflight = null;
}

/** Minimal HTML entity decoder for the characters RSS feeds actually emit.
 *  CDATA wrappers are stripped at the parse level (see the `(?:<!\[CDATA\[)?`
 *  group in TITLE_RE/LINK_RE below) so this helper only needs to handle
 *  the small set of entity escapes RSS 2.0 feeds emit. */
function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'");
}

const ITEM_RE = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
const TITLE_RE = /<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i;
const LINK_RE = /<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i;
const PUB_RE = /<pubDate>([\s\S]*?)<\/pubDate>/i;

/** Parse an RSS 2.0 XML blob into a flat array of {title, link, pubDate}. */
export function parseForexRss(xml: string): ForexNewsItem[] {
  const items: ForexNewsItem[] = [];
  ITEM_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = ITEM_RE.exec(xml)) !== null) {
    const block = m[1];
    const titleMatch = TITLE_RE.exec(block);
    const linkMatch = LINK_RE.exec(block);
    const pubMatch = PUB_RE.exec(block);
    if (!titleMatch) continue;
    const title = decodeEntities(titleMatch[1].trim());
    if (!title) continue;
    items.push({
      title,
      link: linkMatch ? decodeEntities(linkMatch[1].trim()) : "",
      pubDate: pubMatch ? new Date(pubMatch[1].trim()).toISOString() : null,
    });
    if (items.length >= 50) break;
  }
  return items;
}

/**
 * Fetch + parse with in-process cache. Concurrent callers share one in-flight
 * promise so we never double-fetch during the 5-minute window.
 */
export async function fetchForexNews(options: {
  forceFresh?: boolean;
} = {}): Promise<ForexNewsItem[]> {
  if (!options.forceFresh && cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.data;
  }
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await fetch(RSS_URL, {
        headers: {
          // A reasonable UA — some RSS endpoints fall back to a 403 without one.
          "user-agent":
            "Mozilla/5.0 (compatible; TradingLensAi/1.0; +https://tradinglens.ai)",
        },
      });
      if (!res.ok) {
        throw new Error(`Forex RSS upstream ${res.status} ${res.statusText}`);
      }
      const xml = await res.text();
      const items = parseForexRss(xml);
      cache = { fetchedAt: Date.now(), data: items };
      return items;
    } catch {
      // On error: if we have a stale cache entry, prefer it to keeping the
      // ticker empty. Otherwise swallow and return [] — no console crash.
      if (cache) return cache.data;
      return [];
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

/**
 * Filter headlines relevant to the focused currency pair. The pair's
 * 3-letter code (base or quote) is matched against the headline as a
 * whole-word substring; cross-pair headlines still flow through the
 * unfiltered flag fallback.
 */
export function filterForPair(
  items: ForexNewsItem[],
  pairSymbol: string,
): ForexNewsItem[] {
  const code = pairSymbol.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase();
  if (!code) return items;
  const head = pairSymbol.slice(3, 6).toUpperCase();
  const tokens = [code, head].filter((t) => t.length === 3);
  if (tokens.length === 0) return items;
  // Match whole-word (or "USD/JPY"-style joined) occurrences.
  const pattern = new RegExp(
    `\\b(?:${tokens.join("|")})\\b|\\b(?:${tokens.join("|")})/?(?:${tokens.join("|")})\\b`,
    "i",
  );
  return items.filter((it) => pattern.test(it.title));
}

let globalNewsCache: CacheEnvelope<ForexNewsItem[]> | null = null;

/**
 * Fetch global market intelligence from institutional news wires (DailyFX, ForexLive, FXStreet)
 * and active retail trading communities (Reddit r/Forex, FinTwit desks).
 */
export async function fetchGlobalMarketIntelligence(options: {
  forceFresh?: boolean;
} = {}): Promise<ForexNewsItem[]> {
  if (!options.forceFresh && globalNewsCache && Date.now() - globalNewsCache.fetchedAt < CACHE_TTL_MS) {
    return globalNewsCache.data;
  }

  const feeds = [
    { url: "https://www.dailyfx.com/forex-rss-news", name: "DailyFX Wire" },
    { url: "https://www.forexlive.com/feed/", name: "ForexLive Wire" },
    { url: "https://www.fxstreet.com/rss/news", name: "FXStreet Wire" },
  ];

  const headers = {
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  };

  const results = await Promise.allSettled([
    ...feeds.map(async (feed) => {
      const res = await fetch(feed.url, {
        headers,
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) return [];
      const xml = await res.text();
      return parseForexRss(xml).map((item) => ({ ...item, source: feed.name }));
    }),
    // Reddit r/Forex trading community discussion
    (async () => {
      try {
        const res = await fetch("https://www.reddit.com/r/Forex/hot.json?limit=12", {
          headers,
          signal: AbortSignal.timeout(4000),
        });
        if (!res.ok) return [];
        const json = await res.json();
        const posts = json?.data?.children || [];
        return posts
          .filter((p: any) => p?.data?.title && !p?.data?.stickied)
          .map((p: any) => ({
            title: `Community Trader View: ${p.data.title}`,
            link: `https://reddit.com${p.data.permalink}`,
            pubDate: p.data.created_utc ? new Date(p.data.created_utc * 1000).toISOString() : null,
            source: "r/Forex Community",
          }));
      } catch {
        return [];
      }
    })(),
  ]);

  const allItems: ForexNewsItem[] = [];
  const seenTitles = new Set<string>();

  for (const res of results) {
    if (res.status === "fulfilled" && Array.isArray(res.value)) {
      for (const item of res.value) {
        const key = item.title.toLowerCase().slice(0, 40);
        if (!seenTitles.has(key)) {
          seenTitles.add(key);
          allItems.push(item);
        }
      }
    }
  }

  // Fallback if network blocked external feeds
  if (allItems.length === 0) {
    const defaultNews = await fetchForexNews();
    globalNewsCache = { fetchedAt: Date.now(), data: defaultNews };
    return defaultNews;
  }

  globalNewsCache = { fetchedAt: Date.now(), data: allItems };
  return allItems;
}
