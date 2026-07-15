import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * TradingLens → OpenMAIC bridge token.
 *
 * The token format matches OpenMAIC's own `createAccessToken()` in
 * `openmaic/lib/server/access-token.ts` so the deployed OpenMAIC
 * middleware verifies it natively without a custom format patch.
 *
 *   token = `${expiryTimestamp}.${hmac-sha256-hex-of-timestamp}`
 *
 * Secret must equal OpenMAIC's `ACCESS_CODE` env var. We expose it under
 * the friendlier name OPENMAIC_SHARED_SECRET in TradingLens; in
 * deployment docs we tell the user to copy the same value into both.
 */

export const OPENMAIC_TOKEN_TTL_SECONDS = 10 * 60; // 10 minutes

function getSecret(): string {
  const s = process.env.OPENMAIC_SHARED_SECRET;
  if (!s || s.length < 16) {
    throw new Error(
      "OPENMAIC_SHARED_SECRET is not set or is too short (min 16 chars). " +
        "Generate one with `openssl rand -hex 32`. The same value MUST be " +
        "set as ACCESS_CODE in the OpenMAIC deploy."
    );
  }
  return s;
}

export type SignResult = {
  token: string;
  expiresInSeconds: number;
  expiresAt: number; // unix ms
};

export function signOpenmaicToken(
  ttlSeconds: number = OPENMAIC_TOKEN_TTL_SECONDS
): SignResult {
  const clamped = Math.min(ttlSeconds, OPENMAIC_TOKEN_TTL_SECONDS);
  const expiresAt = Date.now() + clamped * 1000;
  const timestamp = expiresAt.toString();
  const signature = createHmac("sha256", getSecret())
    .update(timestamp)
    .digest("hex");
  return {
    token: `${timestamp}.${signature}`,
    expiresInSeconds: clamped,
    expiresAt,
  };
}

export type VerifyResult =
  | { ok: true; expiresAt: number }
  | { ok: false; reason: "malformed" | "bad_signature" | "expired" };

export function verifyOpenmaicToken(token: string): VerifyResult {
  if (!token || typeof token !== "string") return { ok: false, reason: "malformed" };
  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false, reason: "malformed" };

  const [timestamp, signature] = parts;
  const expected = createHmac("sha256", getSecret())
    .update(timestamp)
    .digest("hex");

  const a = Buffer.from(signature, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: "bad_signature" };
  }

  const expiresAt = Number(timestamp);
  if (!Number.isFinite(expiresAt)) return { ok: false, reason: "malformed" };
  if (expiresAt <= Date.now()) return { ok: false, reason: "expired" };
  return { ok: true, expiresAt };
}
