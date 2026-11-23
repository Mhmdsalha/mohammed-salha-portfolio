// Runs supabase/migrations 0000 -> 0001 -> 0002 in a real Postgres engine (PGlite, WASM), on rows
// shaped like production before the rebuild (D1-2, D-028): the owner's category mapping, the
// GitHub links, the new columns, and what the anon role may read (D-004, R17).
import { readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const sql = (file: string) =>
  readFileSync(path.resolve(__dirname, "../../../supabase/migrations", file), "utf8");
const baseline = sql("0000_baseline.sql");
const loginAttempts = sql("0001_login_attempts.sql");
const rebuild = sql("0002_rebuild.sql");

let db: PGlite;

// Production's rows on 2026-11-23 (slug, category, featured, order, GitHub), plus an "other" row.
const BEFORE: Array<[string, string, boolean, number, string | null]> = [
  ["al-amanah-cars-website", "webapp", true, 0, "https://github.com/Mhmdsalha/al-amanah-cars"],
  [
    "al-nakhba-real-estate",
    "webapp",
    true,
    1,
    "https://github.com/Mhmdsalha/al-nakhba-real-estate"
  ],
  ["lamsa-beauty-store", "salla", false, 2, null],
  ["oud-abaya-store", "salla", true, 3, null],
  ["lolo-kids-store", "salla", false, 4, null],
  ["arzaq-marketplace", "webapp", true, 5, null],
  ["saree3-pos", "pos", false, 6, null],
  ["misc-tool", "other", false, 7, "https://github.com/Mhmdsalha/misc"]
];

// Supabase's API roles and default privileges: anon and authenticated get every privilege on new
// tables, so only row-level security and explicit revokes protect them (A7 review).
const SUPABASE_ROLES = `
  create role anon; create role authenticated; create role service_role bypassrls;
  grant usage on schema public to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;`;

async function rows<T>(query: string, params: unknown[] = []) {
  return (await db.query<T>(query, params)).rows;
}

async function asAnon<T>(query: string) {
  await db.exec("set role anon");
  try {
    return await rows<T>(query);
  } finally {
    await db.exec("reset role");
  }
}

const project = (slug: string) =>
  rows<Record<string, unknown>>("select * from public.projects where slug = $1", [slug]).then(
    (found) => found[0]!
  );

beforeAll(async () => {
  db = new PGlite();
  await db.exec(SUPABASE_ROLES);
  await db.exec(baseline);
  for (const [slug, category, featured, order, github] of BEFORE) {
    await db.query(
      `insert into public.projects (slug, title_ar, title_en, category, featured, order_num, github_url)
       values ($1, $1, $1, $2, $3, $4, $5)`,
      [slug, category, featured, order, github]
    );
  }
  // The pre-rebuild table allowed nulls in these columns.
  await db.exec("update public.projects set tags = null where slug = 'misc-tool'");
  await db.exec(loginAttempts);
  await db.exec(rebuild);
}, 60_000);

afterAll(async () => {
  await db?.close();
});

describe("0002_rebuild.sql on production-shaped data", () => {
  it("maps the categories as the owner decided: salla -> store, pos -> system, other -> webapp", async () => {
    const categories = Object.fromEntries(
      (
        await rows<{ slug: string; category: string }>("select slug, category from public.projects")
      ).map((row) => [row.slug, row.category])
    );
    expect(categories).toEqual({
      "al-amanah-cars-website": "webapp",
      "al-nakhba-real-estate": "webapp",
      "lamsa-beauty-store": "store",
      "oud-abaya-store": "store",
      "lolo-kids-store": "store",
      "arzaq-marketplace": "webapp",
      "saree3-pos": "system",
      "misc-tool": "webapp"
    });
  });

  it("fills in the confirmed GitHub links and leaves Lamsa and Lolo without one", async () => {
    expect((await project("arzaq-marketplace")).github_url).toBe(
      "https://github.com/Mhmdsalha/arzaq"
    );
    expect((await project("saree3-pos")).github_url).toBe(
      "https://github.com/Mhmdsalha/saree3-pos-project"
    );
    expect((await project("oud-abaya-store")).github_url).toBe(
      "https://github.com/Mhmdsalha/oud-store-design"
    );
    expect((await project("lamsa-beauty-store")).github_url).toBeNull();
    expect((await project("lolo-kids-store")).github_url).toBeNull();
  });

  it("adds the new columns with their defaults, labels and carousel order", async () => {
    const arzaq = await project("arzaq-marketplace");
    expect(arzaq).toMatchObject({
      label: "training",
      published: true,
      highlights_ar: [],
      highlights_en: []
    });
    expect((await project("saree3-pos")).label).toBe("training");
    expect((await project("al-amanah-cars-website")).label).toBeNull();
    expect((await project("misc-tool")).tags).toEqual([]);

    const featured = await rows<{ slug: string; featured_order: number | null }>(
      "select slug, featured_order from public.projects where featured order by featured_order"
    );
    expect(featured).toEqual([
      { slug: "al-amanah-cars-website", featured_order: 1 },
      { slug: "al-nakhba-real-estate", featured_order: 2 },
      { slug: "oud-abaya-store", featured_order: 3 },
      { slug: "arzaq-marketplace", featured_order: 4 }
    ]);
  });

  it("rejects the old categories and unknown labels", async () => {
    await expect(
      db.query("update public.projects set category = 'salla' where slug = 'misc-tool'")
    ).rejects.toThrow(/projects_category_check/);
    await expect(
      db.query("update public.projects set label = 'shipped' where slug = 'misc-tool'")
    ).rejects.toThrow(/projects_label_check/);
  });

  it("moves updated_at on every edit", async () => {
    await db.exec("update public.projects set updated_at = '2020-01-01' where slug = 'misc-tool'");
    const before = (await project("misc-tool")).updated_at as Date;
    await db.exec("update public.projects set title_en = 'Misc' where slug = 'misc-tool'");
    expect(((await project("misc-tool")).updated_at as Date).getTime()).toBeGreaterThan(
      before.getTime()
    );
  });
});

describe("what the public (anon) can read", () => {
  it("sees only published projects with a GitHub link: Lamsa and Lolo are hidden", async () => {
    const visible = (
      await asAnon<{ slug: string }>("select slug from public.projects order by slug")
    ).map((row) => row.slug);
    expect(visible).toEqual([
      "al-amanah-cars-website",
      "al-nakhba-real-estate",
      "arzaq-marketplace",
      "misc-tool",
      "oud-abaya-store",
      "saree3-pos"
    ]);
  });

  it("cannot read an unpublished project (R17)", async () => {
    await db.exec("update public.projects set published = false where slug = 'misc-tool'");
    try {
      expect(await asAnon("select slug from public.projects where slug = 'misc-tool'")).toEqual([]);
    } finally {
      await db.exec("update public.projects set published = true where slug = 'misc-tool'");
    }
  });

  it("cannot write projects, even with Supabase's default grants (privileges revoked)", async () => {
    await db.exec("set role anon");
    try {
      for (const statement of [
        "update public.projects set title_en = 'x'",
        "delete from public.projects",
        "insert into public.projects (slug, title_ar, title_en, category) values ('x','x','x','webapp')",
        "insert into public.skills (name, abbr, category) values ('x','x','infra')"
      ]) {
        await expect(db.query(statement), statement).rejects.toThrow(/permission denied/);
      }
    } finally {
      await db.exec("reset role");
    }
    expect(
      (await rows<{ n: number }>("select count(*)::int as n from public.projects"))[0]?.n
    ).toBe(BEFORE.length);
  });

  it("sees every skill but only the links to public projects", async () => {
    await db.exec(`
      insert into public.skills (name, abbr, category) values ('Next.js', 'Nx', 'frontend');
      insert into public.project_skills (project_id, skill_id)
        select p.id, s.id from public.projects p, public.skills s
        where p.slug in ('arzaq-marketplace', 'lamsa-beauty-store') and s.name = 'Next.js';`);
    expect(await asAnon("select name from public.skills")).toEqual([{ name: "Next.js" }]);
    const links = await asAnon<{ slug: string }>(
      "select p.slug from public.project_skills ps join public.projects p on p.id = ps.project_id"
    );
    expect(links).toEqual([{ slug: "arzaq-marketplace" }]);
    expect(
      await asAnon<{ n: number }>("select count(*)::int as n from public.project_skills")
    ).toEqual([{ n: 1 }]);
  });
});

describe("data rules", () => {
  it("rejects a second project with the same slug (R9)", async () => {
    await expect(
      db.query(
        "insert into public.projects (slug, title_ar, title_en, category) values ('arzaq-marketplace','x','x','webapp')"
      )
    ).rejects.toThrow(/projects_slug_key/);
  });
});

describe("re-running the migrations", () => {
  it("is safe: nothing fails, and re-running the baseline never reopens hidden rows", async () => {
    await expect(db.exec(baseline)).resolves.toBeDefined();
    await expect(db.exec(rebuild)).resolves.toBeDefined();

    const policies = await rows<{ policyname: string }>(
      "select policyname from pg_policies where tablename = 'projects' order by policyname"
    );
    expect(policies.map((policy) => policy.policyname)).toEqual([
      "Public read published projects",
      "Service role full access"
    ]);
    const visible = await asAnon<{ slug: string }>(
      "select slug from public.projects where slug in ('lamsa-beauty-store', 'lolo-kids-store')"
    );
    expect(visible).toEqual([]);
    expect((await project("saree3-pos")).category).toBe("system");
  });

  it("applies to a fresh, empty database too", async () => {
    const fresh = new PGlite();
    try {
      await fresh.exec(SUPABASE_ROLES);
      for (const file of [baseline, loginAttempts, rebuild]) await fresh.exec(file);
      const { rows: tables } = await fresh.query<{ table_name: string }>(
        "select table_name from information_schema.tables where table_schema = 'public' order by 1"
      );
      expect(tables.map((table) => table.table_name)).toEqual([
        "login_attempts",
        "project_skills",
        "projects",
        "skills"
      ]);
    } finally {
      await fresh.close();
    }
  });

  it("refuses to run, changing nothing, if another policy would keep hidden rows readable", async () => {
    const other = new PGlite();
    try {
      await other.exec(SUPABASE_ROLES);
      await other.exec(baseline);
      await other.exec(`
        insert into public.projects (slug, title_ar, title_en, category)
          values ('lamsa', 'x', 'x', 'salla');
        create policy "Enable read access for all users" on public.projects for select using (true);`);
      await other.exec(loginAttempts);
      await expect(other.exec(rebuild)).rejects.toThrow(/Enable read access for all users/);
      await other.exec("rollback");
      const { rows: after } = await other.query<{ category: string }>(
        "select category from public.projects"
      );
      expect(after).toEqual([{ category: "salla" }]);
    } finally {
      await other.close();
    }
  });
});
