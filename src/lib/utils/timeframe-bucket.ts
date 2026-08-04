/**
 * Translation between Chart Lens's 6-way display pill vocabulary and
 * the persisted `Granularity` bucket from `useTradingLensPrefs`.
 *
 * The persistence contract is binary ("1h" | "1d") because that's all
 * the Alpha Vantage `/api/market/data` route emits today and what
 * Trading Lens renders. Chart Lens shows six pills — `1m / 5m / 15m /
 * 1H / 4H / 1D` — for finer-grained intent, so we map each display
 * value to the closest persisted bucket at the component boundary.
 *
 * Boundary-translation semantics:
 *
 *   - "1m", "5m", "15m", "1H" all read as "short-term / hourly-ish" →
 *     bucket `"1h"`. Picking any of these persists `"1h"` so visiting
 *     Trading Lens shows the "1H" pill active — the user's intent
 *     (short-term) carries over across the two products.
 *
 *   - "4H", "1D" read as "longer-term / daily-ish" → bucket `"1d"`.
 *     Picking either persists `"1d"` so Trading Lens shows "1D".
 *
 * Returning Chart Lens re-mounts with the canonical default inside
 * the persisted bucket (see `defaultTimeframeForBucket`). When the
 * user picks `5m`, `displayedTf` is held in local component state so
 * the pill stays `5m` for that visit; on remount it snaps back to
 * the canonical `1H` default for the `"1h"` bucket (this is fine
 * because the user's intent — hourly-ish — is preserved at the
 * persistence layer).
 */

import type { Granularity } from "@/app/api/market/data/route";

/** Display pill labels for the Chart Lens timeframe switcher. */
export type DisplayTimeframe = "1m" | "5m" | "15m" | "1H" | "4H" | "1D";

/**
 * Order matters here — it's the visual order on the Chart Lens pill
 * row. Exported as a constant so the pills and the translator agree
 * on the same list.
 */
export const TIMEFRAME_PILLS: readonly DisplayTimeframe[] = [
  "1m",
  "5m",
  "15m",
  "1H",
  "4H",
  "1D",
] as const;

/**
 * `1m / 5m / 15m / 1H` are all "hourly or finer" → short-term bucket.
 * `4H / 1D` are "above hourly" → daily bucket.
 *
 * Reading the user's intent (short-term vs daily) is what we want to
 * persist across products, NOT the literal pill value — Trading Lens
 * only renders `1h` or `1d`, and that's the right resolution for the
 * data the API actually serves.
 */
const SHORT_TERM_PILLS: ReadonlySet<DisplayTimeframe> = new Set([
  "1m",
  "5m",
  "15m",
  "1H",
]);

export function displayTimeframeToBucket(pill: DisplayTimeframe): Granularity {
  return SHORT_TERM_PILLS.has(pill) ? "1h" : "1d";
}

/**
 * Canonical "default" pill to render when the Chart Lens component
 * (re)mounts and the persisted bucket is read. `1h` → `1H` and
 * `1d` → `1D` — these match the labels Trading Lens uses internally
 * so cross-product behavior is mirrored, not surprising.
 */
export function defaultTimeframeForBucket(bucket: Granularity): DisplayTimeframe {
  return bucket === "1d" ? "1D" : "1H";
}

/**
 * Re-sync `displayedTf` to a stored `Granularity` bucket, but only when
 * they disagree. Used by Chart Lens in a `useEffect` keyed on
 * `granularity` so the visible pill reflects the persisted bucket after
 * a cold-load hydration (the hook's lazy initial state returns DEFAULTS,
 * so the first render's `displayedTf` may not match the persisted bucket
 * until the hydration effect runs). Within the same bucket, the locally
 * chosen finer pill survives.
 *
 * The returned value is always a valid `DisplayTimeframe`; if no snap
 * is needed, the input is returned unchanged so React can bail out on
 * `Object.is`-equal state updates.
 */
export function snapToBucket(
  displayed: DisplayTimeframe,
  persisted: Granularity,
): DisplayTimeframe {
  const currentBucket = displayTimeframeToBucket(displayed);
  return currentBucket === persisted ? displayed : defaultTimeframeForBucket(persisted);
}
