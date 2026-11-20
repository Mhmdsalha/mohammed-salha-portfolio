import { describe, expect, it } from "vitest";
import {
  LOGIN_MAX_FAILURES,
  LOGIN_WINDOW_MS,
  createLoginLimiter,
  createMemoryAttemptStore,
  getClientIp,
  hashClientKey
} from "@/lib/auth/rate-limit";

function setup() {
  let now = new Date("2026-11-20T12:00:00Z");
  const limiter = createLoginLimiter(createMemoryAttemptStore(), () => now);
  return {
    limiter,
    advance(ms: number) {
      now = new Date(now.getTime() + ms);
    }
  };
}

describe("login rate limit", () => {
  it("allows 5 failed attempts and blocks the 6th", async () => {
    const { limiter } = setup();

    for (let attempt = 1; attempt <= LOGIN_MAX_FAILURES; attempt++) {
      expect(await limiter.isBlocked("ip-a"), `attempt ${attempt}`).toBe(false);
      await limiter.recordFailure("ip-a");
    }

    expect(await limiter.isBlocked("ip-a")).toBe(true);
  });

  it("counts each client separately", async () => {
    const { limiter } = setup();
    for (let i = 0; i < LOGIN_MAX_FAILURES; i++) await limiter.recordFailure("ip-a");

    expect(await limiter.isBlocked("ip-b")).toBe(false);
  });

  it("unblocks once the 15-minute window has passed", async () => {
    const { limiter, advance } = setup();
    for (let i = 0; i < LOGIN_MAX_FAILURES; i++) await limiter.recordFailure("ip-a");

    advance(LOGIN_WINDOW_MS - 1000);
    expect(await limiter.isBlocked("ip-a")).toBe(true);
    advance(2000);
    expect(await limiter.isBlocked("ip-a")).toBe(false);
  });

  it("clears failures after a successful login", async () => {
    const { limiter } = setup();
    for (let i = 0; i < LOGIN_MAX_FAILURES - 1; i++) await limiter.recordFailure("ip-a");

    await limiter.recordSuccess("ip-a");
    await limiter.recordFailure("ip-a");
    expect(await limiter.isBlocked("ip-a")).toBe(false);
  });
});

describe("client key", () => {
  it("prefers x-real-ip, then the first x-forwarded-for hop", () => {
    expect(getClientIp(new Headers({ "x-real-ip": "1.1.1.1", "x-forwarded-for": "2.2.2.2" }))).toBe(
      "1.1.1.1"
    );
    expect(getClientIp(new Headers({ "x-forwarded-for": "2.2.2.2, 10.0.0.1" }))).toBe("2.2.2.2");
    expect(getClientIp(new Headers())).toBe("unknown");
  });

  it("stores a salted hash, never the raw IP", () => {
    const hash = hashClientKey("1.1.1.1", "salt");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain("1.1.1.1");
    expect(hashClientKey("1.1.1.1", "other-salt")).not.toBe(hash);
  });
});
