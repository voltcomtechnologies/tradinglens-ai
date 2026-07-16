function encode(str: string): BufferSource {
  return new TextEncoder().encode(str) as BufferSource;
}

/** Constant-time comparison for equal-length Uint8Arrays. */
export function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.byteLength !== b.byteLength) return false;
  let mismatch = 0;
  for (let i = 0; i < a.byteLength; i++) {
    mismatch |= a[i] ^ b[i];
  }
  return mismatch === 0;
}

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function importHmacKey(accessCode: string): Promise<CryptoKey> {
  return globalThis.crypto.subtle.importKey(
    'raw',
    encode(accessCode),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

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
export async function secretFingerprint(s: string): Promise<string> {
  if (!s || s.length < 14) return '<secret missing or too short to fingerprint>';
  const digest = await globalThis.crypto.subtle.digest('SHA-256', encode(s));
  const hex = bufToHex(digest);
  return `${hex.slice(0, 8)}\u2026${hex.slice(8, 12)}`;
}

let loggedFingerprint = false;
export async function logSecretFingerprintOnce(accessCode: string): Promise<void> {
  if (loggedFingerprint) return;
  loggedFingerprint = true;
  // Tagged so the user can `vercel logs --prod | grep openmaic-secret-fingerprint`
  // and confirm parity with the same tagged log emitted by the TradingLens deploy.
  const fingerprint = await secretFingerprint(accessCode);
  console.info(
    `[openmaic-secret-fingerprint] OpenMAIC ACCESS_CODE = ${fingerprint} (length=${accessCode.length}) \u2014 compare against the same tag in the TradingLens deploy logs to confirm env-var parity.`
  );
}

/** Create an HMAC-signed token: `timestamp.signature` */
export async function createAccessToken(accessCode: string): Promise<string> {
  const timestamp = Date.now().toString();
  const key = await importHmacKey(accessCode);
  const signature = bufToHex(await globalThis.crypto.subtle.sign('HMAC', key, encode(timestamp)));
  return `${timestamp}.${signature}`;
}

/** Verify an HMAC-signed token against the access code */
export async function verifyAccessToken(token: string, accessCode: string): Promise<boolean> {
  const dotIndex = token.indexOf('.');
  if (dotIndex === -1) return false;

  const timestamp = token.substring(0, dotIndex);
  const signature = token.substring(dotIndex + 1);

  // Validate signature is a hex string of reasonable length
  if (!/^[0-9a-fA-F]+$/.test(signature) || signature.length % 2 !== 0) {
    return false;
  }

  const key = await importHmacKey(accessCode);

  // Convert hex signature to Uint8Array for Web Crypto verify
  const sigBuf = new Uint8Array(signature.length / 2);
  for (let i = 0; i < signature.length; i += 2) {
    sigBuf[i / 2] = parseInt(signature.slice(i, i + 2), 16);
  }

  return globalThis.crypto.subtle.verify('HMAC', key, sigBuf, encode(timestamp));
}
