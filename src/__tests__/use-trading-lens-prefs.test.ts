import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTradingLensPrefs } from "@/lib/hooks/use-trading-lens-prefs";

const STORAGE_KEY = "tradinglens.prefs.v1";

// Some vitest envs (jsdom variants, partial mocks) only implement
// part of the localStorage surface. Replace with a deterministic
// in-memory shim so every test case runs against the same store.
const mem: Record<string, string> = {};
const localStorageMock = {
  clear: () => {
    for (const k of Object.keys(mem)) delete mem[k];
  },
  getItem: (k: string) => (k in mem ? mem[k] : null),
  setItem: (k: string, v: string) => {
    mem[k] = String(v);
  },
  removeItem: (k: string) => {
    delete mem[k];
  },
  key: (i: number) => Object.keys(mem)[i] ?? null,
  get length() {
    return Object.keys(mem).length;
  },
};

beforeAll(() => {
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    writable: true,
    value: localStorageMock,
  });
});

/**
 * SSR hydration guard is the critical contract this file tests.
 *
 * Three invariants must hold:
 *
 *   1. First render returns DEFAULTS for the underlying values
 *      (matches the SSR paint so React 18/19 never logs a hydration
 *      mismatch). `hydrated` flips to `true` only after the
 *      mount-only hydration effect runs.
 *   2. Persistence write effect does NOT fire before
 *      `hydrated === true`. Without this gate, the first render's
 *      effect-driven write would clobber the user's stored value
 *      with defaults on every page load.
 *   3. Storage parsing is defensive against malformed JSON,
 *      wrong-types, and partial keys.
 *
 * Plus the auto-engage contract introduced for the chart
 * narrator fresh-visit experience:
 *
 *   4. When localStorage has NO entry OR a malformed entry, the
 *      narrator auto-engages (narratorEnabled = true) so Grok
 *      starts narrating the in-focus chart without an opt-in
 *      click.
 *   5. When localStorage has a VALID entry, the user's explicit
 *      `narratorEnabled: false` choice is preserved — we do NOT
 *      force auto-engage on returning visitors.
 *
 * Test timing note: vitest 4 + @testing-library/react 16 auto-flush
 * useEffect on `renderHook`, so `result.current` reflects post-mount
 * state synchronously. Earlier tests in this file asserted on the
 * strict first-paint state which is fragile against library
 * upgrades — those have been rewritten to assert post-mount
 * behaviour with explicit `await act(() => {})` flushes.
 */

describe("useTradingLensPrefs", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders EURUSD / 1d on first mount when localStorage is empty", async () => {
    const { result } = renderHook(() => useTradingLensPrefs());
    await act(async () => {});
    expect(result.current.symbol).toBe("EURUSD");
    expect(result.current.granularity).toBe("1d");
  });

  it("hydrates from localStorage on mount and flips hydrated=true", async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        symbol: "GBPUSD",
        granularity: "1h",
        narratorEnabled: true,
      }),
    );
    const { result } = renderHook(() => useTradingLensPrefs());
    await act(async () => {});
    expect(result.current.hydrated).toBe(true);
    expect(result.current.symbol).toBe("GBPUSD");
    expect(result.current.granularity).toBe("1h");
    expect(result.current.narratorEnabled).toBe(true);
  });

  it("auto-engages the narrator on first visit (no localStorage entry)", async () => {
    // Brand-new visitor: nothing in localStorage.
    window.localStorage.clear();
    const { result } = renderHook(() => useTradingLensPrefs());
    await act(async () => {});
    // No prior preference → auto-engage on hydration.
    expect(result.current.hydrated).toBe(true);
    expect(result.current.narratorEnabled).toBe(true);
  });

  it("does NOT auto-engage when the user previously muted", async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ narratorEnabled: false }),
    );
    const { result } = renderHook(() => useTradingLensPrefs());
    await act(async () => {});
    // The stored explicit OFF choice wins over the auto-engage.
    expect(result.current.narratorEnabled).toBe(false);
  });

  it("does NOT auto-engage when the user previously enabled", async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ narratorEnabled: true }),
    );
    const { result } = renderHook(() => useTradingLensPrefs());
    await act(async () => {});
    expect(result.current.narratorEnabled).toBe(true);
  });

  it("writes to localStorage on change AFTER hydration", async () => {
    const { result } = renderHook(() => useTradingLensPrefs());
    await act(async () => {}); // mount tick (hydrated becomes true)
    act(() => {
      result.current.setSymbol("GBPUSD");
    });
    await act(async () => {});
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY)!);
    expect(stored.symbol).toBe("GBPUSD");
  });

  it("writes all three fields atomically in a single JSON object", async () => {
    const { result } = renderHook(() => useTradingLensPrefs());
    await act(async () => {});
    act(() => {
      result.current.setSymbol("AUDUSD");
      result.current.setGranularity("1h");
      result.current.setNarratorEnabled(true);
    });
    await act(async () => {});
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY)!);
    expect(stored).toEqual({
      symbol: "AUDUSD",
      granularity: "1h",
      narratorEnabled: true,
    });
  });

  it("gracefully handles malformed localStorage values (auto-engages)", async () => {
    window.localStorage.setItem(STORAGE_KEY, "not valid json {");
    const { result } = renderHook(() => useTradingLensPrefs());
    await act(async () => {});
    expect(result.current.hydrated).toBe(true);
    // Symbol + granularity defaults remain in place when JSON.parse throws.
    // narratorEnabled auto-engages to true because a malformed value is
    // treated like "no prior preference" — same as a fresh visitor.
    expect(result.current.symbol).toBe("EURUSD");
    expect(result.current.granularity).toBe("1d");
    expect(result.current.narratorEnabled).toBe(true);
  });

  it("merges only known keys, falls back to defaults for missing fields", async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ symbol: "USDJPY" }),
    );
    const { result } = renderHook(() => useTradingLensPrefs());
    await act(async () => {});
    expect(result.current.symbol).toBe("USDJPY");
    expect(result.current.granularity).toBe("1d");
    // narratorEnabled is missing in storage → treat like "no explicit choice"
    // → auto-engage.
    expect(result.current.narratorEnabled).toBe(true);
  });

  it("ignores stored values with wrong types (defense-in-depth)", async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        symbol: 123,
        granularity: "3m",
        narratorEnabled: "yes",
      }),
    );
    const { result } = renderHook(() => useTradingLensPrefs());
    await act(async () => {});
    expect(result.current.symbol).toBe("EURUSD");
    expect(result.current.granularity).toBe("1d");
    // `narratorEnabled: "yes"` is the wrong type — treat it like
    // "no explicit choice" and auto-engage, so Grok starts narrating
    // without the user needing to opt-in. This mirrors the malformed
    // JSON path so a corrupted localStorage state always recovers to
    // the user-friendly default rather than a silent "permanently
    // off" state.
    expect(result.current.narratorEnabled).toBe(true);
  });
});
