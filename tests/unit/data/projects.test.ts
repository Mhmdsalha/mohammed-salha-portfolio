// The typed data API (D1-2, D-028): database errors throw instead of returning mock data, rows are
// narrowed to the app's types, queries filter in the database, and the dashboard reads behind the
// admin check with the service-role client.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockProjects } from "@/data/mock-projects";
import type { Project } from "@/types";

type Result = { data: unknown; error: unknown };

/** A stand-in for a supabase-js query: records each call and resolves to `result`. */
function fakeClient(result: Result) {
  const calls: Array<[string, unknown[]]> = [];
  const query: Record<string, unknown> = {};
  for (const method of ["select", "order", "eq", "maybeSingle"]) {
    query[method] = (...args: unknown[]) => {
      calls.push([method, args]);
      return query;
    };
  }
  // Only the query is awaitable, like supabase-js; the client itself is not (it is awaited once).
  query.then = (resolve: (value: Result) => unknown) => resolve(result);
  const client = {
    from: (...args: unknown[]) => {
      calls.push(["from", args]);
      return query;
    }
  };
  return { client, calls };
}

const mocks = vi.hoisted(() => ({
  // unstable_cache needs Next's incremental cache; here it records each read's key and tags and
  // runs the read directly.
  cachedReads: [] as Array<{ key: string[]; tags: string[]; revalidate: number | false }>,
  publicClient: vi.fn(),
  adminClient: vi.fn(),
  requireAdminPage: vi.fn()
}));
vi.mock("@/lib/supabase/public", () => ({ createPublicClient: mocks.publicClient }));
vi.mock("next/cache", () => ({
  unstable_cache: <T>(read: T, key: string[], options: { tags: string[]; revalidate: number }) => {
    mocks.cachedReads.push({ key, tags: options.tags, revalidate: options.revalidate });
    return read;
  }
}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.adminClient }));
vi.mock("@/lib/auth/guard", () => ({ requireAdminPage: mocks.requireAdminPage }));

const { DataError, getFeatured, getProjectBySlug, getProjects, getSkills } =
  await import("@/lib/projects");
const { getAllProjectsForAdmin, getProjectForAdmin } = await import("@/lib/admin-projects");

const row = (overrides: Partial<Record<keyof Project, unknown>> = {}) => ({
  ...mockProjects[0]!,
  ...overrides
});

function usePublic(result: Result) {
  const fake = fakeClient(result);
  mocks.publicClient.mockResolvedValue(fake.client);
  return fake.calls;
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service");
  vi.stubEnv("VERCEL_ENV", "");
  mocks.publicClient.mockReset();
  mocks.adminClient.mockReset();
  mocks.requireAdminPage.mockReset().mockResolvedValue({ sub: "admin" });
});
afterEach(() => {
  vi.unstubAllEnvs();
});

