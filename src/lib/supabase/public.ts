import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Anon client for public reads (D1-2, D-008): no cookies, so row-level security sees an
 * anonymous visitor and returns only public rows, and D1-4 can cache its reads.
 */
export async function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing public Supabase environment variables.");
  }

  return createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
