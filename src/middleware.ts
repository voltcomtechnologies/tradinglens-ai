import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Next-Auth v5 session cookie names (JWE-encrypted, verified server-side)
const SESSION_COOKIE_NAMES = [
  "__Secure-authjs.session-token",  // production (HTTPS)
  "authjs.session-token",           // development / preview
];

export default function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const pathname = nextUrl.pathname;

  // Allow public routes through
  const isPublicRoute = [
    "/",
    "/auth/signin",
    "/auth/signup",
    "/auth/error",
    "/api/auth",
  ].some((route) => pathname.startsWith(route));

  if (isPublicRoute) return NextResponse.next();

  // Check for session cookie (any variant)
  const hasSession = SESSION_COOKIE_NAMES.some(
    (name) => request.cookies.get(name)?.value
  );

  if (!hasSession) {
    const signInUrl = new URL("/auth/signin", nextUrl);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};
