import { test, expect } from "@playwright/test";
import { loginInContext } from "../fixtures/auth";
import { STYLE_RESET_CSS } from "../fixtures/styles";

/**
 * Visual snapshot guard for the Trading Lens narrow-viewport header/scanner
 * balance. Both `/lens/trading` and `/dashboard/trading` carry the same
 * centered header + TradingScanner card; this test catches future regressions
 * where the heading shrinks too far for a phone, the scanner chrome (corner
 * brackets, accent bar, header chips) detaches from the header above it, or
 * new copy in the header pushes the scanner down unexpectedly.
 *
 * Snapshot stability recipe:
 *   - 375×667 viewport (iPhone SE baseline, via `playwright.config.ts`'s
 *     `devices["iPhone SE"]`).
 *   - `contextOptions.reducedMotion: "reduce"` (set in playwright.config.ts).
 *   - `page.addStyleTag` after navigation snaps all CSS animations and
 *     framer-motion's `initial → animate` transitions to their end state.
 *   - Camera permission NOT explicitly granted. The scanner's
 *     `navigator.permissions.query` returns `prompt` (Chromium hasn't
 *     decided yet), so the scanner falls into the default branch and
 *     mounts `react-webcam`'s empty `<video>` element (no `getUserMedia`
 *     is acquired) — the viewport renders blank.
 *   - Playwright's native `animations: "disabled"` on the screenshot fast-
 *     forwards finite CSS animations and freezes infinite ones.
 *   - `await networkidle` + an explicit wait for the page-level h1 and the
 *     scanner h3 so the snapshot is committed only after rendering settles.
 *
 * Future hardening: register a `context.addInitScript` overriding
 * `navigator.permissions.query` → `denied` if Chromium's default
 * Permissions API state ever drifts and we want to deterministically
 * land the scanner in the "Camera Access Denied" UI branch instead of
 * the empty-`<video>` branch. Note: would visibly change the snapshot
 * (icons + copy vs. blank viewport), so PNG baselines would need
 * regeneration.
 *
 * Auth flow: we use `loginInContext(context, baseURL)` in `beforeEach` so
 * the credentials login happens on the SAME BrowserContext that the spec
 * runs in. This eliminates the storageState-file race where Playwright's
 * `test.use({ storageState })` would try to read a file before `beforeAll`
 * had a chance to write it.
 *
 * Update baselines with `pnpm test:e2e:update` after an intentional visual
 * change. Baselines themselves live next to this file under
 * `e2e/tests/trading-lens-narrow.spec.ts-snapshots/` and ARE committed.
 */

// Routes under test. Add new ones here if you want them snapshotted too.
const ROUTES = [
  { path: "/lens/trading", name: "lens-trading" },
  { path: "/dashboard/trading", name: "dashboard-trading" },
] as const;

test.describe("Trading Lens – narrow viewport balance", () => {
  // Both routes are auth-gated by src/middleware.ts; log in directly on the
  // worker's BrowserContext before each test. Per-test login costs ~2-3
  // round-trips (CSRF + POST + cookie verify), which is cheap for the 2
  // routes snapshotted today but would dominate runtime if ROUTES grew much
  // larger — at that point a properly-synchronized-storageState helper would
  // be the right move (the prior attempt at that pattern raced on the file-
  // write timing and was removed).
  test.beforeEach(async ({ context, baseURL, page }) => {
    await loginInContext(context, baseURL!);

    // Short-circuit the bottom-rail Forex news ticker. The route fetches
    // daily-fx headlines server-side with a 5-min in-process cache; without
    // this intercept the spec races against hour-by-hour RSS content drift
    // and `waitForLoadState("networkidle")` (below) never settles because the
    // live RSS fetch keeps the network non-idle. Deterministic mock keeps
    // the full-page screenshot stable across runs.
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
          pair: null,
          source: "test-fixture",
          cachedAt: "2024-09-30T16:00:00.000Z",
        }),
      }),
    );
  });

  for (const route of ROUTES) {
    test(`${route.path} @ 375px`, async ({ page }) => {
      // Belt-and-braces: re-assert the viewport in case a future project
      // adds a different default.
      await page.setViewportSize({ width: 375, height: 667 });
      await page.emulateMedia({ reducedMotion: "reduce" });

      await page.goto(route.path, { waitUntil: "domcontentloaded" });

      // Wait for the page-level header + the scanner header to both be in
      // the DOM at full opacity. Asserting visibility here (instead of
      // relying on the snapshot diff alone) means a regression like
      // "h1 shrunk to zero" or "scanner never mounted" fails the test
      // with a targeted ARIA-error instead of a misleading pixel diff.
      await expect(
        page.getByRole("heading", { level: 1, name: /trading lens/i }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: /trading lens scanner/i }),
      ).toBeVisible();

      // Let framer-motion + lazy children settle. `networkidle` catches any
      // remaining fetch (Next.js RSC prefetch, market data, etc.).
      await page.waitForLoadState("networkidle");

      // Hard-snap any in-flight CSS animation / framer-motion transition
      // BEFORE the screenshot. See `e2e/fixtures/styles.ts` for the rationale
      // behind the two-layer reset — the wildcard rule handles CSS animations
      // and transitions, while the `[data-projection-id]` rule pins
      // framer-motion's layout-sprung transforms so a route's active-link
      // indicator doesn't leave a residual offset between UPDATE and VERIFY
      // phases of the baseline bake.
      await page.addStyleTag({
        content: STYLE_RESET_CSS,
      });

      // Wait for the scan-history fetch to settle so the
      // `useScanHistory` skeleton (3 cards at `.h-64.animate-pulse`
      // inside a `.mt-12` wrapper — 340px tall — see
      // trading-lens-core.tsx) is unmounted before the screenshot.
      // Defensive on the narrow viewport: it currently passes by accident
      // because the scanner card pushes the skeleton off the captured
      // frame, but a future regression on the scanner chrome could
      // surface the same 340px drift the live-chart spec just hit.
      await expect(page.locator(".h-64.animate-pulse")).toHaveCount(0);

      await expect(page).toHaveScreenshot(
        `trading-lens-narrow-${route.name}.png`,
        {
          fullPage: true,
          animations: "disabled",
          // Tolerate sub-pixel diffs from font hinting / GPU rasterisation
          // shifts across machines — strictly tighter than 1% so a real
          // h1/scanner-chrome regression still surfaces a diff. Bump this
          // only when intentionally changing layout.
          maxDiffPixelRatio: 0.005,
        },
      );
    });
  }
});
