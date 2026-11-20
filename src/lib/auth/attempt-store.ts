import type { AttemptCounts, AttemptStore } from "@/lib/auth/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

type RpcClient = {
  rpc(
    fn: "register_login_attempt",
    args: { p_key_hash: string; p_window_seconds: number; p_max_per_key: number }
  ): PromiseLike<{ data: unknown; error: unknown }>;
  from(table: "login_attempts"): {
    delete(): { eq(column: "key_hash", value: string): PromiseLike<{ error: unknown }> };
  };
};

/** Validates the RPC result strictly: anything unexpected is an error, never "zero attempts". */
export function parseAttemptCounts(data: unknown): AttemptCounts {
  const row = Array.isArray(data) ? data[0] : null;
  const keyCount = row?.key_count;
  const globalCount = row?.global_count;

  if (!Number.isInteger(keyCount) || !Number.isInteger(globalCount) || keyCount < 1) {
    throw new Error(
      `register_login_attempt returned an unexpected result: ${JSON.stringify(data)}`
    );
  }

  return { keyCount, globalCount };
}

/**
 * Store backed by `login_attempts` and the `register_login_attempt` function
 * (supabase/migrations/0001_login_attempts.sql). A missing table or function makes PostgREST
 * return an error, which `register` rethrows, so login fails closed.
 */
export function createSupabaseAttemptStore(
  client: RpcClient = createAdminClient() as unknown as RpcClient
): AttemptStore {
  return {
    async register(keyHash, { windowSeconds, maxPerKey }) {
      const { data, error } = await client.rpc("register_login_attempt", {
        p_key_hash: keyHash,
        p_window_seconds: windowSeconds,
        p_max_per_key: maxPerKey
      });

      if (error) {
        throw error;
      }

      return parseAttemptCounts(data);
    },
    async clear(keyHash) {
      const { error } = await client.from("login_attempts").delete().eq("key_hash", keyHash);

      if (error) {
        throw error;
      }
    }
  };
}
