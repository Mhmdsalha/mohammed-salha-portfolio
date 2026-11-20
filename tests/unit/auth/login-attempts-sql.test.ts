// Runs supabase/migrations/0001_login_attempts.sql in a real Postgres engine (PGlite, WASM)
// to check its syntax, counting and permissions without a Supabase project.
import { readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const migration = readFileSync(
  path.resolve(__dirname, "../../../supabase/migrations/0001_login_attempts.sql"),
  "utf8"
);

let db: PGlite;

async function register(key: string, windowSeconds = 900) {
  const { rows } = await db.query<{ key_count: number; global_count: number }>(
    "select * from public.register_login_attempt($1, $2)",
    [key, windowSeconds]
  );
  return rows[0];
}

beforeAll(async () => {
  db = new PGlite();
  // Supabase's API roles, which the migration grants and revokes against. As in Supabase,
  // service_role bypasses RLS; anon and authenticated do not.
  await db.exec("create role anon; create role authenticated; create role service_role bypassrls;");
  await db.exec("grant usage on schema public to anon, authenticated, service_role;");
  await db.exec(migration);
  await db.exec("grant all on public.login_attempts to service_role;");
}, 30_000);

afterAll(async () => {
  await db?.close();
});

describe("0001_login_attempts.sql", () => {
  it("applies twice without error (idempotent)", async () => {
    await expect(db.exec(migration)).resolves.toBeDefined();
  });

  it("records each attempt and returns counts that include it", async () => {
    expect(await register("a")).toEqual({ key_count: 1, global_count: 1 });
    expect(await register("a")).toEqual({ key_count: 2, global_count: 2 });
    expect(await register("b")).toEqual({ key_count: 1, global_count: 3 });
  });

  it("only counts attempts inside the window and prunes rows older than a day", async () => {
    await db.exec(
      "insert into public.login_attempts (key_hash, attempted_at) values ('c', now() - interval '20 minutes'), ('c', now() - interval '2 days');"
    );
    expect((await register("c")).key_count).toBe(1);
    const { rows } = await db.query<{ n: number }>(
      "select count(*)::int as n from public.login_attempts where key_hash = 'c'"
    );
    expect(rows[0].n).toBe(2); // the 2-day-old row is gone; the 20-minute-old one stays
  });

  it("denies anon and authenticated access to the table and the function", async () => {
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`set role ${role};`);
      await expect(db.query("select * from public.login_attempts"), role).rejects.toThrow(
        /permission denied/
      );
      await expect(
        db.query("select * from public.register_login_attempt('x', 900)"),
        role
      ).rejects.toThrow(/permission denied/);
      await db.exec("reset role;");
    }
  });

  it("lets the service role call the function", async () => {
    await db.exec("set role service_role;");
    try {
      expect((await register("svc")).key_count).toBe(1);
    } finally {
      await db.exec("reset role;");
    }
  });
});