describe("public reads", () => {
  it("throw a DataError on a database error, never returning mock data", async () => {
    usePublic({ data: null, error: { message: "connection refused" } });
    await expect(getProjects()).rejects.toBeInstanceOf(DataError);
    await expect(getFeatured()).rejects.toBeInstanceOf(DataError);
    await expect(getProjectBySlug("x")).rejects.toBeInstanceOf(DataError);
    await expect(getSkills()).rejects.toBeInstanceOf(DataError);
  });

  it("return the rows, narrowed to the app's types", async () => {
    usePublic({ data: [row({ category: "store", label: "training" })], error: null });
    const [project] = await getProjects();
    expect(project).toMatchObject({
      slug: "al-nakhba-real-estate",
      category: "store",
      label: "training"
    });
  });

  it("reject a row whose category the database should never hold", async () => {
    usePublic({ data: [row({ category: "salla" })], error: null });
    await expect(getProjects()).rejects.toThrow(/al-nakhba-real-estate/);
  });

  it("look a project up by slug in the database (.eq('slug'), one row)", async () => {
    const calls = usePublic({ data: row(), error: null });
    expect((await getProjectBySlug("al-nakhba-real-estate"))?.slug).toBe("al-nakhba-real-estate");
    expect(calls).toContainEqual(["eq", ["slug", "al-nakhba-real-estate"]]);
    expect(calls.map(([method]) => method)).toContain("maybeSingle");

    usePublic({ data: null, error: null });
    expect(await getProjectBySlug("missing")).toBeUndefined();
  });

  it("order featured projects by carousel position", async () => {
    const calls = usePublic({ data: [], error: null });
    await getFeatured();
    expect(calls).toContainEqual(["eq", ["featured", true]]);
    expect(calls).toContainEqual([
      "order",
      ["featured_order", { ascending: true, nullsFirst: false }]
    ]);
  });

  it("list each skill's public projects, skipping links hidden by row-level security", async () => {
    usePublic({
      data: [
        {
          id: "s1",
          name: "Next.js",
          abbr: "Nx",
          category: "frontend",
          order_num: 0,
          project_skills: [{ projects: { slug: "arzaq" } }, { projects: null }]
        }
      ],
      error: null
    });
    expect(await getSkills()).toEqual([
      {
        id: "s1",
        name: "Next.js",
        abbr: "Nx",
        category: "frontend",
        order_num: 0,
        projectSlugs: ["arzaq"]
      }
    ]);
  });
});

describe("without Supabase env", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
  });

  it("uses the public mock projects for local development and CI builds", async () => {
    const projects = await getProjects();
    expect(projects.length).toBeGreaterThan(0);
    expect(projects.every((project) => project.published && project.github_url)).toBe(true);
    expect(mocks.publicClient).not.toHaveBeenCalled();
  });

  it("still works on a Vercel preview (mock data, behind Vercel login)", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    expect((await getProjects()).length).toBeGreaterThan(0);
  });

  it("throws in production instead of showing mock data", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    await expect(getProjects()).rejects.toBeInstanceOf(DataError);
    await expect(getAllProjectsForAdmin()).rejects.toBeInstanceOf(DataError);
  });
});

describe("dashboard reads", () => {
  it("check the admin session first, then read every project with the service-role client", async () => {
    const fake = fakeClient({ data: [row({ github_url: null, published: false })], error: null });
    mocks.adminClient.mockReturnValue(fake.client);
    const projects = await getAllProjectsForAdmin();
    expect(mocks.requireAdminPage).toHaveBeenCalledOnce();
    expect(projects[0]).toMatchObject({ github_url: null, published: false });
  });

  it("stop when the admin check fails (it redirects by throwing)", async () => {
    mocks.requireAdminPage.mockRejectedValue(new Error("NEXT_REDIRECT"));
    await expect(getAllProjectsForAdmin()).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.adminClient).not.toHaveBeenCalled();
  });

  it("treat a malformed id as not found without querying", async () => {
    expect(await getProjectForAdmin("not-a-uuid")).toBeUndefined();
    expect(mocks.adminClient).not.toHaveBeenCalled();
  });

  it("throw on a database error", async () => {
    mocks.adminClient.mockReturnValue(fakeClient({ data: null, error: { message: "x" } }).client);
    await expect(getProjectForAdmin("6f1c2d3e-4a5b-4c6d-8e9f-0a1b2c3d4e5f")).rejects.toBeInstanceOf(
      DataError
    );
  });
});

describe("caching (D1-4)", () => {
  it("caches every public read under the tags a dashboard change revalidates", () => {
    const tagsByKey = Object.fromEntries(
      mocks.cachedReads.map((read) => [read.key.join(":"), read.tags])
    );
    expect(tagsByKey).toEqual({
      "data:projects": ["projects"],
      "data:featured": ["projects"],
      "data:project-by-slug": ["projects"],
      "data:skills": ["skills", "projects"]
    });
    expect(mocks.cachedReads.every((read) => read.revalidate === 3600)).toBe(true);
  });

  it("returns undefined (not null) for an unknown slug, though the cache stores null", async () => {
    usePublic({ data: null, error: null });
    expect(await getProjectBySlug("nope")).toBeUndefined();
  });
});
