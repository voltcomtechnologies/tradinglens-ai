# TradingLens e2e visual snapshot suite

This directory holds Playwright tests that catch narrow-viewport (375×667
Chromium) regressions on the Trading Lens pages. The single spec snapshots
both `/lens/trading` and `/dashboard/trading` to detect future regressions
in the header/scanner balance — heading shrinkage that breaks
phone readability, scanner chrome detachment, copy changes that push the
scanner down unexpectedly, etc.

> Happy path: read **TL;DR** + **Scripts**. Failure: jump to **Troubleshooting**.
> Extending the suite: read **How it works**.

## TL;DR — first run on a fresh clone

```sh
pnpm seed                                  # one-time: seed the demo user
pnpm exec playwright install chromium      # one-time: download the browser
pnpm test:e2e                              # run snapshot tests
```

The first run takes ~1 minute (Next.js production build for the webServer
plus the test itself). Subsequent runs are ~10 s if no code or baselines
changed.

## Prerequisites

| What                  | Why                                                                                       | Setup                                                    |
| --------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Seeded demo user      | Both routes are auth-gated and the spec logs in as a seeded user.                          | `pnpm seed` (idempotent — safe to re-run)                |
| Chromium binary       | The single project runs on Chromium (we explicitly override the iPhone SE device hint).   | `pnpm exec playwright install chromium`                 |
| Reachable `DATABASE_URL` (in `.env`) | Login flow needs the seeded demo user to exist in the DB.            | See `.env.example` for the Neon / Postgres connection string. |

If `pnpm seed` is missing, the test will fail with `CredentialsSignin` —
that's the most common first-run failure, and it's fixed by the first row
in the table above.

## Scripts

| Script              | What it does                                                                                    |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `pnpm test:e2e`     | Run snapshot tests against the committed baselines. Exits non-zero if any pixel diff > tolerance.|
| `pnpm test:e2e:ui`  | Same tests, but interactive — Playwright's test runner UI for stepping through / debugging.      |
| `pnpm test:e2e:update` | Regenerate the baseline PNGs in `e2e/tests/<spec>-snapshots/`. Use after an intentional layout change. |

## When to update baselines

Update the baselines when you've INTENTIONALLY changed the visual
hierarchy on either route — e.g., you bumped the `<h1>` size, added a
chip to the scanner header, or restructured the header above the
scanner. Don't update blindly to "make the test pass"; a high-diff
baseline update usually means you missed a regression in your PR.

Workflow:

```sh
# 1. Run the test locally and confirm the diff matches your intent
pnpm test:e2e

# 2. Open the diff PNGs in e2e/test-results/ to eyeball them
# (left = committed baseline, right = new render)

# 3. If the diff is intentional, regenerate
pnpm test:e2e:update

# 4. Inspect the new PNGs in e2e/tests/trading-lens-narrow.spec.ts-snapshots/
#    before committing them — paste them into your PR description so
#    reviewers can see the visual change.

# 5. Commit the changed PNGs as part of your feature commit
```

## Cross-platform gotcha (read before running on CI)

The committed baselines are suffixed with the host platform — on Windows
they look like `*-win32.png`, on macOS `*-darwin.png`, on Linux
`*-linux.png`. That means:

- The currently-committed baselines are `-win32.png` from the original
  capture on Windows.
- A macOS or Linux CI runner will look for `*-darwin.png` /
  `*-linux.png` and fail with `Snapshot … not found`.

**Recommended: Option 2** — regenerate per OS and commit each set. It
works for any CI host, avoids per-PR crossed-finger breakage, and the disk
cost is trivial (~700 KB × 3 = 2 MB). Pick another only if you have a
hard constraint.

Three valid escapes:

1. **Commit to a single CI OS.** Run e2e jobs only on Windows (or only
   on Linux). Document the choice above.
2. **Regenerate on each CI OS once and commit each set.** Three sets of
   two PNGs in the snapshot directory; CI picks the right one. Disk
   cost is trivial (~700 KB × 3 = 2 MB).
3. **Use Playwright 1.50+'s platform-agnostic snapshot option** if your
   installed version supports `toHaveScreenshot({ …, omitPlatform:
   true })`. Verify the `platformagnostic` filename suffix behaviour on
   your installed version before relying on it.

Until you pick one of the above, expect a non-Windows CI run to fail
on the missing-baseline snapshot lookup.

## Troubleshooting

