// D1-5 acceptance: "No orphan files after delete", and never the wrong files (D-031). The pure
// parts are tested directly; the real deleteProject action runs against a fake Supabase client
// that records every call in order.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { filesToRemove, keptPathsFromUrl, storagePathFromUrl } from "@/lib/images/cleanup";

const SUPABASE = "https://abc.supabase.co";
const url = (path: string) => `${SUPABASE}/storage/v1/object/public/projects/${path}`;

describe("storagePathFromUrl (strict: what may be deleted)", () => {
  it("returns the bucket path of this project's public URL", () => {
    expect(storagePathFromUrl(url("projects/arzaq/cover-1.webp"), SUPABASE)).toBe(
      "projects/arzaq/cover-1.webp"
    );
    expect(storagePathFromUrl(url("projects/arzaq/a%20b.png?x=1"), SUPABASE)).toBe(
      "projects/arzaq/a b.png"
    );
  });

  it("refuses anything else: other hosts and buckets, tricks, odd or broken paths", () => {
    for (const bad of [
      null,
      "https://other.example/storage/v1/object/public/projects/projects/a/x.webp",
      `${SUPABASE}.evil.com/storage/v1/object/public/projects/projects/a/x.webp`,
      `${SUPABASE}/storage/v1/object/public/site-settings/settings.json`,
      url("projects/../site-settings/x"),
      url("projects/%2e%2e/site-settings/x"),
      url("projects/a/"),
      url("projects"),
      url("projects/a//x.webp"),
      url("projects/z/%zz.webp")
    ]) {
      expect(storagePathFromUrl(bad, SUPABASE), String(bad)).toBeNull();
    }
  });
});

describe("keptPathsFromUrl (broad: what must be kept)", () => {
  it("recognises every Supabase URL form, from any host", () => {
    const path = "projects/a/shared.webp";
    for (const form of [
      url(path),
      `${SUPABASE}/storage/v1/render/image/public/projects/${path}?width=600`,
      `${SUPABASE}/storage/v1/object/sign/projects/${path}?token=x`,
      `HTTP://ABC.SUPABASE.CO/storage/v1/object/public/projects/${path}`,
      `https://cdn.custom-domain.dev/storage/v1/object/public/projects/${path}`,
      url("projects/a//shared.webp")
    ]) {
      expect(keptPathsFromUrl(form), form).toContain(path);
    }
  });

  it("never throws on a broken escape; it keeps the raw path instead", () => {
    expect(keptPathsFromUrl(url("projects/z/%zz.webp"))).toEqual(["projects/z/%zz.webp"]);
    expect(keptPathsFromUrl(null)).toEqual([]);
  });
});

describe("filesToRemove", () => {
  it("takes the slug folder and the project's images elsewhere, but keeps shared files", () => {
    const paths = filesToRemove({
      deleted: {
        slug: "arzaq",
        thumbnail_url: url("projects/arzaq/cover-new.webp"),
        images: [url("projects/old-slug/gallery-1.webp"), "https://example.com/external.png"]
      },
      others: [
        { thumbnail_url: url("projects/arzaq/shared.webp"), images: [] },
        {
          thumbnail_url: null,
          images: [`${SUPABASE}/storage/v1/object/sign/projects/projects/arzaq/signed.webp?t=1`]
        }
      ],
      folderFiles: ["cover-new.webp", "cover-old.png", "shared.webp", "signed.webp"],
      supabaseUrl: SUPABASE
    });
    expect(paths.sort()).toEqual([
      "projects/arzaq/cover-new.webp",
      "projects/arzaq/cover-old.png", // an older, unreferenced upload: an orphan otherwise
      "projects/old-slug/gallery-1.webp" // stored under the slug before a rename
    ]);
  });

  it("still works when another project holds a malformed URL", () => {
    expect(
      filesToRemove({
        deleted: { slug: "a", thumbnail_url: null, images: [] },
        others: [{ thumbnail_url: url("projects/z/%zz.webp"), images: [] }],
        folderFiles: ["x.webp"],
        supabaseUrl: SUPABASE
      })
    ).toEqual(["projects/a/x.webp"]);
  });
});

// --- the real action --------------------------------------------------------------------------

type Entry = { name: string; id: string | null };

