// The committed src/types/database.ts must be exactly what scripts/gen-db-types.mjs generates
// from supabase/migrations (D1-2 "generated Supabase types", D-028). A migration changed without
// regenerating the types fails here, and so in CI.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { OUTPUT, generateDatabaseTypes } from "../../../scripts/gen-db-types.mjs";

describe("src/types/database.ts", () => {
  it("matches the migrations (run `node scripts/gen-db-types.mjs` after changing one)", async () => {
    expect(readFileSync(OUTPUT, "utf8")).toBe(await generateDatabaseTypes());
  }, 60_000);
});
