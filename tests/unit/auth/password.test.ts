import bcrypt from "bcryptjs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { decodePasswordHash, verifyDashboardPassword } from "@/lib/auth/password";

const PASSWORD = "correct horse battery staple";
const HASH = bcrypt.hashSync(PASSWORD, 4);
const ENCODED = Buffer.from(HASH, "utf8").toString("base64");

afterEach(() => vi.restoreAllMocks());

describe("decodePasswordHash (R16)", () => {
  it("decodes a base64-encoded bcrypt hash", () => {
    expect(decodePasswordHash(ENCODED)).toBe(HASH);
  });

  it("rejects a raw hash, which .env expansion would corrupt", () => {
    expect(decodePasswordHash(HASH)).toBeNull();
  });

  it("rejects a hash truncated by $ expansion", () => {
    const truncated = Buffer.from("$2b", "utf8").toString("base64");
    expect(decodePasswordHash(truncated)).toBeNull();
  });

  it("rejects missing values", () => {
    expect(decodePasswordHash(undefined)).toBeNull();
    expect(decodePasswordHash("")).toBeNull();
  });
});

describe("verifyDashboardPassword", () => {
  it("accepts the right password", async () => {
    expect(await verifyDashboardPassword(PASSWORD, ENCODED)).toBe(true);
  });

  it("rejects a wrong password", async () => {
    expect(await verifyDashboardPassword("wrong", ENCODED)).toBe(false);
    expect(await verifyDashboardPassword("", ENCODED)).toBe(false);
  });

  it("fails closed without a valid hash", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(await verifyDashboardPassword(PASSWORD, undefined)).toBe(false);
    expect(await verifyDashboardPassword(PASSWORD, "not-base64-bcrypt")).toBe(false);
  });
});
