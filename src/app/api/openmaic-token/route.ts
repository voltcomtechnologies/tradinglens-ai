import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { signOpenmaicToken } from "@/lib/openmaic-token";

// Force Node.js runtime. The route uses `node:crypto` (createHmac,
// timingSafeEqual) which is not available on Vercel's Edge runtime. Vercel
// defaults `/app/api/**` to Node today, but pinning the runtime prevents a
// future Hobby→Pro migration or Edge-functions experiment from silently
// flipping the runtime and breaking `node:crypto` at request time.
export const runtime = "nodejs";

const DAILY_LIMIT = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Same-origin guard. The OpenMAIC token endpoint is part of a same-origin
 * dashboard flow; without this guard, a malicious page can drain a logged-in
 * user's daily quota by embedding a fetch to this endpoint. We accept
 * requests whose `Origin` matches the configured `APP_URL` (or any Vercel
 * preview hostname in development). Empty Origin blocks (curl, server-side
 * fetch) pass through because NextAuth already gates those callers.
 */
function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // server-to-server / native fetch, NextAuth handled auth
  const appUrl = process.env.APP_URL || process.env.AUTH_URL;
  try {
    const allowed = new URL(origin);
    if (appUrl && allowed.origin === new URL(appUrl).origin) return true;
    if (allowed.hostname.endsWith(".vercel.app")) return true;
    if (allowed.hostname === "localhost") return true;
    return false;
  } catch {
    return false;
  }
}

function parseLensAccess(raw: string | null | undefined): string[] {
  if (!raw) {
    console.warn("[openmaic-token] Subscription plan has empty lensAccess");
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.warn(
        "[openmaic-token] Subscription plan lensAccess is not a JSON array"
      );
      return [];
    }
    return parsed.filter((x): x is string => typeof x === "string");
  } catch (err) {
    console.warn(
      "[openmaic-token] Failed to parse subscription plan lensAccess as JSON:",
      err
    );
    return [];
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { error: "Cross-origin requests are not allowed" },
      { status: 403 }
    );
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Optional body: { courseId: string }. If omitted we issue a generic token.
  let body: { courseId?: string } = {};
  try {
    const text = await request.text();
    if (text) body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const userId = session.user.id;

    // Verify the user still exists in the database. NextAuth JWT sessions can
    // outlive the underlying user row (e.g. account deletion), which would
    // otherwise trigger a foreign-key violation when we create the audit row.
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found. Please sign in again." },
        { status: 401 }
      );
    }

    const isAdmin = dbUser.role === "ADMIN";

    // ── Entitlement check: ACTIVE subscription whose plan has 'edu' in lensAccess.
    // ADMIN users bypass the subscription requirement so admins can verify the
    // integration end-to-end without provisioning a Stripe sub for themselves.
    // The daily rate limit + per-course `aiClassroomEnabled` check still apply.
    const sub = isAdmin
      ? null
      : await prisma.subscription.findFirst({
          where: {
            userId,
            status: "ACTIVE",
            endDate: { gte: new Date() },
          },
          include: { plan: true },
          orderBy: { createdAt: "desc" },
        });
    if (!sub && !isAdmin) {
      return NextResponse.json(
        { error: "An active subscription is required" },
        { status: 403 }
      );
    }
    let lensAccess: string[] = sub
      ? parseLensAccess(sub.plan.lensAccess)
      : ["edu"]; // admin bypass: synthesize full-lens access
    // Note: demo seed SubscriptionPlan rows have lensAccess as a JSON array.
    // A parse failure here indicates a misconfigured or legacy plan row.
    if (!lensAccess.includes("edu")) {
      return NextResponse.json(
        { error: "Your subscription does not include Edu Lens access" },
        { status: 403 }
      );
    }

    // ── If a courseId was supplied, verify the course is AI-enabled.
    let course = null as null | {
      id: string;
      slug: string;
      aiClassroomEnabled: boolean;
      aiClassroomOutline: unknown;
    };
    if (body.courseId) {
      course = await prisma.course.findUnique({
        where: { id: body.courseId },
        select: {
          id: true,
          slug: true,
          aiClassroomEnabled: true,
          aiClassroomOutline: true,
        },
      });
      if (!course || !course.aiClassroomEnabled) {
        return NextResponse.json(
          { error: "This course does not have an AI Classroom available" },
          { status: 404 }
        );
      }
    }

    // ── Daily rate limit (per user, not per course).
    const since = new Date(Date.now() - DAY_MS);
    const usedToday = await prisma.courseAiGeneration.count({
      where: { userId, createdAt: { gte: since } },
    });
    if (usedToday >= DAILY_LIMIT) {
      return NextResponse.json(
        {
          error: `Daily AI classroom limit reached (${DAILY_LIMIT}/day). Try again tomorrow.`,
          limit: DAILY_LIMIT,
          used: usedToday,
        },
        { status: 429 }
      );
    }

    // ── Issue the token using OpenMAIC-native format so the deployed
    //    middleware verifies it without a custom-format patch.
    const signed = signOpenmaicToken();

    // ── Audit. Recorded on every issuance; courseId may be null for
    //    generic tokens. The `launched` flag is updated by client telemetry.
    await prisma.courseAiGeneration.create({
      data: {
        userId,
        courseId: course?.id ?? null,
        launched: false,
      },
    });

    return NextResponse.json({
      token: signed.token,
      expiresInSeconds: signed.expiresInSeconds,
      expiresAt: signed.expiresAt,
      limit: DAILY_LIMIT,
      used: usedToday + 1,
    });
  } catch (error) {
    console.error("[openmaic-token] POST error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while generating the token" },
      { status: 500 }
    );
  }
}

/**
 * GET peeks daily usage without issuing a token. Powers the UI's
 * "X of 5 used today" indicator before the click.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = session.user.id;

    // Verify the user still exists in the database to prevent stale session
    // issues from surfacing as FK violations in downstream queries.
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found. Please sign in again." },
        { status: 401 }
      );
    }

    const since = new Date(Date.now() - DAY_MS);
    const used = await prisma.courseAiGeneration.count({
      where: { userId, createdAt: { gte: since } },
    });
    return NextResponse.json({ limit: DAILY_LIMIT, used });
  } catch (error) {
    console.error("[openmaic-token] GET error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while fetching usage" },
      { status: 500 }
    );
  }
}
