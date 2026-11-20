import {
  LOGIN_MAX_ATTEMPTS,
  LOGIN_WINDOW_SECONDS,
  isOverLimit,
  type AttemptStore
} from "@/lib/auth/rate-limit";

export type LoginOutcome = "ok" | "invalid" | "blocked" | "unavailable";

/**
 * The login decision, separate from cookies and headers so it can be tested.
 * The attempt is recorded BEFORE the password is checked, so a burst of parallel requests is
 * counted in full and the 6th and later are refused without running bcrypt.
 */
export async function attemptLogin(input: {
  password: string;
  keyHash: string;
  store: AttemptStore;
  verify: (password: string) => Promise<boolean>;
}): Promise<LoginOutcome> {
  let counts;

  try {
    counts = await input.store.register(input.keyHash, {
      windowSeconds: LOGIN_WINDOW_SECONDS,
      maxPerKey: LOGIN_MAX_ATTEMPTS
    });
  } catch (error) {
    // Without a working counter the password could be brute-forced, so fail closed.
    console.error("Login rate limiter unavailable:", error);
    return "unavailable";
  }

  if (isOverLimit(counts)) {
    return "blocked";
  }

  if (!(await input.verify(input.password))) {
    return "invalid";
  }

  try {
    await input.store.clear(input.keyHash);
  } catch (error) {
    console.error("Could not clear login attempts after success:", error);
  }

  return "ok";
}
