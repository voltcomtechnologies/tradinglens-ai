import { test, expect } from "@playwright/test";

import { loginInContext } from "../fixtures/auth";
import { SEEDED_MARKET_DATA_RESPONSE } from "../fixtures/market/seed";
import { STYLE_RESET_CSS } from "../fixtures/styles";

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
  // This spec guards the LIVE CHART surface at 1280×720. Running it
  // under the `mobile-375` project produces a PNG that overwrites the
  // desktop baseline under the same snapshot-name prefix — Playwright
  // strips the project name from the filename when both projects share
  // the same spec, and that bricks the next run. Skip on mobile; the
  // `trading-lens-narrow.spec.ts` spec already covers the narrow path.
  // We do the conditional-skip INSIDE beforeEach with `testInfo` fully
  // typed so the strict TypeScript setting (`noImplicitAny`,
  // `strictFunctionTypes`) is happy without `any` magic.
  test.beforeEach(async ({ context, page, baseURL }, testInfo) => {
    if (testInfo.project.name === "mobile-375") {
      test.skip(
        true,
        "Live-chart surface is desktop-only; narrow viewport coverage lives in trading-lens-narrow.spec.ts.",
      );
      return; // unreachable in practice; the skip above marks the test as skipped.
    }

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

    // Short-circuit the bottom-rail Forex news ticker so its marquee
    // content is deterministic. The route fetches daily-fx headlines
    // server-side with a 5-min in-process cache; without this intercept
    // the spec races against hour-by-hour RSS content drift and
    // toHaveScreenshot retries until its default 5s timeout fires.
    await page.route("**/api/forex-news**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [
            {
              title: "EUR/USD steady ahead of ECB minutes",
              link: "https://example.com/eur-usd-ecb",
              pubDate: "2024-09-30T16:00:00.000Z",
            },
            {
              title: "Dollar index slips as yields ease",
              link: "https://example.com/dxy-yields",
              pubDate: "2024-09-30T15:30:00.000Z",
            },
          ],
          pair: "EURUSD",
          source: "test-fixture",
          cachedAt: "2024-09-30T16:00:00.000Z",
        }),
      }),
    );

    // NOTE: we intentionally do NOT intercept /api/trading/analyze.
    // The Grok narrator hook auto-fires only when `enabled === true`,
    // which defaults to false in `ChartInsightPanel`. Since the spec
    // never clicks the "Enable" toggle, the debounced 1.2s capture
    // never runs against the route, so there's nothing to mock.
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
      //    recipe — see `e2e/fixtures/styles.ts` for the rationale).
      await page.addStyleTag({
        content: STYLE_RESET_CSS,
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