const state = vi.hoisted(() => ({
  calls: [] as string[],
  project: null as null | { slug: string; thumbnail_url: string | null; images: string[] },
  others: [] as Array<{ thumbnail_url: string | null; images: string[] }>,
  deleteError: null as null | { message: string },
  removeError: null as null | { message: string },
  folderPages: [] as Entry[][],
  listArgs: [] as Array<[string, unknown]>,
  removed: [] as string[][]
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
vi.mock("@/lib/auth/guard", () => ({ requireAdmin: async () => null }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: (columns: string) =>
        columns === "thumbnail_url,images"
          ? {
              order: () => ({
                range: async (from: number, to: number) => {
                  state.calls.push(`others ${from}-${to}`);
                  return { data: state.others, error: null };
                }
              })
            }
          : {
              eq: () => ({
                maybeSingle: async () => {
                  state.calls.push("read");
                  return { data: state.project, error: null };
                }
              })
            },
      delete: () => ({
        eq: async () => {
          state.calls.push("delete-row");
          return { error: state.deleteError };
        }
      })
    }),
    storage: {
      from: () => ({
        list: async (folder: string, options: unknown) => {
          state.calls.push("list");
          state.listArgs.push([folder, options]);
          return { data: state.folderPages[state.listArgs.length - 1] ?? [], error: null };
        },
        remove: async (paths: string[]) => {
          state.calls.push("remove");
          state.removed.push(paths);
          return { error: state.removeError };
        }
      })
    }
  })
}));

const { deleteProject } = await import("@/actions/projects");
const ID = "6f1c2d3e-4a5b-4c6d-8e9f-0a1b2c3d4e5f";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", SUPABASE);
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service");
  Object.assign(state, {
    calls: [],
    project: { slug: "arzaq", thumbnail_url: url("projects/arzaq/cover.webp"), images: [] },
    others: [],
    deleteError: null,
    removeError: null,
    folderPages: [
      [
        { name: "cover.webp", id: "1" },
        { name: "cover-old.png", id: "2" },
        { name: "nested", id: null } // a sub-folder: never removed by name
      ]
    ],
    listArgs: [],
    removed: []
  });
});

describe("deleteProject", () => {
  it("deletes the row, then reads the others, lists the folder and removes: no orphans", async () => {
    expect(await deleteProject(ID)).toEqual({ success: true, message: "Project deleted." });
    expect(state.calls).toEqual(["read", "delete-row", "others 0-999", "list", "remove"]);
    expect(state.listArgs).toEqual([["projects/arzaq", { limit: 1000, offset: 0 }]]);
    expect(state.removed).toEqual([["projects/arzaq/cover.webp", "projects/arzaq/cover-old.png"]]);
  });

  it("keeps a file another project still uses", async () => {
    state.others = [{ thumbnail_url: url("projects/arzaq/cover-old.png"), images: [] }];
    await deleteProject(ID);
    expect(state.removed).toEqual([["projects/arzaq/cover.webp"]]);
  });

  it("lists every page of a large folder", async () => {
    const page = Array.from({ length: 1000 }, (_, i): Entry => ({
      name: `f${i}.webp`,
      id: `${i}`
    }));
    state.folderPages = [page, [{ name: "last.webp", id: "x" }]];
    await deleteProject(ID);
    expect(state.listArgs.map(([, options]) => options)).toEqual([
      { limit: 1000, offset: 0 },
      { limit: 1000, offset: 1000 }
    ]);
    // 1001 listed files, plus the project's cover, which this folder fake does not list.
    expect(state.removed[0]).toHaveLength(1002);
    expect(state.removed[0]).toContain("projects/arzaq/last.webp");
  });

  it("touches no file when the row cannot be deleted", async () => {
    state.deleteError = { message: "row locked" };
    expect(await deleteProject(ID)).toMatchObject({ success: false });
    expect(state.calls).toEqual(["read", "delete-row"]);
  });

  it("reports a project that does not exist, and deletes nothing", async () => {
    state.project = null;
    expect(await deleteProject(ID)).toEqual({ success: false, message: "Project not found." });
    expect(state.calls).toEqual(["read"]);
  });

  it("still reports the deletion, with a warning, when Storage clean-up fails", async () => {
    state.removeError = { message: "storage down" };
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await deleteProject(ID)).toEqual({
      success: true,
      message: "Project deleted, but some of its images could not be removed from Storage."
    });
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });
});
