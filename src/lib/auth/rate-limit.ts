import { createHash } from "node:crypto";

/** Attempts allowed per client within the window; the next one is refused. */
export const LOGIN_MAX_ATTEMPTS = 5;
/** Attempts allowed from all clients together within the window (stops IP rotation). */
export const LOGIN_GLOBAL_MAX_ATTEMPTS = 100;
export const LOGIN_WINDOW_SECONDS = 15 * 60;

/** Bucket used when the client IP cannot be trusted (anywhere but Vercel). */
export const SHARED_BUCKET = "shared";

export type AttemptCounts = { keyCount: number; globalCount: number };

/**
 * Where attempts are counted. `register` must record the attempt and return counts that include
 * it atomically, so parallel requests cannot all see a count under the limit.
 */
export type AttemptStore = {
  register(keyHash: string, windowSeconds: number): Promise<AttemptCounts>;
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

/** In-memory store for tests and local reasoning. Not shared between server instances. */
export function createMemoryAttemptStore(now: () => number = () => Date.now()): AttemptStore {
  let attempts: { keyHash: string; at: number }[] = [];

  return {
    async register(keyHash, windowSeconds) {
      const since = now() - windowSeconds * 1000;
      attempts = [...attempts.filter((a) => a.at > since), { keyHash, at: now() }];
      return {
        keyCount: attempts.filter((a) => a.keyHash === keyHash).length,
        globalCount: attempts.length
      };
    },
    async clear(keyHash) {
      attempts = attempts.filter((a) => a.keyHash !== keyHash);
    }
  };
}
