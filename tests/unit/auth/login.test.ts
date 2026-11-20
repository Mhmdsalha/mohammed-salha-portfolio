import { afterEach, describe, expect, it, vi } from "vitest";
import { attemptLogin } from "@/lib/auth/login";
import {
  LOGIN_MAX_ATTEMPTS,
  createMemoryAttemptStore,
  type AttemptStore
} from "@/lib/auth/rate-limit";

const slowWrongPassword = vi.fn(
  () => new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 20))
);

afterEach(() => {
  vi.restoreAllMocks();
  slowWrongPassword.mockClear();
});

describe("attemptLogin", () => {
  it("refuses a parallel burst after 5 attempts without checking the password", async () => {
    const store = createMemoryAttemptStore();

    const outcomes = await Promise.all(
      Array.from({ length: 30 }, () =>
        attemptLogin({ password: "guess", keyHash: "ip-a", store, verify: slowWrongPassword })
      )
    );

    expect(outcomes.filter((o) => o === "invalid")).toHaveLength(LOGIN_MAX_ATTEMPTS);
    expect(outcomes.filter((o) => o === "blocked")).toHaveLength(30 - LOGIN_MAX_ATTEMPTS);
    expect(slowWrongPassword).toHaveBeenCalledTimes(LOGIN_MAX_ATTEMPTS);
  });

  it("refuses the 6th sequential attempt", async () => {
    const store = createMemoryAttemptStore();
    const verify = vi.fn(async () => false);

    for (let i = 0; i < LOGIN_MAX_ATTEMPTS; i++) {
      expect(await attemptLogin({ password: "x", keyHash: "ip-a", store, verify })).toBe("invalid");
    }
    expect(await attemptLogin({ password: "x", keyHash: "ip-a", store, verify })).toBe("blocked");
  });

  it("succeeds with the right password and clears that client's attempts", async () => {
    const store = createMemoryAttemptStore();
    const clear = vi.spyOn(store, "clear");

    expect(
      await attemptLogin({ password: "x", keyHash: "ip-a", store, verify: async () => true })
    ).toBe("ok");
    expect(clear).toHaveBeenCalledWith("ip-a");
  });

  it("fails closed when the counter is unavailable, without checking the password", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const broken: AttemptStore = {
      register: async () => {
        throw new Error("relation login_attempts does not exist");
      },
      clear: async () => undefined
    };
    const verify = vi.fn(async () => true);

    expect(await attemptLogin({ password: "x", keyHash: "ip-a", store: broken, verify })).toBe(
      "unavailable"
    );
    expect(verify).not.toHaveBeenCalled();
  });
});
