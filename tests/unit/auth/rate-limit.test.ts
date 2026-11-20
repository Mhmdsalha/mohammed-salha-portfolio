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
    expect(await store.register("a", LOGIN_WINDOW_SECONDS)).toEqual({
      keyCount: 1,
      globalCount: 1
    });
    expect(await store.register("a", LOGIN_WINDOW_SECONDS)).toEqual({
      keyCount: 2,
      globalCount: 2
    });
    expect(await store.register("b", LOGIN_WINDOW_SECONDS)).toEqual({
      keyCount: 1,
      globalCount: 3
    });
  });

  it("forgets attempts outside the window and after clear", async () => {
    let now = 0;
    const store = createMemoryAttemptStore(() => now);
    await store.register("a", LOGIN_WINDOW_SECONDS);
    now += LOGIN_WINDOW_SECONDS * 1000 + 1;
    expect((await store.register("a", LOGIN_WINDOW_SECONDS)).keyCount).toBe(1);
    await store.clear("a");
    expect((await store.register("a", LOGIN_WINDOW_SECONDS)).keyCount).toBe(1);
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
