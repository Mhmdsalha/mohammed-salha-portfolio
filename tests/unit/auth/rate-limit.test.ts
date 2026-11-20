import { describe, expect, it } from "vitest";
import {
  LOGIN_GLOBAL_MAX_ATTEMPTS,
  LOGIN_MAX_ATTEMPTS,
  LOGIN_WINDOW_SECONDS,
  SHARED_BUCKET,
  createMemoryAttemptStore,
  getClientIp,
  hashClientKey,
  isOverLimit
} from "@/lib/auth/rate-limit";

const LIMITS = { windowSeconds: LOGIN_WINDOW_SECONDS, maxPerKey: LOGIN_MAX_ATTEMPTS };

describe("isOverLimit", () => {
  it("allows 5 attempts per client and refuses the 6th", () => {
    expect(isOverLimit({ keyCount: LOGIN_MAX_ATTEMPTS, globalCount: 5 })).toBe(false);
    expect(isOverLimit({ keyCount: LOGIN_MAX_ATTEMPTS + 1, globalCount: 6 })).toBe(true);
  });

  it("refuses everyone once the global limit is passed (IP rotation)", () => {
    expect(isOverLimit({ keyCount: 1, globalCount: LOGIN_GLOBAL_MAX_ATTEMPTS + 1 })).toBe(true);
  });
});

describe("memory attempt store", () => {
  it("counts per client and globally, including the attempt being registered", async () => {
    const store = createMemoryAttemptStore();
    expect(await store.register("a", LIMITS)).toEqual({
      keyCount: 1,
      globalCount: 1
    });
    expect(await store.register("a", LIMITS)).toEqual({
      keyCount: 2,
      globalCount: 2
    });
    expect(await store.register("b", LIMITS)).toEqual({
      keyCount: 1,
      globalCount: 3
    });
  });

  it("forgets attempts outside the window and after clear", async () => {
    let now = 0;
    const store = createMemoryAttemptStore(() => now);
    await store.register("a", LIMITS);
    now += LOGIN_WINDOW_SECONDS * 1000 + 1;
    expect((await store.register("a", LIMITS)).keyCount).toBe(1);
    await store.clear("a");
    expect((await store.register("a", LIMITS)).keyCount).toBe(1);
  });

  it("does not store refused attempts, so one client cannot lock out everyone (re-review N1)", async () => {
    const store = createMemoryAttemptStore();

    for (let i = 0; i < 500; i++) await store.register("attacker", LIMITS);
    const admin = await store.register("admin", LIMITS);

    expect(admin).toEqual({ keyCount: 1, globalCount: LOGIN_MAX_ATTEMPTS + 1 });
    expect(isOverLimit(admin)).toBe(false);
  });

  it("locks everyone out only once enough distinct clients are at their limit", async () => {
    const store = createMemoryAttemptStore();
    const clientsNeeded = LOGIN_GLOBAL_MAX_ATTEMPTS / LOGIN_MAX_ATTEMPTS;

    for (let c = 0; c < clientsNeeded; c++) {
      for (let i = 0; i < LOGIN_MAX_ATTEMPTS; i++) await store.register(`ip-${c}`, LIMITS);
    }

    expect(isOverLimit(await store.register("admin", LIMITS))).toBe(true);
  });
});

describe("client key", () => {
  const headers = new Headers({ "x-real-ip": "1.1.1.1", "x-forwarded-for": "2.2.2.2, 10.0.0.1" });

  it("on Vercel, prefers x-real-ip, then the first x-forwarded-for hop", () => {
    expect(getClientIp(headers, true)).toBe("1.1.1.1");
    expect(getClientIp(new Headers({ "x-forwarded-for": "2.2.2.2, 10.0.0.1" }), true)).toBe(
      "2.2.2.2"
    );
    expect(getClientIp(new Headers(), true)).toBe(SHARED_BUCKET);
  });

  it("off Vercel, ignores spoofable headers and uses one shared bucket", () => {
    expect(getClientIp(headers, false)).toBe(SHARED_BUCKET);
    expect(getClientIp(new Headers({ "x-real-ip": "203.0.113.77" }), false)).toBe(SHARED_BUCKET);
  });

  it("stores a salted hash, never the raw IP", () => {
    const hash = hashClientKey("1.1.1.1", "salt");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain("1.1.1.1");
    expect(hashClientKey("1.1.1.1", "other-salt")).not.toBe(hash);
  });
});
