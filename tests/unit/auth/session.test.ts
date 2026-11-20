import { describe, expect, it } from "vitest";
import { getSessionKey, verifySessionToken } from "@/lib/auth/session";
import { TEST_SECRET, forgedTokens, validToken } from "./helpers";

describe("getSessionKey", () => {
  it("rejects a missing or short secret", () => {
    expect(getSessionKey(undefined)).toBeNull();
    expect(getSessionKey("")).toBeNull();
    expect(getSessionKey("x".repeat(31))).toBeNull();
    expect(getSessionKey("x".repeat(32))).toBeInstanceOf(Uint8Array);
  });
});

describe("verifySessionToken", () => {
  const key = getSessionKey(TEST_SECRET);

  it("accepts a token it signed", async () => {
    const session = await verifySessionToken(await validToken(), key);
    expect(session?.sub).toBe("admin");
    expect(session!.exp - session!.iat).toBe(8 * 60 * 60);
  });

  it("rejects every forged token", async () => {
    for (const [name, token] of Object.entries(await forgedTokens())) {
      expect(await verifySessionToken(token, key), name).toBeNull();
    }
  });

  it("fails closed when no key is configured", async () => {
    expect(await verifySessionToken(await validToken(), null)).toBeNull();
  });

  it("logs everyone out when the secret rotates", async () => {
    const token = await validToken();
    const rotated = getSessionKey("a-brand-new-secret-after-rotation-32+chars");
    expect(await verifySessionToken(token, rotated)).toBeNull();
  });
});
