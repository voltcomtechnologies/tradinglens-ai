import { NextRequest, NextResponse } from 'next/server';
import { logSecretFingerprintOnce, verifyAccessToken } from '@/lib/server/access-token';

export async function middleware(request: NextRequest) {
  const accessCode = process.env.ACCESS_CODE;
  if (!accessCode) {
    return NextResponse.next();
  }
  // Log the ACCESS_CODE fingerprint exactly once per cold start so the
  // deployer can confirm env-var parity with the TradingLens deploy log.
  await logSecretFingerprintOnce(accessCode);

  const { pathname } = request.nextUrl;

  // Whitelist: access-code endpoints, health check
  if (pathname.startsWith('/api/access-code/') || pathname === '/api/health') {
    return NextResponse.next();
  }

  // Check cookie — validate HMAC signature, not just existence
  const cookie = request.cookies.get('openmaic_access');
  if (cookie?.value && (await verifyAccessToken(cookie.value, accessCode))) {
    return NextResponse.next();
  }

  // ── TradingLens bridge: if the URL carries `?at=<token>` from a TradingLens
  // Edu Lens deep link, verify the same way and set the cookie via a redirect
  // to the clean URL. The token format matches OpenMAIC's native
  // `${timestamp}.${hemac-hex}` so `verifyToken` above is reused. The token
  // itself has a 10-minute TTL (set at issuance time), so it self-expires even
  // if the cookie outlives it.
  const atFromUrl = request.nextUrl.searchParams.get('at');
  if (atFromUrl && (await verifyAccessToken(atFromUrl, accessCode))) {
    const cleanUrl = request.nextUrl.clone();
    cleanUrl.searchParams.delete('at');
    const response = NextResponse.redirect(cleanUrl);
    response.cookies.set('openmaic_access', atFromUrl, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days; the in-token timestamp also enforces expiry
      secure: process.env.NODE_ENV === 'production',
    });
    return response;
  }

  // API requests without valid cookie → 401
  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      { success: false, errorCode: 'INVALID_REQUEST', error: 'Access code required' },
      { status: 401 },
    );
  }

  // Page requests → let through, frontend shows modal
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logos/|avatars/).*)'],
};
