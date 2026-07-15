import { createHmac, timingSafeEqual, createHash } from 'crypto';

/**
 * Render a non-sensitive fingerprint of the ACCESS_CODE so a deployer can
 * confirm env-var parity by running
 *   `vercel logs --prod | grep openmaic-secret-fingerprint`
 * on both projects and eyeball-comparing the two hashes. The fingerprint is
 * a SHA-256 of the secret bytes truncated to 12 hex chars: the same secret
 * on both projects produces identical fingerprints, but no byte of the
 * secret itself is ever written to a log. The TradingLens side emits the
 * same format via `src/lib/openmaic-token.ts` so the two logs are directly
 * comparable.
 */
export function secretFingerprint(s: string): string {
  if (!s || s.length < 14) return '<secret missing or too short to fingerprint>';
  const hex = createHash('sha256').update(s, 'utf8').digest('hex');
  return `${hex.slice(0, 8)}\u2026${hex.slice(8, 12)}`;
}

let loggedFingerprint = false;
export function logSecretFingerprintOnce(accessCode: string): void {
  if (loggedFingerprint) return;
  loggedFingerprint = true;
  // Tagged so the user can `vercel logs --prod | grep openmaic-secret-fingerprint`
  // and confirm parity with the same tagged log emitted by the TradingLens deploy.
  console.info(
    `[openmaic-secret-fingerprint] OpenMAIC ACCESS_CODE = ${secretFingerprint(
      accessCode
    )} (length=${accessCode.length}) \u2014 compare against the same tag in the TradingLens deploy logs to confirm env-var parity.`
  );
}

/** Create an HMAC-signed token: `timestamp.signature` */
export function createAccessToken(accessCode: string): string {
  const timestamp = Date.now().toString();
  const signature = createHmac('sha256', accessCode).update(timestamp).digest('hex');
  return `${timestamp}.${signature}`;
}

/** Verify an HMAC-signed token against the access code */
export function verifyAccessToken(token: string, accessCode: string): boolean {
  const dotIndex = token.indexOf('.');
  if (dotIndex === -1) return false;

  const timestamp = token.substring(0, dotIndex);
  const signature = token.substring(dotIndex + 1);

  const expected = createHmac('sha256', accessCode).update(timestamp).digest('hex');

  const sigBuf = Buffer.from(signature, 'hex');
  const expBuf = Buffer.from(expected, 'hex');
  if (sigBuf.length !== expBuf.length) return false;

  return timingSafeEqual(sigBuf, expBuf);
}
