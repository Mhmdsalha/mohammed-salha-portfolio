import { describe, expect, it } from "vitest";
import { createSupabaseAttemptStore, parseAttemptCounts } from "@/lib/auth/attempt-store";

function fakeClient(result: { data: unknown; error: unknown }) {
  return {
    rpc: async () => result,
    from: () => ({ delete: () => ({ eq: async () => ({ error: null }) }) })
  };
}

describe("parseAttemptCounts", () => {
  it("reads the function's row", () => {
    expect(parseAttemptCounts([{ key_count: 3, global_count: 9 }])).toEqual({
      keyCount: 3,
      globalCount: 9
    });
  });

  it("treats anything unexpected as an error, never as zero attempts", () => {
    for (const data of [
      null,
      undefined,
      [],
      {},
      [{}],
      [{ key_count: null, global_count: 1 }],
      [{ key_count: 0, global_count: 0 }],
      [{ key_count: "1", global_count: 1 }]
    ]) {
      expect(() => parseAttemptCounts(data), JSON.stringify(data)).toThrow();
    }
  });
});

describe("Supabase attempt store (A7 finding 1)", () => {
  it("throws when the function or table is missing", async () => {
    const store = createSupabaseAttemptStore(
      fakeClient({ data: null, error: { code: "PGRST202", message: "function not found" } })
    );
    await expect(store.register("k", 900)).rejects.toMatchObject({ code: "PGRST202" });
  });

  it("throws on an empty success, like a 404 with no body", async () => {
    const store = createSupabaseAttemptStore(fakeClient({ data: null, error: null }));
    await expect(store.register("k", 900)).rejects.toThrow("unexpected result");
  });

  it("returns counts on success", async () => {
    const store = createSupabaseAttemptStore(
      fakeClient({ data: [{ key_count: 1, global_count: 4 }], error: null })
    );
    expect(await store.register("k", 900)).toEqual({ keyCount: 1, globalCount: 4 });
  });
});
