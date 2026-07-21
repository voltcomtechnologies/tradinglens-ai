import { describe, it, expect, beforeEach } from "vitest";
import {
  parseForexRss,
  filterForPair,
  _resetForexNewsCache,
} from "@/lib/rss/forex-news";

beforeEach(() => {
  _resetForexNewsCache();
});

describe("parseForexRss", () => {
  it("extracts titles, links, and pubDates from a typical RSS 2.0 feed", () => {
    const xml = `<?xml version="1.0"?>
      <rss version="2.0"><channel>
        <title>Forex News</title>
        <item>
          <title>EUR/USD Rallies on ECB Comments</title>
          <link>https://example.com/eur-usd-rallies</link>
          <pubDate>Mon, 21 Jul 2025 12:00:00 GMT</pubDate>
        </item>
        <item>
          <title>Gold Eyes $2,400 Resistance</title>
          <link>https://example.com/gold-2400</link>
          <pubDate>Mon, 21 Jul 2025 11:30:00 GMT</pubDate>
        </item>
      </channel></rss>`;
    const items = parseForexRss(xml);
    expect(items).toHaveLength(2);
    expect(items[0].title).toBe("EUR/USD Rallies on ECB Comments");
    expect(items[0].link).toBe("https://example.com/eur-usd-rallies");
    expect(items[0].pubDate).toMatch(/^2025-07-21T12:00:00/);
    expect(items[1].title).toBe("Gold Eyes $2,400 Resistance");
  });

  it("decodes common HTML entities and strips CDATA wrappers", () => {
    const xml = `<rss><channel>
      <item>
        <title><![CDATA[GBP/JPY &amp; USD/JPY — Daily Outlook]]></title>
        <link>https://x.com/daily</link>
      </item>
    </channel></rss>`;
    const items = parseForexRss(xml);
    expect(items[0].title).toBe("GBP/JPY & USD/JPY — Daily Outlook");
  });

  it("skips items without a title even if other fields exist", () => {
    const xml = `<rss><channel>
      <item><link>https://x.com/no-title</link></item>
      <item>
        <title>Valid Item</title>
        <link>https://x.com/valid</link>
      </item>
    </channel></rss>`;
    const items = parseForexRss(xml);
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("Valid Item");
  });

  it("caps extraction at 50 items", () => {
    const xml = `<rss><channel>${Array.from({ length: 60 })
      .map(
        (_, i) =>
          `<item><title>Item ${i}</title><link>https://x.com/${i}</link></item>`,
      )
      .join("")}</channel></rss>`;
    const items = parseForexRss(xml);
    expect(items).toHaveLength(50);
  });
});

describe("filterForPair", () => {
  const items: { title: string; link: string; pubDate: string | null }[] = [
    { title: "EUR/USD pushes higher after PMI", link: "x", pubDate: null },
    { title: "GBP/USD range-bound", link: "x", pubDate: null },
    { title: "Dollar index slips as yields ease", link: "x", pubDate: null },
    { title: "EUR/USD JPY cross-flows", link: "x", pubDate: null },
    { title: "ECB rate decision looms", link: "x", pubDate: null },
  ];

  it("matches EUR/USD headlines containing the base OR quote code", () => {
    const filtered = filterForPair(items, "EURUSD");
    expect(filtered.map((i) => i.title)).toEqual([
      "EUR/USD pushes higher after PMI",
      "GBP/USD range-bound",
      "EUR/USD JPY cross-flows",
    ]);
  });

  it("returns all items when the symbol is malformed", () => {
    const filtered = filterForPair(items, "X");
    expect(filtered).toEqual(items);
  });

  it("matches gold as a special 3-letter code", () => {
    const goldItems = [
      { title: "XAU/USD holds above 2400", link: "x", pubDate: null },
      { title: "Stocks slip, dollar firms", link: "x", pubDate: null },
    ];
    const filtered = filterForPair(goldItems, "XAUUSD");
    expect(filtered).toHaveLength(1);
  });
});
