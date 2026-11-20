import type { AttemptStore } from "@/lib/auth/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

const RETENTION_MS = 24 * 60 * 60 * 1000;

/** Failed-login store in the `login_attempts` table (supabase/migrations/0001_login_attempts.sql). */
export function createSupabaseAttemptStore(): AttemptStore {
  const supabase = createAdminClient();

  return {
    async countFailuresSince(keyHash, since) {
      const { count, error } = await supabase
        .from("login_attempts")
        .select("id", { count: "exact", head: true })
        .eq("key_hash", keyHash)
        .gte("attempted_at", since.toISOString());

      if (error) {
        throw error;
      }

      return count ?? 0;
    },
    async recordFailure(keyHash, at) {
      const { error } = await supabase
        .from("login_attempts")
        .insert({ key_hash: keyHash, attempted_at: at.toISOString() });

      if (error) {
        throw error;
      }

      // Keep the table small: drop rows older than a day. Failure here is not fatal.
      await supabase
        .from("login_attempts")
        .delete()
        .lt("attempted_at", new Date(at.getTime() - RETENTION_MS).toISOString());
    },
    async clear(keyHash) {
      const { error } = await supabase.from("login_attempts").delete().eq("key_hash", keyHash);

      if (error) {
        throw error;
      }
    }
  };
}
