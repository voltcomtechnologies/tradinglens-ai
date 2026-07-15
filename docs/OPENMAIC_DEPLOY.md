# Deploying OpenMAIC for Edu Lens (Path A)

This guide walks through taking the vendored `openmaic/` sibling to production on Vercel as a separate project in the same Monorepo.

## What you have

`openmaic/` is a shallow clone of [THU-MAIC/OpenMAIC](https://github.com/THU-MAIC/OpenMAIC) (MIT, v0.3.0), pre-patched to (a) accept the shared HMAC token that TradingLens issues for entitled users and (b) read an admin-supplied lesson outline from the URL so users just click "Start AI Classroom" and the LLM pipeline takes over.

Heavy bits we already stripped:

- `openmaic/.git/`
- `openmaic/eval/`
- `openmaic/docs/`
- marketing MP4s in `openmaic/public/`

Working directory is ~100 MB. Vercel will only push what it needs to build.

## One-time prep

```sh
# 1. Generate a 32-byte shared secret. KEEP THIS — you will paste the SAME
#    value into both TradingLens and OpenMAIC.
openssl rand -hex 32

# 2. Add it to TradingLens/.env.local
echo 'OPENMAIC_SHARED_SECRET="<that value>"' >> .env.local
echo 'NEXT_PUBLIC_OPENMAIC_URL="https://classroom.tradinglens.vercel.app"' >> .env.local
```

## Push the Monorepo

The current repo already has the TradingLens app at `/` and the OpenMAIC app
at `/openmaic/`. Push the whole repo to GitHub. Important: do **not**
generate a fresh git history inside `openmaic/` — Vercel's Monorepo
detector needs the same root.

```sh
git add -A
git commit -m "feat: add OpenMAIC subrepo + Edu Lens AI Classroom bridge"
git push origin master
```

## Configure the two Vercel projects

Create **two** Vercel projects from the same GitHub repo:

### Project 1 — TradingLens (existing)

- **Root Directory:** `.` (the repo root)
- **Build Command:** `npx prisma generate && next build` (already in `vercel.json`)
- **Install Command:** `npm install`
- **Environment Variables (Production AND Preview \u2014 not Production only):**
  - `DATABASE_URL`
  - `AUTH_SECRET`
  - `OPENROUTER_API_KEY` (or `GROQ_API_KEY`)
  - `OPENMAIC_SHARED_SECRET` — paste the value from step 1
  - `NEXT_PUBLIC_OPENMAIC_URL` — `https://classroom.tradinglens.vercel.app`
    (use the URL Vercel issues for Project 2, then update once Project 2 is up)

  > **Scope reminder:** Repeat the values above for **both Production and
  > Preview** environments. Otherwise Preview deploys (PR previews, branch
  > pushes) will see `OPENMAIC_SHARED_SECRET` as `undefined` and the
  > `/api/openmaic-token` route will respond with `500 / "OPENMAIC_SHARED_SECRET
  > is not set or is too short"`. Vercel defaults each env var to a single
  > scope at creation time \u2014 audit each var explicitly.

### Project 2 — OpenMAIC (new)

In the Vercel "New Project" wizard, instead of importing a fresh repo, import the **same** repo but set:

- **Root Directory:** `openmaic`
- **Framework Preset:** Next.js (auto-detected)
- **Build Command:** leave default `pnpm build`
- **Install Command:** leave default `pnpm install` (Vercel picks up the
  `packageManager` field in `openmaic/package.json` and provisions pnpm 10.x)
- **Environment Variables (Production AND Preview \u2014 not Production only):**
  - `ACCESS_CODE` — paste the SAME secret you used for `OPENMAIC_SHARED_SECRET`
  - `OPENROUTER_API_KEY` — same key as TradingLens, or a separate one
  - `DEFAULT_MODEL` — e.g. `openrouter:deepseek/deepseek-chat` for low cost,
    or `google:gemini-3-flash-preview` for highest quality (OpenMAIC docs
    recommend Gemini 3 Flash). For xAI Grok, use `grok:grok-4.20` — the
    `grok-4.20-reasoning` / `grok-4.20-multi-agent` slugs that earlier
    OpenMAIC versions shipped with **do not exist on xAI's API** and will
    return HTTP 400 ("model_not_found") from `/v1/chat/completions`. xAI
    ships `grok-4.20` as the base slug; reasoning is controlled via
    request-time params (`reasoning_effort`), not via the slug.
  - Optionally: `LEMONADE_BASE_URL`, `TTS_*` if you want TTS in classrooms

> **Slug-mismatch warning.** If you wire up `grok:grok-4.20-reasoning`
> because a tutorial told you to, expect every classroom call to fail with
> `AI_APICallError: Bad Request`. xAI's API rejects `grok-4.20-reasoning`
> with a 400 and the OpenMAIC `[Verify Model]` log line corroborates this.
> The vendored OpenMAIC subdir at this commit (`openmaic/lib/ai/providers.ts`)
> has already had those hallucinated slug entries removed; the canonical
> Grok model slug is `grok:grok-4.20`.


  > **Scope reminder:** as with Project 1, set each var on **both Production
  > and Preview** environments in Project 2. Preview deploys will otherwise
  > see `ACCESS_CODE` as `undefined` and OpenMAIC's middleware will fall
  > through to its own access-code modal (different from the
  > `?at=<token>` HMAC path) for every request.

Vercel auto-creates `https<nolink>-classroom-tradinglens.vercel.app`.
Attach the `classroom.tradinglens.com` custom domain once Project 2 is
live, then back-fill `NEXT_PUBLIC_OPENMAIC_URL` in Project 1 to match.

## OpenMAIC config overrides

The clone ships a default OpenMAIC UI. To brand it as TradingLens Classroom:

1. **Title bar.** Edit `openmaic/app/layout.tsx`, find the `metadata` export and
   change `title` to `"TradingLens Classroom — AI-Powered Lessons"`.
2. **Header strip.** Add a fixed top strip in `openmaic/app/layout.tsx` with a
   "← Back to TradingLens" link pointing at your `NEXT_PUBLIC_OPENMAIC_URL` —
   no, that's circular; use `https://tradinglens.com/dashboard/learn`. Ship a
   small `<TradingLensHeader />` client component to make it sticky.
3. **Logo.** Drop your TradingLens mark into `openmaic/public/` and patch the
   `<motion.img src="/logo-horizontal.png" />` reference in
   `openmaic/app/page.tsx` to point at the new asset.
4. **Disable marketing prompts.** Remove or override the slogan
   `t('home.slogan')` in `openmaic/app/page.tsx` to read
   "Powered by TradingLens Edu Lens". Update `openmaic/lib/i18n/locales/en-US.json`
   under `home.slogan`.

These are visual only. Functional gating is handled by the access code +
middleware already in place.

## Verifying the bridge

After both projects deploy:

1. Sign in to TradingLens with `demo@tradinglens.com` / `Demo1234!` (admin
   seed user; the active Pro/Elite subscription includes `edu` lensAccess).
2. Navigate to `/dashboard/learn/forex-fundamentals-mastery`.
3. Click **Start AI Classroom**. The button makes a POST to
   `/api/openmaic-token`, which checks subscription + rate limit then returns
   the signed token. The browser redirects to
   `https://classroom.tradinglens.vercel.app/?r=<base64>&at=<token>`.
4. OpenMAIC's patched middleware sees `at=`, verifies the HMAC signature,
   sets the `openmaic_access` cookie, and redirects to the same URL minus
   the token. The home page reads `r=`, populates the textarea with the
   rendered outline, and the user clicks **Enter Classroom**.

If the user lands on OpenMAIC without a token (cold direct visit), they get
the existing ACCESS_CODE prompt — that's the safety net.

## Verifying env-var parity (fingerprint logs)

> **⚠️ If you ever paste, screenshot, log, or chat a secret value, treat it as exposed.** Rotate it **first**, then run the parity check below on the freshly-generated value. The act of confirming parity on a leaked value proves only that both projects are equally compromised.

The HMAC bridge assumes `OPENMAIC_SHARED_SECRET` (TradingLens) and
`ACCESS_CODE` (OpenMAIC) are byte-identical. Both projects emit a
`[openmaic-secret-fingerprint]` line on the first cold start of every
container. Run, in two terminals:

```sh
# Project 1 (TradingLens)
vercel logs --prod | grep openmaic-secret-fingerprint

# Project 2 (OpenMAIC)
vercel logs --prod | grep openmaic-secret-fingerprint
```

Both lines should look like (same hash on both sides == env-var parity):

```
[openmaic-secret-fingerprint] TradingLens OPENMAIC_SHARED_SECRET = a3f81c2e\u20269b4d (length=44) \u2014 compare\u2026
[openmaic-secret-fingerprint] OpenMAIC ACCESS_CODE              = a3f81c2e\u20269b4d (length=44) \u2014 compare\u2026
```

The fingerprint is a truncated SHA-256 of the secret, **not** a substring of
the secret itself \u2014 no byte of either secret ever appears in any log.

**Why you may see N > 1 lines per project.** Vercel serverless functions
each have their own module scope. The TradingLens route reads the secret
inside `src/lib/openmaic-token.ts:getSecret()`, and the OpenMAIC routes
(`/api/access-code/{verify,status}` + `middleware.ts`) each instantiate
their own once-logged boolean. You may see a handful of lines per project
in the first minute after a deploy: one per cold-started container, one
per route that reads the secret. As long as **any** pair matches, the
secrets are aligned.

**Offline verification.** Want to confirm parity without waiting for a
cold start? Hash the secret locally and compare against either deploy
log:

```sh
SECRET='paste your secret here'
node -e "const h=require('crypto').createHash('sha256').update(process.argv[1],'utf8').digest('hex'); console.log(h.slice(0,8)+'\u2026'+h.slice(8,12))" "$SECRET"
```

The output should match the `= <hash>\u2026<hash>` segment in either log.
If it doesn't, the secret you typed locally differs from the one Vercel
has \u2014 check for stray whitespace, line breaks, or a copy/paste that
included a `"` quote.

## Cost controls already wired up

- **Daily limit:** 5 generations per TradingLens user per 24 hours. Tracked
  in the new `CourseAiGeneration` Prisma table. Bumps in a future deploy.
- **Entitlement:** Only users whose ACTIVE subscription has `"edu"` in
  `lensAccess` get a token. Pro/Elite plans include it; Basic does not.
- **Token TTL:** 10 minutes. After expiry the middleware refuses to set
  the cookie even if the URL is re-shared.
- **OpenMAIC API limits:** OpenMAIC's own generation pipeline caps scene
  concurrency via `PARALLEL_SCENE_CONCURRENCY` (default 0 = serial).

## Rolling back

Path A is fully additive. To roll back:

1. In Vercel, delete Project 2 (OpenMAIC). TradingLens keeps running.
2. Optionally flip `aiClassroomEnabled` to `false` on every Course row:
   `UPDATE "Course" SET "aiClassroomEnabled" = false;`
3. The "AI Classroom" CTA disappears from the UI within the deploy.

## Where to look when things break

| Symptom | Where to check |
|---|---|
| 401 "An active subscription is required" | TradingLens-side entitlement check returning 403; the user isn't on Pro/Elite. |
| 429 "Daily AI classroom limit reached" | `CourseAiGeneration` table — `SELECT COUNT(*) WHERE "userId"=... AND "createdAt" > NOW() - INTERVAL '1 day';` |
| OpenMAIC shows the access code modal | `?at=` was rejected. Confirm `OPENMAIC_SHARED_SECRET` (TradingLens) and `ACCESS_CODE` (OpenMAIC) are byte-identical, and that the URL has `at=...` once and only once. |
| OpenMAIC redirects in a loop | Likely Vercel env mis-config. Open OpenMAIC logs: `VERCEL_ENV=production` mismatched with `secure: NODE_ENV !== 'production'`. |
| LLM cost spike | `OPENROUTER_API_KEY` is shared between TradingLens and OpenMAIC. Inspect OpenRouter dashboard usage. Set `MODEL_ROUTES` to a cheaper model per stage. |
