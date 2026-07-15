import { NextResponse } from "next/server";

// Force Node.js runtime to mirror the rest of the /api/* surface area
// (Edge runtime is the Vercel default, but Edge cannot guarantee
// `process.env` access during SSR for some vars; Node is the safe pick).
export const runtime = "nodejs";

/**
 * Smoke-test endpoint that returns the build's Vercel-injected Git
 * metadata. Lets us verify which commit is actually serving in
 * production without needing VERCEL_TOKEN or going through public
 * bot-detection WAFs (the env-vars are populated by Vercel at build
 * time, so they are a definitive ground truth for the live build).
 *
 * Public, no auth required: the data is non-sensitive build metadata,
 * not secrets. See:
 *   https://vercel.com/docs/projects/environment-variables/system-environment-variables
 */
export async function GET() {
  return NextResponse.json(
    {
      sha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      ref: process.env.VERCEL_GIT_COMMIT_REF ?? null,
      deploymentId: process.env.VERCEL_DEPLOYMENT_ID ?? null,
      deploymentUrl: process.env.VERCEL_DEPLOYMENT_URL ?? null,
      env: process.env.VERCEL_ENV ?? null,
    },
    {
      headers: {
        // No-store forbids any cache; the answer must always reflect the
        // current build. (no-cache/must-revalidate would be redundant.)
        "Cache-Control": "no-store",
      },
    }
  );
}
