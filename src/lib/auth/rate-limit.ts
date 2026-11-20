import { createHash } from "node:crypto";

/** Attempts allowed per client within the window; the next one is refused. */
export const LOGIN_MAX_ATTEMPTS = 5;
/**
 * Attempts allowed from all clients together within the window (stops IP rotation). Each client
 * contributes at most LOGIN_MAX_ATTEMPTS, so a lockout of everyone needs 20 distinct addresses.
 */
export const LOGIN_GLOBAL_MAX_ATTEMPTS = 100;
export const LOGIN_WINDOW_SECONDS = 15 * 60;

/** Bucket used when the client IP cannot be trusted (anywhere but Vercel). */
export const SHARED_BUCKET = "shared";

export type AttemptCounts = { keyCount: number; globalCount: number };
export type AttemptLimits = { windowSeconds: number; maxPerKey: number };

/**
 * Where attempts are counted. `register` must, atomically:
 *  - store the attempt only while the client is under `maxPerKey` (refused attempts are not
 *    stored, so one client cannot inflate the global count),
 *  - return the client's count including this attempt, and a global count in which each client
 *    contributes at most `maxPerKey`.
 */
export type AttemptStore = {
  register(keyHash: string, limits: AttemptLimits): Promise<AttemptCounts>;
  clear(keyHash: string): Promise<void>;
};

/** IPs are stored only as salted SHA-256 hashes. Rotating SESSION_SECRET resets every bucket. */
export function hashClientKey(ip: string, salt = process.env.SESSION_SECRET ?? ""): string {
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

/**
 * Vercel sets x-real-ip / x-forwarded-for itself, so clients cannot spoof them there. Anywhere else
 * (next start, Docker, another proxy) they are client-controlled, so every client shares one
 * bucket instead of picking its own.
 */
export function getClientIp(headers: Headers, onVercel = process.env.VERCEL === "1"): string {
  if (!onVercel) {
    return SHARED_BUCKET;
  }

  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp;
  }

  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || SHARED_BUCKET;
}

export function isOverLimit({ keyCount, globalCount }: AttemptCounts): boolean {
  return keyCount > LOGIN_MAX_ATTEMPTS || globalCount > LOGIN_GLOBAL_MAX_ATTEMPTS;
}

/**
 * In-memory store with the same semantics as `register_login_attempt`
 * (supabase/migrations/0001_login_attempts.sql). For tests; not shared between server instances.
 */
export function createMemoryAttemptStore(now: () => number = () => Date.now()): AttemptStore {
  let attempts: { keyHash: string; at: number }[] = [];

  return {
    async register(keyHash, { windowSeconds, maxPerKey }) {
      const since = now() - windowSeconds * 1000;
      attempts = attempts.filter((a) => a.at > since);

      const stored = attempts.filter((a) => a.keyHash === keyHash).length;
      if (stored < maxPerKey) {
        attempts.push({ keyHash, at: now() });
      }

      const perKey = new Map<string, number>();
      for (const a of attempts) perKey.set(a.keyHash, (perKey.get(a.keyHash) ?? 0) + 1);
      const globalCount = [...perKey.values()].reduce((sum, n) => sum + Math.min(n, maxPerKey), 0);

      return { keyCount: stored + 1, globalCount };
    },
    async clear(keyHash) {
      attempts = attempts.filter((a) => a.keyHash !== keyHash);
    }
  };
}
