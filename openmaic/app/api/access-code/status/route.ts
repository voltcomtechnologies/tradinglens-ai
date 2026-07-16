import { cookies } from 'next/headers';
import { apiSuccess } from '@/lib/server/api-response';
import { verifyAccessToken, logSecretFingerprintOnce } from '@/lib/server/access-token';

export async function GET() {
  const accessCode = process.env.ACCESS_CODE;
  const enabled = !!accessCode;

  if (enabled) {
    // Log the ACCESS_CODE fingerprint exactly once per cold start so the
    // deployer can confirm env-var parity with the TradingLens deploy log.
    await logSecretFingerprintOnce(accessCode);
  }

  let authenticated = false;
  if (enabled) {
    const cookieStore = await cookies();
    const token = cookieStore.get('openmaic_access')?.value;
    authenticated = !!token && (await verifyAccessToken(token, accessCode));
  }

  return apiSuccess({ enabled, authenticated });
}
