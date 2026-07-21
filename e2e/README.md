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

## Cross-platform policy: Windows-only baselines

Playwright suffixes snapshot filenames with the host platform
(`*-win32.png` / `*-darwin.png` / `*-linux.png`) and the current API has
**no platform-agnostic option** (verified against `@playwright/test@1.61.1`
docs) — you either commit per-OS baselines, or constrain CI to one OS,
or run via Docker. The project's decision is the **single-OS** option:
Windows only.

Concretely:

- **CI runs only on Windows.** Any CI matrix that includes macOS/Linux
  runners is a misconfiguration; fix at the workflow level.
- **The committed baselines are `-win32.png`** from the original capture
  on Windows. They are the only baselines the project tracks.
- **macOS / Linux contributors running the suite locally** can regenerate
  a private local copy with `pnpm test:e2e:update` (which will produce
  `*-darwin.png` / `*-linux.png` next to the committed `-win32.png`).
  **Do not commit your `-darwin` / `-linux` baselines** — reject them
  in your PR. Windows-only is the project policy.
- **Why we chose single-OS**: the project ships on Windows, and the
  regression surface this suite guards (header/scanner balance at 375px)
  doesn't vary meaningfully across rendering engines at the 0.5%
  pixel-diff threshold — cross-engine variance here is noise, not
  signal. Windows-only keeps the suite deterministic, single-set, and
  trivially reviewable in PR diffs.

A future flip to multi-OS is a doc change away — at that point,
regenerate locally on each OS, commit each PNG set alongside the
matrix change, and update this paragraph.

## Troubleshooting

| Symptom                                                                | Likely cause                                                       | Fix                                                            |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------- |
| `Error: CSRF fetch failed: 500 Internal Server Error`                  | `AUTH_SECRET` not set in `webServer.env` (shouldn't happen — see `playwright.config.ts`). | Re-run `pnpm install` to refresh `@playwright/test`.           |
| `Error: Credentials login failed: 401`                                | DB not seeded.                                                     | `pnpm seed`.                                                   |
| `Error: CSRF fetch failed: 500 … UntrustedHost`                        | `AUTH_TRUST_HOST` missing (shouldn't happen — set in config).      | Verify you're running against a fresh `pnpm install` output.   |
| `browserType.launch: Executable doesn't exist` … `webkit-…`            | `devices["iPhone SE"]`'s `defaultBrowserType: "webkit"` hint.      | The config explicitly sets `browserName: "chromium"` — verify `playwright.config.ts` is up to date. |
| `Timed out waiting for http://localhost:3030` (or `Error: EADDRINUSE :::3030` in the dev log) | Stale `next start` from an aborted prior run (or a previous contributor's process) holding port 3030. | Find the PID holding port 3030 — `netstat -ano \| findstr ":3030 "` (Windows) or `lsof -i :3030` / `fuser 3030/tcp` / `ss -tlnp` (unix-likes; pick whatever is installed). Then kill it and re-run `pnpm test:e2e`. |
| `Snapshot … not found` when running `pnpm test:e2e` locally on macOS / Linux | No baseline exists yet for the local platform's filename suffix (`*-darwin.png` / `*-linux.png`). | Run `pnpm test:e2e:update` once to create a local baseline, then **do not commit** the new `*-darwin.png` / `*-linux.png` PNGs — Windows-only is the project policy (see above). |
| Inherited / configured a CI matrix with macOS / Linux runners         | Project snapshot policy is Windows-only — those runners will fail with `Snapshot … not found`. | Either remove macOS/Linux from the matrix, or follow the future-proofing path in the cross-platform section above to commit per-OS PNGs. |
| `expect(page).toHaveScreenshot: maxDiffPixelRatio exceeded`            | Real visual regression OR sub-pixel render drift.                 | Inspect the diff PNGs in `e2e/test-results/`; if it's a real bug, fix it; if it's intentional, run `pnpm test:e2e:update`. |

## Visual test inventory

| Spec file                                              | Project (`playwright.config.ts`) | Viewport       | Surface covered                                                                                          |
| ------------------------------------------------------ | -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------- |
| `e2e/tests/trading-lens-narrow.spec.ts`                | `mobile-375`                     | 375×667        | `/lens/trading` and `/dashboard/trading` — header/scanner balance. Camera permission is NOT granted.    |
| `e2e/tests/trading-lens-live-chart.spec.ts`            | `desktop-1280`                   | 1280×720       | `/lens/trading` — `LiveChart` canvas (lightweight-charts v5 + chrome + status badge). Mock feed. WebSocket aborted. |

The narrow spec covers the AI-camera-scan path; the live-chart spec covers
the live-observation path. They are siblings on the route, not
replacements — neither test removes or shadows the other.

Adding a new visual spec:

1. Pick the viewport / target surface in `playwright.config.ts`'s
   `projects` array. Reuse `mobile-375` or `desktop-1280` if it fits;
   add a new project only when you need a different viewport AND you can
   justify the additional CI minutes.
2. Compose a seed fixture under `e2e/fixtures/<domain>/`. Snapshots are
   stable only when the underlying data is reproducible — never feed the
   spec a `Date.now()`-derived row.
3. Write the spec. Mirror the `loginInContext` pattern from existing
   specs. Route-intercept any data endpoint feeding the chart so test
   runs don't drift on today's date or Alpha Vantage rate-limit
   throttling. `waitForFunction` for canvas dimensions > 0 before
   screenshotting if the spec targets canvas paint.
4. Generate the baseline once with `pnpm test:e2e:update`. Commit the
   resulting PNGs AND a new row to the inventory table above.

## How it works

The current specs share the same `beforeEach` recipe:
`loginInContext` from the seeded demo user, viewport reset, abort the
Socket.IO server (`ws://*:3001/*`) so the chart polls instead of
folding live ticks, then optionally route-intercept `/api/market/data`
with a fixed seed. Each spec then:

1. Logs in via the seeded demo user using
   [`loginInContext`](fixtures/auth.ts) — a 3-round-trip Auth.js
   v5 credentials login (CSRF GET → POST callback → cookie verify) on
   the same `BrowserContext` the test runs in. No `storageState` file,
   so no race between `beforeAll` writing it and Playwright reading it
   via `test.use({ storageState })`.
2. Navigates at the project-defined viewport with `reducedMotion:
   "reduce"` and camera permission **not** granted (narrow spec only —
   the live-chart spec doesn't touch the camera). The scanner's
   permission-API check returns `prompt`, falls into the default branch,
   and mounts `react-webcam`'s empty `<video>` element (no
   `getUserMedia` is acquired) — the viewport renders blank.
3. Waits for the page-level headed landmarks (heading visible,
   `networkidle`, optional canvas paint check), then injects a `*
   { animation/transition: none !important }` stylesheet to snap
   framer-motion's `initial → animate` transitions to end state.
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
