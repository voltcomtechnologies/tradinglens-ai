import { test, expect } from "@playwright/test";

import { loginInContext } from "../fixtures/auth";
import { SEEDED_MARKET_DATA_RESPONSE } from "../fixtures/market/seed";

/**
 * Visual snapshot guard for the /lens/trading LIVE CHART surface at desktop
 * 1280×720 viewport.
 *
 * Purpose: catch regressions on the new `LiveChart` component (canvas
 * rendering, chrome parity with the camera scanner, pair/timeframe pills,
 * fullscreen toggle, live status badge). The narrow-viewport spec
 * (`trading-lens-narrow.spec.ts`) covers the *header / scanner balance* at
 * 375×667; this one covers the *chart + status panel* at desktop width
 * where the live canvas is the visual anchor.
 *
 * Snapshot stability recipe:
 *   - 1280×720 viewport with `deviceScaleFactor: 1` (set in
 *     `playwright.config.ts`'s `desktop-1280` project — leaving Playwright's
 *     per-host default DPI shifts canvas pixels every machine and breaks the
 *     `maxDiffPixelRatio` threshold).
 *   - `reducedMotion: "reduce"` (already globally set in playwright.config.ts).
 *   - `/api/market/data` is intercepted via `page.route` and short-circuited
 *     with `SEEDED_MARKET_DATA_RESPONSE` from `e2e/fixtures/market/seed.ts` —
 *     a fixed 100-row EUR/USD timeline anchored to 2024-06-19, so the chart
 *     paints the same canvas regardless of today's date OR Alpha Vantage's
 *     free-tier rate-limit (which would otherwise vary candle counts).
 *   - Socket.IO server (`ws://*:3001/*`) is aborted so the hook takes the
 *     polling fallback path instead of folding live ticks — the polling
 *     timer is short-circuited by the same prefetched seed response so the
 *     chart paints exactly once, no in-flight updates after the snapshot.
 *   - `page.waitForFunction` blocks until the lightweight-charts canvas has
 *     non-zero width AND height — Chromium can paint `canvas.width === 0`
 *     in some ResizeObserver race windows and a screenshot then commits an
 *     empty chart.
 *   - `page.addStyleTag` snaps all CSS animations and framer-motion
 *     `initial → animate` transitions to their end state (same recipe as
 *     `trading-lens-narrow.spec.ts`).
 *   - `animations: "disabled"` on the screenshot itself disables finite
 *     animations and freezes infinite ones.
 *   - `maxDiffPixelRatio: 0.005` — tight enough that real layout regressions
 *     still fail; loose enough to absorb font-hinting drift across hosts.
 *     Bump ONLY when intentionally changing layout, then regenerate with
 *     `pnpm test:e2e:update`.
 *
 * Auth flow: `loginInContext(context, baseURL)` in `beforeEach` so the
 * credentials login happens on the SAME BrowserContext that the spec
 * runs in. (See e2e/fixtures/auth.ts for the rationale — Playwright's
 * `test.use({ storageState })` race on file timing was the trigger.)
 *
 * Update baselines with `pnpm test:e2e:update` after an intentional
 * visual change. Baselines live next to this file under
 * `e2e/tests/trading-lens-live-chart.spec.ts-snapshots/`.
 */

// Routes under test. Add new ones here if you want them snapshotted too.
const ROUTES = [
  { path: "/lens/trading", name: "lens-trading-live-chart" },
] as const;

test.describe("Trading Lens – live chart desktop snapshot", () => {
  test.beforeEach(async ({ context, page, baseURL }) => {
    await loginInContext(context, baseURL!);

    // Belt-and-braces: re-assert the viewport in case a future default
    // changes. `deviceScaleFactor` is set in `playwright.config.ts` and
    // intentionally NOT re-asserted here — touch only if you know why.
    await page.setViewportSize({ width: 1280, height: 720 });

    // Abort the Socket.IO server so the hook runs in polling-fallback mode
    // and the chart paints from the seeded fixture only.
    await page.route(/ws:\/\/[^/]+:3001.*/, (route) => route.abort());

    // Pin the seed data: 100 candles, deterministic, EUR/USD.
    await page.route("**/api/market/data**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(SEEDED_MARKET_DATA_RESPONSE),
      }),
    );
  });

  for (const route of ROUTES) {
    test(`${route.path} @ 1280px`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: "domcontentloaded" });

      // 1. Live-chart card is in the DOM.
      // (Earlier drafts used `.or(role-name, data-testid)` which Playwright
      //  resolves as "any matching element" — under strict mode that
      //  resolves to 2 elements (heading + container) and the test bails
      //  before the screenshot. We pick the data-testid because the canvas-
      //  paint gate immediately after this is also keyed off the testid.)
      await expect(page.getByTestId("live-chart-container")).toBeVisible({
        timeout: 15_000,
      });

      // 2. lightweight-charts canvas actually has paint dimensions.
      //    Chromium occasionally settles to canvas.width === 0 in a
      //    ResizeObserver race; this gate ensures we only screenshot a
      //    chart that has rendered at least one painting frame.
      //    We intentionally do NOT call `waitForLoadState("networkidle")`:
      //    Socket.IO's polling-transport fallback keeps retrying after the
      //    WS abort, so "network idle" is never reached. The canvas-paint
      //    wait below is the deterministic signal that the chart mounted.
      await page.waitForFunction(
        () => {
          const c = document.querySelector<HTMLCanvasElement>(
            '[data-testid="live-chart-container"] canvas',
          );
          return !!c && c.width > 0 && c.height > 0;
        },
        undefined,
        { timeout: 10_000 },
      );

      // 3. Hard-snap animations + transitions (mirrors the narrow spec's
      //    recipe — comment there has the rationale).
      await page.addStyleTag({
        content: `
          *, *::before, *::after {
            animation-duration: 0s !important;
            animation-delay: 0s !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0s !important;
            transition-delay: 0s !important;
            caret-color: transparent !important;
          }
        `,
      });

      await expect(page).toHaveScreenshot(
        `trading-lens-live-chart-${route.name}.png`,
        {
          fullPage: true,
          animations: "disabled",
          maxDiffPixelRatio: 0.005,
        },
      );
    });
  }
});
