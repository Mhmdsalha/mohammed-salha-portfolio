// R7 (D1-4, D-029): every dashboard change revalidates the cache tags of the public data it
// affects, so /ar, /en, the project pages and the sitemap show it on the next request.
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  saveSiteSettings: vi.fn(),
  query: vi.fn()
}));

vi.mock("next/cache", () => ({
  revalidateTag: mocks.revalidateTag,
  revalidatePath: mocks.revalidatePath,
  unstable_cache: <T>(read: T) => read
}));
vi.mock("@/lib/auth/guard", () => ({ requireAdmin: async () => null }));
vi.mock("@/lib/site-settings", () => ({ saveSiteSettings: mocks.saveSiteSettings }));
vi.mock("@/lib/supabase/admin", () => {
  // insert(...), update(...).eq(...), delete().eq(...) all resolve to { error: null }.
  const result = () => {
    mocks.query();
    return Object.assign(Promise.resolve({ error: null }), {
      eq: () => Promise.resolve({ error: null })
    });
  };
  return {
    createAdminClient: () => ({
      from: () => ({ insert: result, update: result, delete: result })
    })
  };
});

const { createProject, deleteProject, updateProject } = await import("@/actions/projects");
const { updateSiteSettings } = await import("@/actions/settings");

const ID = "6f1c2d3e-4a5b-4c6d-8e9f-0a1b2c3d4e5f";
const project = {
  title_en: "Arzaq",
  title_ar: "أرزاق",
  slug: "arzaq-marketplace",
  category: "webapp",
  description_en: "",
  description_ar: "",
  live_url: "",
  github_url: "https://github.com/Mhmdsalha/arzaq",
  tags: [],
  thumbnail_url: "",
  images: [],
  featured: true,
  order_num: 1
};

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service");
  mocks.revalidateTag.mockReset();
  mocks.revalidatePath.mockReset();
  mocks.query.mockReset();
});

describe("project changes revalidate the projects tag", () => {
  it.each([
    ["create", () => createProject(project)],
    ["update", () => updateProject(ID, project)],
    ["delete", () => deleteProject(ID)]
  ])("%s", async (_name, run) => {
    expect(await run()).toMatchObject({ success: true });
    expect(mocks.query).toHaveBeenCalledOnce();
    expect(mocks.revalidateTag).toHaveBeenCalledWith("projects");
  });

  it("does not revalidate when the change is rejected", async () => {
    expect(await createProject({ ...project, category: "salla" })).toMatchObject({
      success: false
    });
    expect(mocks.revalidateTag).not.toHaveBeenCalled();
  });
});

describe("settings changes revalidate the settings tag", () => {
  it("update", async () => {
    expect(await updateSiteSettings({ github: "https://github.com/Mhmdsalha" })).toMatchObject({
      success: true
    });
    expect(mocks.saveSiteSettings).toHaveBeenCalledOnce();
    expect(mocks.revalidateTag).toHaveBeenCalledWith("settings");
  });
});
