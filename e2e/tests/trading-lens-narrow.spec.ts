import { test, expect } from "@playwright/test";
import { loginInContext } from "../fixtures/auth";

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
 *   - Camera permission denied: the scanner falls into its well-defined
 *     "Camera Access Denied" UI (icons + copy, no `getUserMedia`), which is
 *     far more deterministic than stubbing a synthetic MediaStream.
 *   - Playwright's native `animations: "disabled"` on the screenshot fast-
 *     forwards finite CSS animations and freezes infinite ones.
 *   - `await networkidle` + an explicit wait for the page-level h1 and the
 *     scanner h3 so the snapshot is committed only after rendering settles.
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
  test.beforeEach(async ({ context, baseURL }) => {
    await loginInContext(context, baseURL!);
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
      // BEFORE the screenshot. Playwright's `animations: "disabled"` will
      // fast-forward finite ones and freeze infinite ones, but some framer-
      // motion `style` transforms ignore that — so we explicitly force them
      // to end state via CSS overrides.
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
