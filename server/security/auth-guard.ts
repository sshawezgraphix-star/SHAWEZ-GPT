/**
 * Cryptographic Authentication & Session Token Guard
 */

import crypto from "crypto";

const JWT_SECRET = process.env.SESSION_SECRET || "shawezgpt_dev_sec_key_48f8a12c";

export interface SessionTokenPayload {
  userId: string;
  email: string;
  role: string;
  issuedAt: number;
  expiresAt: number;
}

/**
 * Creates a cryptographically signed HMAC token for authentication
 */
export function generateSignedSessionToken(userId: string, email: string, role: string = "user"): string {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + 7 * 24 * 60 * 60 * 1000; // 7 days
  const payload: SessionTokenPayload = {
    userId,
    email,
    role,
    issuedAt,
    expiresAt,
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(payloadBase64)
    .digest("base64url");

  return `sgpt.${payloadBase64}.${signature}`;
}

/**
 * Verifies the token using constant-time timing-safe buffer comparison and checks expiration.
 */
export function verifySessionToken(token: string): { valid: boolean; payload?: SessionTokenPayload; error?: string } {
  if (!token || typeof token !== "string") {
    return { valid: false, error: "Missing token" };
  }

  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "sgpt") {
    return { valid: false, error: "Invalid token format" };
  }

  const [, payloadBase64, providedSignature] = parts;

  // Compute expected signature
  const expectedSignature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(payloadBase64)
    .digest("base64url");

  // Constant-time comparison to prevent timing attacks
  const providedBuf = Buffer.from(providedSignature);
  const expectedBuf = Buffer.from(expectedSignature);

  if (providedBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(providedBuf, expectedBuf)) {
    return { valid: false, error: "Invalid token signature" };
  }

  try {
    const payloadJson = Buffer.from(payloadBase64, "base64url").toString("utf8");
    const payload: SessionTokenPayload = JSON.parse(payloadJson);

    if (Date.now() > payload.expiresAt) {
      return { valid: false, error: "Token has expired" };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false, error: "Failed to parse token payload" };
  }
}
