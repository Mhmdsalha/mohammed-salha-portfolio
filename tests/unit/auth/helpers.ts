import { SignJWT } from "jose/jwt/sign";
import { SESSION_TTL_SECONDS, createSessionToken, getSessionKey } from "@/lib/auth/session";

export const TEST_SECRET = "test-secret-that-is-at-least-32-characters-long";
export const OTHER_SECRET = "another-secret-that-is-also-32-characters-long!";

function base64url(value: object) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

export async function validToken(secret = TEST_SECRET) {
  return createSessionToken(getSessionKey(secret)!);
}

/** Every way an attacker might try to get past the session check. */
export async function forgedTokens(): Promise<Record<string, string>> {
  const now = Math.floor(Date.now() / 1000);
  const key = getSessionKey(TEST_SECRET)!;
  const valid = await validToken();
  const [header, , signature] = valid.split(".");

  return {
    "legacy constant value": "authenticated",
    "signed with another secret": await validToken(OTHER_SECRET),
    "alg none, no signature": `${base64url({ alg: "none", typ: "JWT" })}.${base64url({ sub: "admin", iat: now, exp: now + 3600 })}.`,
    "payload swapped, old signature": `${header}.${base64url({ sub: "admin", iat: now, exp: now + 10 * SESSION_TTL_SECONDS })}.${signature}`,
    expired: await new SignJWT({})
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("admin")
      .setIssuedAt(now - 2 * SESSION_TTL_SECONDS)
      .setExpirationTime(now - SESSION_TTL_SECONDS)
      .sign(key),
    "wrong subject": await new SignJWT({})
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("visitor")
      .setIssuedAt(now)
      .setExpirationTime(now + 3600)
      .sign(key),
    "correctly signed but older than 8 h, with a far exp": await new SignJWT({})
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("admin")
      .setIssuedAt(now - SESSION_TTL_SECONDS - 60)
      .setExpirationTime(now + 365 * 24 * 60 * 60)
      .sign(key),
    "empty string": ""
  };
}
