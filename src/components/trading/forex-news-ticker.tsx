"use client";

/**
 * ForexNewsTicker — bottom-bar mirror of `src/components/landing/forex-ticker.tsx`
 * but for headlines. Renders a single-row infinite-scrolling marquee of
 * forex news titles pulled from `/api/forex-news`. The CSS animation
 * `animate-ticker-scroll` is defined in `src/app/globals.css:220`.
 *
 * Behavior:
 *   - On mount and on `pair` change, fetches `/api/forex-news?pair=<pair>`
 *   - Duplicates the headline list (for seamless loop wrap)
 *   - Pauses on hover / focus so users can read without losing their place
 *   - Honors `prefers-reduced-motion`
 *   - On error: shows a quiet "Live feed unavailable" pill instead of an error stack
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Newspaper, ExternalLink, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ForexNewsItem } from "@/lib/rss/forex-news";

interface ForexNewsTickerProps {
  /** Optional pair filter on the upstream API. `null` = all pairs. */
  pair?: string | null;
  className?: string;
}

interface ApiBody {
  items: ForexNewsItem[];
  pair: string | null;
  source: string;
  cachedAt: string;
}

export function ForexNewsTicker({ pair = null, className }: ForexNewsTickerProps) {
  const [items, setItems] = useState<ForexNewsItem[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReduced, setPrefersReduced] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const didFetch = useRef<string>(pair ?? "__all__");

  // Fetch headlines when the in-focus pair changes.
  useEffect(() => {
    const cacheKey = pair ?? "__all__";
    if (didFetch.current === cacheKey && status === "ok") return;
    didFetch.current = cacheKey;

    let cancelled = false;
    setStatus("loading");
    const url = pair ? `/api/forex-news?pair=${encodeURIComponent(pair)}` : "/api/forex-news";
    fetch(url, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) {
          setStatus("error");
          return [];
        }
        const data: ApiBody = await r.json();
        if (cancelled) return [];
        setItems(data.items ?? []);
        setStatus("ok");
        return data.items ?? [];
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [pair, status]);

  // Detect reduced motion preference.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mql.matches);
    const onChange = () => setPrefersReduced(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  // Duplicate list for seamless wrap.
  const duplicated = useMemo(() => [...items, ...items], [items]);
  const running = !isPaused && !prefersReduced && items.length > 0;

  // Accessible summary.
  const ariaSummary = `Forex news ticker for ${pair ?? "all pairs"} — ${items.length} headlines`;

  return (
    <div
      role="region"
      aria-label={ariaSummary}
      data-testid="forex-news-ticker"
      data-pair={pair ?? "all"}
      className={cn(
        "relative w-full overflow-hidden border-y border-primary/15 bg-card/40 backdrop-blur-sm",
        className,
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
    >
      {/* Brand chip on the left */}
      <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center gap-1.5 px-3 bg-gradient-to-r from-background via-background/90 to-transparent">
        <Newspaper className="h-3.5 w-3.5 text-primary" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
          Forex News
        </span>
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            status === "ok" && "bg-emerald-400 animate-pulse",
            status === "loading" && "bg-amber-400",
            status === "error" && "bg-red-400",
            status === "idle" && "bg-muted-foreground",
          )}
        />
      </div>

      {/* Fade right edge so the wrap is invisible */}
      <div className="absolute right-0 top-0 bottom-0 z-10 w-16 bg-gradient-to-l from-background to-transparent pointer-events-none" />

      {/* Pause/play button on the right */}
      {items.length > 0 && (
        <button
          type="button"
          aria-pressed={isPaused}
          aria-label={isPaused ? "Resume ticker" : "Pause ticker"}
          onClick={() => setIsPaused((p) => !p)}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-1 rounded text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-colors"
        >
          {isPaused ? (
            <Play className="h-3.5 w-3.5" />
          ) : (
            <Pause className="h-3.5 w-3.5" />
          )}
        </button>
      )}

      {status === "error" ? (
        <div className="px-3 py-2 pl-24 text-[11px] text-muted-foreground">
          Live feed unavailable.{" "}
          <a
            href="https://www.dailyfx.com/forex-rss-news"
            target="_blank"
            rel="noreferrer"
            className="text-primary underline-offset-2 hover:underline"
          >
            View source
          </a>
        </div>
      ) : items.length === 0 ? (
        <div className="px-3 py-2 pl-24 text-[11px] text-muted-foreground">
          {status === "loading" ? "Loading Forex News…" : "No headlines for this pair yet."}
        </div>
      ) : (
        <div className="flex items-center py-2 pl-24 pr-12" aria-hidden="true">
          <div
            className={cn("flex items-center gap-0", running && "animate-ticker-scroll")}
            style={{ animationPlayState: running ? "running" : "paused" }}
          >
            {duplicated.map((it, i) => (
              <HeadlineChip key={`${it.link || it.title}-${i}`} item={it} />
            ))}
          </div>
        </div>
      )}

      {/* Hidden accessible transcript for screen readers */}
      <span className="sr-only">
        {items.length > 0
          ? `${items.length} headlines. Most recent: ${items[0]?.title}.`
          : "No headlines available right now."}
      </span>
    </div>
  );
}

function HeadlineChip({ item }: { item: ForexNewsItem }) {
  const inner = (
    <span className="flex items-center gap-2 px-4 py-1.5 shrink-0 border-r border-primary/10">
      <span className="text-xs font-medium text-foreground/95 whitespace-nowrap">
        {item.title}
      </span>
      {item.link ? (
        <ExternalLink className="h-3 w-3 text-muted-foreground" />
      ) : null}
    </span>
  );
  if (item.link) {
    return (
      <a
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        // Mark with an inline indicator that screen readers can use
        // to announce this as "external headline link" alongside the
        // visible ExternalLink icon.
        className="hover:bg-primary/5 transition-colors"
      >
        {inner}
      </a>
    );
  }
  return inner;
}
