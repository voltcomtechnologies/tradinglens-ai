import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const user = req.auth?.user;
  const pathname = nextUrl.pathname;

  // Public routes
  const isPublicRoute = ["/", "/auth/signin", "/auth/signup", "/auth/error", "/api/auth"].some((route) =>
    pathname.startsWith(route)
  );

  // API routes (except auth) should be handled by API auth
  const isAuthApi = pathname.startsWith("/api/auth/");

  if (isAuthApi) return NextResponse.next();
  if (isPublicRoute) return NextResponse.next();

  // Require auth for protected routes
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/auth/signin", nextUrl));
  }

  // Admin route protection
  if (pathname.startsWith("/admin") && user?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};
