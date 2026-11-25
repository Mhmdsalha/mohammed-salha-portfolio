// D1-5 acceptance: "No orphan files after delete". The pure selection is tested directly, and
// the real deleteProject action against a fake Supabase client that records every call.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { filesToRemove, storagePathFromUrl } from "@/lib/images/cleanup";

const SUPABASE = "https://abc.supabase.co";
const url = (path: string) => `${SUPABASE}/storage/v1/object/public/projects/${path}`;

describe("storagePathFromUrl", () => {
  it("returns the bucket path of a projects-bucket URL", () => {
    expect(storagePathFromUrl(url("projects/arzaq/cover-1.webp"), SUPABASE)).toBe(
      "projects/arzaq/cover-1.webp"
    );
    expect(storagePathFromUrl(url("projects/arzaq/a%20b.png?x=1"), SUPABASE)).toBe(
      "projects/arzaq/a b.png"
    );
  });

  it("ignores other hosts, other buckets, empty values and path tricks", () => {
    expect(
      storagePathFromUrl("https://other.example/storage/v1/object/public/projects/x", SUPABASE)
    ).toBeNull();
    expect(
      storagePathFromUrl(
        `${SUPABASE}/storage/v1/object/public/site-settings/settings.json`,
        SUPABASE
      )
    ).toBeNull();
    expect(storagePathFromUrl(null, SUPABASE)).toBeNull();
    expect(storagePathFromUrl(url("projects/../site-settings/x"), SUPABASE)).toBeNull();
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
      others: [{ thumbnail_url: url("projects/arzaq/shared.webp"), images: [] }],
      folderFiles: ["cover-new.webp", "cover-old.png", "shared.webp"],
      supabaseUrl: SUPABASE
    });
    expect(paths.sort()).toEqual([
      "projects/arzaq/cover-new.webp",
      "projects/arzaq/cover-old.png", // an older, unreferenced upload: an orphan otherwise
      "projects/old-slug/gallery-1.webp" // stored under the slug before a rename
    ]);
  });
});

// --- the real action --------------------------------------------------------------------------

const state = vi.hoisted(() => ({
  calls: [] as string[],
  project: null as null | { slug: string; thumbnail_url: string | null; images: string[] },
  deleteError: null as null | { message: string },
  removeError: null as null | { message: string },
  folder: [] as Array<{ name: string; id: string | null }>,
  removed: [] as string[][]
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
vi.mock("@/lib/auth/guard", () => ({ requireAdmin: async () => null }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: (columns: string) =>
        columns === "thumbnail_url,images"
          ? Promise.resolve({ data: [], error: null }) // no other project shares files
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
        list: async () => {
          state.calls.push("list");
          return { data: state.folder, error: null };
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
    deleteError: null,
    removeError: null,
    folder: [
      { name: "cover.webp", id: "1" },
      { name: "cover-old.png", id: "2" }
    ],
    removed: []
  });
});

describe("deleteProject", () => {
  it("deletes the row, then every file of the project: no orphans", async () => {
    expect(await deleteProject(ID)).toEqual({ success: true, message: "Project deleted." });
    expect(state.calls).toEqual(["read", "delete-row", "list", "remove"]);
    expect(state.removed).toEqual([["projects/arzaq/cover.webp", "projects/arzaq/cover-old.png"]]);
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