| Symptom                                                                | Likely cause                                                       | Fix                                                            |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------- |
| `Error: CSRF fetch failed: 500 Internal Server Error`                  | `AUTH_SECRET` not set in `webServer.env` (shouldn't happen — see `playwright.config.ts`). | Re-run `pnpm install` to refresh `@playwright/test`.           |
| `Error: Credentials login failed: 401`                                | DB not seeded.                                                     | `pnpm seed`.                                                   |
| `Error: CSRF fetch failed: 500 … UntrustedHost`                        | `AUTH_TRUST_HOST` missing (shouldn't happen — set in config).      | Verify you're running against a fresh `pnpm install` output.   |
| `browserType.launch: Executable doesn't exist` … `webkit-…`            | `devices["iPhone SE"]`'s `defaultBrowserType: "webkit"` hint.      | The config explicitly sets `browserName: "chromium"` — verify `playwright.config.ts` is up to date. |
| `Timed out waiting for http://localhost:3030` (or `Error: EADDRINUSE :::3030` in the dev log) | Stale `next start` from an aborted prior run (or a previous contributor's process) holding port 3030. | Find the orphan: `netstat -ano \| findstr ":3030 "` (Windows) or `lsof -i :3030` (macOS/Linux). Kill the PID: `MSYS_NO_PATHCONV=1 taskkill /F /PID <pid>` (Windows) or `kill -9 <pid>` (unix-likes). Then re-run `pnpm test:e2e`. |
| `Snapshot … not found` on macOS/Linux CI                               | Cross-platform baseline gotcha (see above).                        | Pick one of the three escapes above.                           |
| `expect(page).toHaveScreenshot: maxDiffPixelRatio exceeded`            | Real visual regression OR sub-pixel render drift.                 | Inspect the diff PNGs in `e2e/test-results/`; if it's a real bug, fix it; if it's intentional, run `pnpm test:e2e:update`. |

## How it works

The single spec, `e2e/tests/trading-lens-narrow.spec.ts`, does the
following for each route:

1. Logs in via the seeded demo user using
   [`loginInContext`](fixtures/auth.ts) — a 3-round-trip Auth.js
   v5 credentials login (CSRF GET → POST callback → cookie verify) on
   the same `BrowserContext` the test runs in. No `storageState` file,
   so no race between `beforeAll` writing it and Playwright reading it
   via `test.use({ storageState })`.
2. Navigates at 375×667 viewport with `reducedMotion: "reduce"` and
   camera permission **not** granted. The scanner's `useEffect` queries
   `navigator.permissions.query`, which returns `prompt` (Chromium hasn't
   decided yet), falls into the `else` branch, and mounts `<Webcam>` from
   `react-webcam` — which renders an empty `<video>` element (no
   `getUserMedia` is acquired). Visually indistinguishable from a denied
   state, but the actual code path is "empty video stream", not "Camera
   Access Denied UI".
3. Waits for the page `<h1>` and the scanner `<h3>` to be visible,
   then for `networkidle`, then injects a `* { animation/transition:
   none !important }` stylesheet to snap framer-motion's `initial →
   animate` transitions to end state.
4. Calls `expect(page).toHaveScreenshot(..., { animations: 'disabled',
   fullPage: true, maxDiffPixelRatio: 0.005 })`. The 0.5% tolerance is
   calibrated for cross-machine font hinting differences; tighten if you
   ever see false negatives.

The Playwright config (`playwright.config.ts`) starts its own prod-build
server on port 3030 with these env overrides:

- `AUTH_TRUST_HOST=true` — Auth.js v5's default-deny trust list
  refuses the test's localhost URL otherwise.
- `AUTH_URL=http://localhost:3030` — canonical issuer URL.
- `AUTH_SECRET=<fixed test-only string>` — so JWT minting doesn't
  depend on `.env` containing a real one. The fixed string is public
  in the repo on purpose: the demo user it signs JWTs for has no
  privileges outside the dev database, so this is a non-blast-radius
  configuration choice. Length must stay ≥ 32 chars (Auth.js v5
  minimum).

`DATABASE_URL` is intentionally **not** set in `webServer.env` — it's
inherited from `.env` via `pnpm start`'s built-in loader, which keeps
the connect flow identical to how the user's local dev server runs.

If you ever extend the spec with new routes, add them to the `ROUTES`
const in `trading-lens-narrow.spec.ts` and re-run `pnpm test:e2e:update`
to generate their baselines.
