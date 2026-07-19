import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for TradingLens narrow-viewport visual snapshots.
 *
 * Captures `/lens/trading` and `/dashboard/trading` at 375×667 (iPhone SE)
 * to catch regressions in the header/scanner balance on small screens.
 *
 * Both routes are auth-gated by `src/middleware.ts`, so each test loads a
 * storageState captured from a real credentials login (see e2e/fixtures/auth.ts).
 *
 * Defaults to port 3030 so the test build (`pnpm build && pnpm start --port 3030`)
 * never fights your local `pnpm dev` server on port 3000. Override with
 * `PLAYWRIGHT_BASE_URL` (e.g. set it to your running dev URL) to point the
 * tests at any other instance.
 */
const PORT = process.env.PLAYWRIGHT_PORT ?? "3030";
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e/tests",
  outputDir: "./e2e/test-results",
  fullyParallel: false, // visual snapshots are not safe across parallel workers
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",

  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    // Kill animations at the browser-emulation layer; the spec additionally
    // injects a `transition/animation: none` stylesheet before screenshotting.
    contextOptions: {
      reducedMotion: "reduce",
    },
  },

  webServer: {
    command: `pnpm build && pnpm start --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180 * 1000,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      PLAYWRIGHT_TEST: "1",
      // Auth.js v5 (next-auth@5) refuses to issue session cookies for
      // untrusted hosts; AUTH_TRUST_HOST=true sidesteps that for the test
      // localhost URL. AUTH_URL pins the canonical issuer URL to our
      // baseURL so cookies are scoped correctly. (NEXTAUTH_URL is the
      // v4 alias; next-auth@5 reads both, but AUTH_URL is the v5
      // canonical name.)
      //
      // AUTH_SECRET is set to a fixed test-only value so `pnpm start`
      // can mint and verify JWT cookies without depending on whether
      // the user's .env happens to contain one for their working copy
      // (.env.example ships it as a placeholder template). The demo
      // user the test logs in as has zero privileges outside the
      // dev database, so a publicly-readable test secret has no blast
      // radius; the value is also scoped to the local test process.
      // Length MUST stay >= 32 chars (Auth.js v5 minimum — the
      // validator silently rejects shorter values). Rotate the
      // string freely if you ever decide it needs to.
      //
      // DATABASE_URL is intentionally NOT set in this block: it is
      // inherited via `pnpm start`'s built-in .env loader from the
      // project root .env (Playwright's webServer.env merges with the
      // parent shell env, not replaces it — so DATABASE_URL seeded via
      // `pnpm seed` earlier in the workflow keeps flowing through).
      AUTH_TRUST_HOST: "true",
      AUTH_URL: BASE_URL,
      AUTH_SECRET:
        "playwright-test-fixed-secret-NOT-A-PROD-SECRET-replace-or-rotate-as-needed",
    },
  },

  projects: [
    {
      name: "mobile-375",
      // devices["iPhone SE"] supplies viewport 375x667 + DPR + iPhone-class
      // user agent + isMobile + hasTouch — but it ALSO carries an internal
      // `defaultBrowserType: "webkit"` hint, which causes Playwright to
      // launch WebKit instead of Chromium (we only installed Chromium).
      // Explicit `browserName: "chromium"` overrides that hint so the tests
      // actually run.
      //
      // Trade-off: this gives us Chromium (Blink) rendering with an
      // iPhone-class UA + viewport, NOT true iOS Safari (WebKit). Blink's
      // font metrics and layout maths differ subtly from Safari's; for
      // width-balance regression snapshots that's plenty. If a real-world
      // failure ever points at a Safari-only rendering bug, the escape
      // hatch is `pnpm exec playwright install webkit`.
      //
      // Note: `devices["iPhone SE"]` is a 2016-era fingerprint. We keep the
      // 375px width on purpose (that's the viewport the user wants guarded),
      // but `devices["iPhone 13"]` (390x844) would be the modern equivalent
      // if the snapshot crew ever wants to modernize.
      use: {
        ...devices["iPhone SE"],
        browserName: "chromium",
      },
    },
  ],
});
