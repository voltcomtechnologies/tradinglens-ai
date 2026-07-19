import type { BrowserContext } from "@playwright/test";

/**
 * NextAuth v5 (Auth.js) Credentials login helper.
 *
 * Performs the credentials login dance directly against a live Playwright
 * `BrowserContext` so the resulting `authjs.session-token` cookie is attached
 * to the SAME context that the spec's tests run in — no storageState file,
 * no race between `beforeAll` writing the file and Playwright reading it via
 * `test.use({ storageState })`.
 *
 * Flow (matches Auth.js v5 server-side endpoint conventions):
 *   1. GET `/api/auth/csrf` — Auth.js sets the `authjs.csrf-token` cookie on
 *      this request and returns `{ csrfToken }` in the response body.
 *   2. POST `/api/auth/callback/credentials?json=true` with form-urlencoded
 *      `csrfToken`, `email`, `password`, `callbackUrl`. Auth.js sets the
 *      `authjs.session-token` cookie on a 200 response. `?json=true` returns
 *      a JSON body (`{ url }` on success, `{ error }` on failure) instead of
 *      a redirect, which lets us surface the cause cleanly.
 *   3. Verify the session cookie actually landed on the context (not just on
 *      a throw-away request context) — Auth.js can return 200 with a JSON
 *      `error` field on bad credentials even when `?json=true` is set, so we
 *      ground-truth on context cookies rather than HTTP status alone.
 *
 * Requirements:
 *   - The dev/prod database is seeded. Run `pnpm seed` first if you see
 *     `CredentialsSignin` errors here. Seeded demo credentials come from
 *     `prisma/seed.ts`: any of the five seeded emails, password `Demo1234!`.
 */
export const SEED_DEMO_EMAIL = "alex.trader@example.com";
export const SEED_DEMO_PASSWORD = "Demo1234!";

// We ground-truth against any session cookie whose name matches either Auth.js
// v5 variant. Note that the `__Secure-` prefix is only emitted when the
// request was served over HTTPS — browsers refuse to set prefixed cookies
// over plain HTTP — so for local HTTP runs (e.g. http://localhost:3030)
// only the unprefixed `authjs.session-token` will ever appear. The prefixed
// variant matters for HTTPS CI/preview deploys.
const isAuthJsSessionCookie = (name: string): boolean =>
  name === "authjs.session-token" || name === "__Secure-authjs.session-token";

export async function loginInContext(
  context: BrowserContext,
  baseURL: string,
): Promise<void> {
  // 1. CSRF. Use `context.request` so the cookies set by Auth.js on this GET
  //    end up on the same cookie jar that the subsequent POST (and every
  //    later `page.goto`) will see.
  const csrfResponse = await context.request.get(baseURL + "/api/auth/csrf");
  if (!csrfResponse.ok()) {
    throw new Error(
      `CSRF fetch failed: ${csrfResponse.status()} ${csrfResponse.statusText()}. ` +
        `Is the target server reachable at ${baseURL}?`,
    );
  }
  const { csrfToken } = await csrfResponse.json();
  if (!csrfToken) {
    throw new Error(
      `CSRF endpoint returned no csrfToken: ${await csrfResponse.text()}`,
    );
  }

  // 2. Credentials POST. Auth.js accepts form-urlencoded bodies; the
  //    `?json=true` query returns JSON instead of a redirect so we get the
  //    actual auth result inline.
  const loginResponse = await context.request.post(
    baseURL + "/api/auth/callback/credentials?json=true",
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      form: {
        csrfToken,
        email: SEED_DEMO_EMAIL,
        password: SEED_DEMO_PASSWORD,
        callbackUrl: baseURL,
      },
    },
  );

  const loginBody = await loginResponse.text();

  if (!loginResponse.ok()) {
    throw new Error(
      `Credentials login failed: ${loginResponse.status()}\n${loginBody}\n\n` +
        `Most likely the database is not seeded. Run \`pnpm seed\` first.`,
    );
  }

  // 3. Ground-truth check: confirm a session cookie is now attached to the
  //    BrowserContext's cookie jar. Auth.js returns 200 with `{ error }` on
  //    bad credentials even when `?json=true` is set, so HTTP status alone
  //    is not sufficient proof of a successful login.
  const cookies = await context.cookies(baseURL);
  const sessionCookie = cookies.find((c) => isAuthJsSessionCookie(c.name));
  if (!sessionCookie) {
    throw new Error(
      `Login endpoint returned 200 but no authjs.session-token cookie was set on the BrowserContext.\n` +
        `Login response body:\n${loginBody}\n` +
        `Cookies on context for ${baseURL}:\n${JSON.stringify(cookies, null, 2)}\n\n` +
        `Most likely the database isn't seeded, or the credentials changed. Run \`pnpm seed\` to refresh.`,
    );
  }
}
