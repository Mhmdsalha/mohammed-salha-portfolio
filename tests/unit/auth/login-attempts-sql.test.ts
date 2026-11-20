// Runs supabase/migrations/0001_login_attempts.sql in a real Postgres engine (PGlite, WASM)
// to check its syntax, counting and permissions without a Supabase project.
// PGlite has one connection, so lock contention between sessions is not exercised here;
// the burst behaviour is covered by tests/unit/auth/login.test.ts.
import { readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { LOGIN_GLOBAL_MAX_ATTEMPTS, LOGIN_MAX_ATTEMPTS } from "@/lib/auth/rate-limit";

const migration = readFileSync(
  path.resolve(__dirname, "../../../supabase/migrations/0001_login_attempts.sql"),
  "utf8"
);

let db: PGlite;

async function register(key: string, windowSeconds = 900, maxPerKey = LOGIN_MAX_ATTEMPTS) {
  const { rows } = await db.query<{ key_count: number; global_count: number }>(
    "select * from public.register_login_attempt($1, $2, $3)",
    [key, windowSeconds, maxPerKey]
  );
  return rows[0];
}

async function storedRows(key: string) {
  const { rows } = await db.query<{ n: number }>(
    "select count(*)::int as n from public.login_attempts where key_hash = $1",
    [key]
  );
  return rows[0].n;
}

beforeAll(async () => {
  db = new PGlite();
  // Supabase's API roles, as they exist before any migration: service_role bypasses RLS, and
  // all three may use the public schema. Table and function access must come from the migration.
  await db.exec("create role anon; create role authenticated; create role service_role bypassrls;");
  await db.exec("grant usage on schema public to anon, authenticated, service_role;");
  await db.exec(migration);
}, 30_000);

beforeEach(async () => {
  await db.exec("reset role; truncate public.login_attempts;");
});

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

  it("answers over-the-limit without storing refused attempts", async () => {
    for (let i = 1; i <= LOGIN_MAX_ATTEMPTS; i++) {
      expect((await register("a")).key_count).toBe(i);
    }
    expect((await register("a")).key_count).toBe(LOGIN_MAX_ATTEMPTS + 1);
    expect((await register("a")).key_count).toBe(LOGIN_MAX_ATTEMPTS + 1);
    expect(await storedRows("a")).toBe(LOGIN_MAX_ATTEMPTS);
  });

  it("does not let one client lock out everyone (re-review N1)", async () => {
    for (let i = 0; i < 300; i++) await register("attacker");

    expect(await register("admin")).toEqual({
      key_count: 1,
      global_count: LOGIN_MAX_ATTEMPTS + 1
    });
  });

  it("reaches the global limit only with enough distinct clients", async () => {
    const clients = LOGIN_GLOBAL_MAX_ATTEMPTS / LOGIN_MAX_ATTEMPTS;
    for (let c = 0; c < clients; c++) {
      for (let i = 0; i < LOGIN_MAX_ATTEMPTS; i++) await register(`ip-${c}`);
    }

    expect((await register("admin")).global_count).toBe(LOGIN_GLOBAL_MAX_ATTEMPTS + 1);
  });

  it("only counts attempts inside the window and prunes rows older than a day", async () => {
    await db.exec(
      "insert into public.login_attempts (key_hash, attempted_at) values ('c', now() - interval '20 minutes'), ('c', now() - interval '2 days');"
    );
    expect((await register("c")).key_count).toBe(1);
    expect(await storedRows("c")).toBe(2); // the 2-day-old row is gone; the 20-minute-old one stays
  });

  it("denies anon and authenticated access to the table and the function", async () => {
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`set role ${role};`);
      await expect(db.query("select * from public.login_attempts"), role).rejects.toThrow(
        /permission denied/
      );
      await expect(
        db.query("select * from public.register_login_attempt('x', 900, 5)"),
        role
      ).rejects.toThrow(/permission denied/);
      await db.exec("reset role;");
    }
  });

  it("gives the service role what login needs, from the migration alone (re-review N2)", async () => {
    await db.exec("set role service_role;");
    expect((await register("svc")).key_count).toBe(1);
    await db.exec("delete from public.login_attempts where key_hash = 'svc';");
    expect(await storedRows("svc")).toBe(0);
  });
});
