// Edge-safe: imported by middleware.ts. Only jose and Web APIs here, no Node built-ins.
import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";

export const SESSION_COOKIE = "dashboard_session";
/** The old forgeable cookie (`dashboard_token=authenticated`). Never trusted; only cleared. */
export const LEGACY_SESSION_COOKIE = "dashboard_token";
export const SESSION_TTL_SECONDS = 60 * 60 * 8;

const ALGORITHM = "HS256";
const SUBJECT = "admin";
const MIN_SECRET_LENGTH = 32;

export type AdminSession = {
  sub: typeof SUBJECT;
  iat: number;
  exp: number;
};

/**
 * Returns the HMAC key, or null when SESSION_SECRET is missing or shorter than 32 characters.
 * Callers must treat null as "nobody is signed in" (fail closed).
 */
export function getSessionKey(secret = process.env.SESSION_SECRET): Uint8Array | null {
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    return null;
  }

  return new TextEncoder().encode(secret);
}

export async function createSessionToken(key: Uint8Array, now = new Date()): Promise<string> {
  const issuedAt = Math.floor(now.getTime() / 1000);

  return new SignJWT({})
    .setProtectedHeader({ alg: ALGORITHM, typ: "JWT" })
    .setSubject(SUBJECT)
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + SESSION_TTL_SECONDS)
    .sign(key);
}

export async function verifySessionToken(
  token: string | undefined,
  key: Uint8Array | null
): Promise<AdminSession | null> {
  if (!token || !key) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: [ALGORITHM],
      subject: SUBJECT,
      requiredClaims: ["iat", "exp"],
      // Defence in depth: even a correctly signed token is refused once it is older than 8 h,
      // whatever its exp says.
      maxTokenAge: SESSION_TTL_SECONDS,
      clockTolerance: 5
    });

    return { sub: SUBJECT, iat: payload.iat as number, exp: payload.exp as number };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: SESSION_TTL_SECONDS
};
