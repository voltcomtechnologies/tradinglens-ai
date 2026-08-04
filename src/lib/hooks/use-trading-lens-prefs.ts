import { useCallback, useEffect, useState } from "react";
import type { Granularity } from "@/app/api/market/data/route";

/**
 * useTradingLensPrefs — persist the user's last-selected symbol,
 * timeframe, and Narrator-enabled boolean in `localStorage` so a
 * page refresh resumes the previous session.
 *
 * SSR-safety contract (the small hydration guard referenced in
 * the file header):
 *
 *   - First render returns DEFAULTS. Static const DEFAULTS ensure
 *     the FIRST render is deterministic between server- and
 *     client-side, so React 18 + Next.js never logs a hydration
 *     mismatch warning when the persisted value diverges from the
 *     default.
 *   - A mount-only `useEffect(() => {...}, [])` reads
 *     `window.localStorage` once, parses the JSON, merges it into
 *     state, then sets `hydrated = true`. After this single tick
 *     callers can read the persisted values via the returned
 *     fields. LiveChart gates a re-mount on the flag so the swap
 *     from default to persisted happens explicitly.
 *   - The persistence write `useEffect` runs ONLY after
 *     `hydrated === true`, so the brief first-paint window does
 *     NOT clobber the user's stored value with defaults. Without
 *     this gate, the first render's effect-driven write would race
 *     with the hydration read and overwrite real stored data with
 *     `"EURUSD" / "1d" / false` on every page load.
 *
 * Storage shape: a single JSON object under `tradinglens.prefs.v1`
 * with `{ symbol, granularity, narratorEnabled }`. Atomic updates
 * mean we never end up with a half-written value if two tabs race
 * (last-write-wins is acceptable; both produce valid persisted
 * state). Versioned key (`.v1`) so a future migration can read
 * `v1` once and write `v2` without colliding.
 *
 * Multi-tab: we do NOT subscribe to the `storage` event because
 * the chart-lens page already re-fetches SSE/RSC on focus; a
 * slightly stale value from another tab is fine.
 *
 * Quota: writes are wrapped in try/catch. Private-mode browsers
 * and quota-exceeded scenarios fall through silently — defaults
 * are already in place.
 */

export interface TradingLensPrefs {
  symbol: string;
  granularity: Granularity;
  narratorEnabled: boolean;
}

const STORAGE_KEY = "tradinglens.prefs.v1";
// Narrator defaults to ON so fresh visitors land on the trading-lens
// page and hear Grok narrate the in-focus chart without an opt-in
// click. Returning users keep whatever preference they last persisted
// in localStorage — if the user explicitly muted, the muted state wins
// on subsequent visits. This keeps SSR first-paint deterministic (still
// "false" on the first render to avoid hydration mismatches; the
// post-hydration effect below flips new users to "true").
const DEFAULTS: TradingLensPrefs = {
  symbol: "EURUSD",
  granularity: "1d",
  narratorEnabled: false,
};

export function useTradingLensPrefs(): {
  hydrated: boolean;
  symbol: string;
  granularity: Granularity;
  narratorEnabled: boolean;
  setSymbol: (symbol: string) => void;
  setGranularity: (granularity: Granularity) => void;
  setNarratorEnabled: (enabled: boolean) => void;
} {
  const [prefs, setPrefs] = useState<TradingLensPrefs>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);

  // Mount-only hydration. Reads localStorage and merges any
  // persisted keys into state, then flips the hydrated flag so
  // the persistence effect and any render-gated re-mounts can
  // fire AFTER this single tick.
  useEffect(() => {
    let narratorChoicePresent = false;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<TradingLensPrefs>;
        // Track whether the user gave an explicit narrator choice. We
        // use this to decide whether to auto-engage below — an explicit
        // `false` MUST win (returning visitor who muted), but a missing
        // or malformed value should auto-engage.
        narratorChoicePresent = typeof parsed.narratorEnabled === "boolean";
        // Merge only the keys we recognise; unknown keys from a
        // future schema are silently dropped so a v1 reader never
        // chokes on a v2 entry.
        setPrefs((prev) => ({
          symbol: typeof parsed.symbol === "string" ? parsed.symbol : prev.symbol,
          granularity:
            parsed.granularity === "1h" || parsed.granularity === "1d"
              ? parsed.granularity
              : prev.granularity,
          narratorEnabled:
            typeof parsed.narratorEnabled === "boolean"
              ? parsed.narratorEnabled
              : prev.narratorEnabled,
        }));
      }
    } catch {
      // localStorage unavailable (private mode, file://) OR a
      // malformed value from an older schema. Defaults are
      // already in place — fall through. `narratorChoicePresent`
      // stays `false` so the auto-engage below fires.
    }
    // Auto-engage expand: if there's no EXPLICIT narrator preference
    // recorded (i.e. this is a fresh visitor, a returning user who
    // wiped storage, OR a JSON parser crash), flip the narrator on
    // so Grok starts narrating the in-focus chart without requiring
    // an opt-in click. SSR/CSR painting still matches because the
    // first render returns `false` from DEFAULTS.
    //
    // Cases this auto-engage covers:
    //   - empty localStorage (fresh visitor)
    //   - JSON parses but `narratorEnabled` field is missing
    //   - JSON parses but `narratorEnabled` has the wrong type
    //   - JSON.parse throws (malformed storage value)
    //
    // Cases this auto-engage does NOT cover (returning visitors
    // with an explicit choice win):
    //   - localStorage has `narratorEnabled: true` (already on)
    //   - localStorage has `narratorEnabled: false` (explicitly muted)
    if (!narratorChoicePresent) {
      setPrefs((prev) =>
        prev.narratorEnabled === false
          ? { ...prev, narratorEnabled: true }
          : prev,
      );
    }
    setHydrated(true);
  }, []);

  // Persist on change, but ONLY after hydration. Without the gate,
  // the first-render effect would race the hydration read and
  // clobber the user's stored value with defaults.
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // Quota or private-mode.
    }
  }, [prefs, hydrated]);

  const setSymbol = useCallback((symbol: string) => {
    setPrefs((p) => ({ ...p, symbol }));
  }, []);
  const setGranularity = useCallback((granularity: Granularity) => {
    setPrefs((p) => ({ ...p, granularity }));
  }, []);
  const setNarratorEnabled = useCallback((narratorEnabled: boolean) => {
    setPrefs((p) => ({ ...p, narratorEnabled }));
  }, []);

  return {
    hydrated,
    symbol: prefs.symbol,
    granularity: prefs.granularity,
    narratorEnabled: prefs.narratorEnabled,
    setSymbol,
    setGranularity,
    setNarratorEnabled,
  };
}
