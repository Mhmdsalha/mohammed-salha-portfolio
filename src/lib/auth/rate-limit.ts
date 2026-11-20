import { createHash } from "node:crypto";

export const LOGIN_MAX_FAILURES = 5;
export const LOGIN_WINDOW_MS = 15 * 60 * 1000;

/** Where failed attempts are counted. Production uses Supabase; tests use memory. */
export type AttemptStore = {
  countFailuresSince(keyHash: string, since: Date): Promise<number>;
  recordFailure(keyHash: string, at: Date): Promise<void>;
  clear(keyHash: string): Promise<void>;
};

/** IPs are stored only as salted SHA-256 hashes. */
export function hashClientKey(ip: string, salt = process.env.SESSION_SECRET ?? ""): string {
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

/**
 * Vercel sets x-real-ip and overwrites x-forwarded-for, so a client cannot spoof either there.
 * Elsewhere the first x-forwarded-for hop is the best available signal.
 */
export function getClientIp(headers: Headers): string {
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp;
  }

  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || "unknown";
}

export function createLoginLimiter(store: AttemptStore, now: () => Date = () => new Date()) {
  return {
    async isBlocked(keyHash: string): Promise<boolean> {
      const since = new Date(now().getTime() - LOGIN_WINDOW_MS);
      const failures = await store.countFailuresSince(keyHash, since);
      return failures >= LOGIN_MAX_FAILURES;
    },
    async recordFailure(keyHash: string): Promise<void> {
      await store.recordFailure(keyHash, now());
    },
    async recordSuccess(keyHash: string): Promise<void> {
      await store.clear(keyHash);
    }
  };
}

export function createMemoryAttemptStore(): AttemptStore {
  const attempts = new Map<string, Date[]>();

  return {
    async countFailuresSince(keyHash, since) {
      return (attempts.get(keyHash) ?? []).filter((at) => at >= since).length;
    },
    async recordFailure(keyHash, at) {
      attempts.set(keyHash, [...(attempts.get(keyHash) ?? []), at]);
    },
    async clear(keyHash) {
      attempts.delete(keyHash);
    }
  };
}
