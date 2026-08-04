import { describe, expect, it } from "vitest";
import {
  TIMEFRAME_PILLS,
  defaultTimeframeForBucket,
  displayTimeframeToBucket,
  snapToBucket,
  type DisplayTimeframe,
} from "@/lib/utils/timeframe-bucket";

// ── Pill list invariant ────────────────────────────────────────────────────

describe("TIMEFRAME_PILLS", () => {
  it("contains exactly the six documented display values, in order", () => {
    expect(TIMEFRAME_PILLS).toEqual([
      "1m",
      "5m",
      "15m",
      "1H",
      "4H",
      "1D",
    ]);
  });

  it("contains no duplicate values", () => {
    const set = new Set<DisplayTimeframe>(TIMEFRAME_PILLS);
    expect(set.size).toBe(TIMEFRAME_PILLS.length);
  });
});

// ── Display pill → persisted bucket ─────────────────────────────────────────

describe("displayTimeframeToBucket", () => {
  it("maps short-term pills (1m/5m/15m/1H) to the hourly bucket", () => {
    expect(displayTimeframeToBucket("1m")).toBe("1h");
    expect(displayTimeframeToBucket("5m")).toBe("1h");
    expect(displayTimeframeToBucket("15m")).toBe("1h");
    expect(displayTimeframeToBucket("1H")).toBe("1h");
  });

  it("maps longer-term pills (4H/1D) to the daily bucket", () => {
    expect(displayTimeframeToBucket("4H")).toBe("1d");
    expect(displayTimeframeToBucket("1D")).toBe("1d");
  });

  it("is exhaustive over TIMEFRAME_PILLS", () => {
    for (const pill of TIMEFRAME_PILLS) {
      const bucket = displayTimeframeToBucket(pill);
      expect(["1h", "1d"]).toContain(bucket);
    }
  });
});

// ── Persisted bucket → canonical default pill ──────────────────────────────

describe("defaultTimeframeForBucket", () => {
  it("returns '1H' for the hourly bucket (matches Trading Lens label)", () => {
    expect(defaultTimeframeForBucket("1h")).toBe("1H");
  });

  it("returns '1D' for the daily bucket (matches Trading Lens label)", () => {
    expect(defaultTimeframeForBucket("1d")).toBe("1D");
  });

  it("is the inverse of displayTimeframeToBucket for canonical pills", () => {
    // If the user last picked the canonical pill within a bucket, the
    // remount default should match that pill — otherwise the displayed
    // value jumps around on remount.
    expect(defaultTimeframeForBucket(displayTimeframeToBucket("1H"))).toBe("1H");
    expect(defaultTimeframeForBucket(displayTimeframeToBucket("1D"))).toBe("1D");
  });
});

// ── Round-trip property ────────────────────────────────────────────────────

describe("round-trip stability", () => {
  it("the pill list covers exactly the two persisted buckets", () => {
    // Use a Set equality so we don't accidentally pass when the mapped
    // array happens to look like the expected list (e.g. ['1h', '1h']
    // vs ['1h', '1d'] aren't distinguishable by sorted-array compare).
    const bucketsMapped = new Set<"1h" | "1d">(
      TIMEFRAME_PILLS.map(displayTimeframeToBucket),
    );
    expect(bucketsMapped).toEqual(new Set(["1h", "1d"]));
  });

  it("every pill's bucket matches the bucket's canonical default", () => {
    // The pill-driven visit doesn't round-trip the same value, but the
    // user-resolved intent (short vs long) is preserved: e.g. picking
    // '5m' on Chart Lens lands the user on Trading Lens with the
    // '1H' pill default, which is the canonical hourly default.
    const pillBuckets = new Set(TIMEFRAME_PILLS.map(displayTimeframeToBucket));
    expect(pillBuckets.size).toBe(2);
    for (const b of pillBuckets) {
      expect(TIMEFRAME_PILLS).toContain(defaultTimeframeForBucket(b));
    }
  });
});

// ── snapToBucket (cold-load re-sync) ────────────────────────────────────────

describe("snapToBucket", () => {
  it("returns input unchanged when displayed pill already matches the bucket", () => {
    // Within-bucket: "5m" is hourly-bucket, persisted is "1h" → keep "5m"
    // so React's Object.is bail-out can avoid a redundant render fan-out.
    expect(snapToBucket("5m", "1h")).toBe("5m");
    expect(snapToBucket("15m", "1h")).toBe("15m");
    expect(snapToBucket("1H", "1h")).toBe("1H");
  });

  it("snap-fallback to canonical daily when displayed pill is hourly but bucket is daily", () => {
    // Cold-load regression: hook DEFAULTS granularity="1d" runs lazy
    // initializer → displayedTf = "1D". Hydration then flips
    // granularity to whatever the persisted bucket is. If the user
    // had picked something in the hourly bucket previously but the
    // hook defaulted to daily… well actually that's unusual. The
    // strong example is the reverse below.
    expect(snapToBucket("5m", "1d")).toBe("1D");
    expect(snapToBucket("1H", "1d")).toBe("1D");
  });

  it("snap-fallback to canonical hourly when displayed pill is daily but bucket is hourly", () => {
    // The cold-load regression: lazy initializer locks displayedTf to
    // canonical for the DEFAULT bucket ("1d" → "1D"). Hydration flips
    // bucket to "1h" if localStorage has an hourly choice. This is
    // the exact case the sync effect exists to repair.
    expect(snapToBucket("1D", "1h")).toBe("1H");
    expect(snapToBucket("4H", "1h")).toBe("1H");
  });

  it("is idempotent: snap(b, defaultOf(b)) === b for any persisted bucket", () => {
    // After a single sync useEffect run, the next run is a no-op.
    // This is the invariant that lets the useEffect fire on every
    // granularity change without producing repeated renders.
    expect(snapToBucket("1H", "1h")).toBe("1H");
    expect(snapToBucket("1D", "1d")).toBe("1D");
  });

  it("preserves the user's finer choice within the same bucket", () => {
    // The user picks "5m" — we set granularity to "1h" but keep
    // displayedTf as "5m". On a subsequent bucket flip (e.g. user
    // picks "4H"), the snap brings the display back to canonical
    // for the NEW bucket — within-bucket preservation is internal to
    // the user's own clicks, not something snapToBucket promises
    // across bucket flips.
    //
    // Within the SAME bucket, snap returns input unchanged.
    expect(snapToBucket("5m", "1h")).toBe("5m");
    expect(snapToBucket("15m", "1h")).toBe("15m");
  });
});
