import { describe, it, expect } from "vitest";
import { buildStaticNarratorFallback } from "@/lib/narration/static-fallback";

describe("buildStaticNarratorFallback", () => {
  it("mentions the pair name verbatim", () => {
    const out = buildStaticNarratorFallback("GBPUSD", "1d");
    expect(out).toContain("GBPUSD");
    expect(out).not.toContain("EURUSD");
  });

  it("uppercases the timeframe label for user-facing copy", () => {
    expect(buildStaticNarratorFallback("EURUSD", "1h")).toContain("1H");
    expect(buildStaticNarratorFallback("EURUSD", "4h")).toContain("4H");
    expect(buildStaticNarratorFallback("USDJPY", "1d")).toContain("1D");
  });

  it("falls back to safe defaults when called without arguments", () => {
    const out = buildStaticNarratorFallback();
    // No `undefined` / `null` / `NaN` literal should leak into the copy.
    expect(out).not.toMatch(/undefined|null|NaN/);
    expect(out).toContain("EURUSD");
    expect(out).toContain("1H");
  });

  it("stays under the 600-char budget the narrator system prompt caps at", () => {
    // Hard cap from `NARRATOR_SYSTEM_PROMPT`: "Keep your reply under 600
    // characters". We test the typical case stays well under the cap
    // and the defensive truncation path stays under it even if a
    // future edit inflates the line.
    expect(buildStaticNarratorFallback().length).toBeLessThanOrEqual(600);
    expect(
      buildStaticNarratorFallback("XAUAUD", "1m").length,
    ).toBeLessThanOrEqual(600);
  });

  it("contains actionable trader guidance (high / low break watch)", () => {
    // Sanity check on the content shape: the fallback should give the
    // user something TO DO while the LLM retries, not just an apology.
    const out = buildStaticNarratorFallback();
    expect(out).toMatch(/swing high/i);
    expect(out).toMatch(/swing low/i);
  });

  it("ends with a single sentence-style period (TTS reads cleanly)", () => {
    const out = buildStaticNarratorFallback();
    // TTS reads this verbatim; no trailing whitespace, no ellipsis on
    // the typical case (the truncation guard only fires for inflated
    // text).
    expect(out.endsWith(".") || out.endsWith("\u2026")).toBe(true);
    expect(out).not.toMatch(/\s+$/);
  });
});
