// D1-3 acceptance: "An SVG or a renamed .exe is rejected server-side". Calls the real server
// action with hostile files and checks that nothing reaches Storage, and that a good image is
// stored as WebP under a random name without overwriting anything.
import sharp from "sharp";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ upload: vi.fn(), remove: vi.fn(), failUploadNumber: 0 }));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
vi.mock("@/lib/auth/guard", () => ({ requireAdmin: async () => null }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    storage: {
      listBuckets: async () => ({ data: [{ name: "projects" }], error: null }),
      from: () => ({
        upload: async (...args: unknown[]) => {
          mocks.upload(...args);
          return mocks.upload.mock.calls.length === mocks.failUploadNumber
            ? { error: { message: "Internal: bucket quota exceeded at node-7" } }
            : { error: null };
        },
        remove: async (paths: string[]) => {
          mocks.remove(paths);
          return { error: null };
        },
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://cdn.example/${path}` } })
      })
    }
  })
}));

const { uploadProjectImages } = await import("@/actions/projects");

const png = async () =>
  sharp({ create: { width: 20, height: 20, channels: 3, background: "#c8302a" } })
    .png()
    .toBuffer();

function form(files: Array<[field: "thumbnail" | "images", file: File]>) {
  const data = new FormData();
  data.append("slug", "arzaq-marketplace");
  for (const [field, file] of files) data.append(field, file);
  return data;
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service");
  mocks.upload.mockReset();
  mocks.remove.mockReset();
  mocks.failUploadNumber = 0;
});

describe("uploadProjectImages", () => {
  it("rejects an SVG disguised as a PNG, and stores nothing", async () => {
    const svg = new File(['<svg xmlns="http://www.w3.org/2000/svg"/>'], "cover.png", {
      type: "image/png"
    });
    expect(await uploadProjectImages(form([["thumbnail", svg]]))).toEqual({
      success: false,
      message: "cover.png is not a PNG, JPEG, WebP or AVIF image."
    });
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it("rejects a renamed .exe, and stores nothing", async () => {
    const exe = new File([new Uint8Array([0x4d, 0x5a, 0x90, 0, 3, 0, 0, 0])], "shot.jpg", {
      type: "image/jpeg"
    });
    expect(await uploadProjectImages(form([["images", exe]]))).toMatchObject({ success: false });
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it("stores nothing when one file of several is bad", async () => {
    const good = new File([new Uint8Array(await png())], "a.png", { type: "image/png" });
    const bad = new File(["<html>"], "b.png", { type: "image/png" });
    expect(
      await uploadProjectImages(
        form([
          ["thumbnail", good],
          ["images", bad]
        ])
      )
    ).toMatchObject({ success: false, message: expect.stringContaining("b.png") });
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it("stores a good image as WebP, under a random name, never overwriting", async () => {
    const good = new File([new Uint8Array(await png())], "../../evil name.png", {
      type: "image/png"
    });
    const result = await uploadProjectImages(form([["thumbnail", good]]));
    expect(result).toMatchObject({ success: true });

    expect(mocks.upload).toHaveBeenCalledOnce();
    const [path, body, options] = mocks.upload.mock.calls[0]!;
    expect(path).toMatch(
      /^projects\/arzaq-marketplace\/cover-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/
    );
    expect((await sharp(body as Buffer).metadata()).format).toBe("webp");
    expect(options).toEqual({ contentType: "image/webp", cacheControl: "31536000", upsert: false });
  });

  it("refuses more than 12 files before processing any", async () => {
    const files = Array.from({ length: 13 }, (_, i): ["images", File] => [
      "images",
      new File(["x"], `${i}.png`, { type: "image/png" })
    ]);
    expect(await uploadProjectImages(form(files))).toEqual({
      success: false,
      message: "Upload at most 12 images at a time."
    });
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it("removes what it stored when a later upload fails, and hides Storage's error text", async () => {
    mocks.failUploadNumber = 2;
    const image = async (name: string) =>
      new File([new Uint8Array(await png())], name, { type: "image/png" });
    const result = await uploadProjectImages(
      form([
        ["thumbnail", await image("a.png")],
        ["images", await image("b.png")],
        ["images", await image("c.png")]
      ])
    );
    expect(result).toEqual({ success: false, message: "Image upload failed. Please try again." });
    expect(mocks.upload).toHaveBeenCalledTimes(3);
    const stored = mocks.upload.mock.calls
      .filter((_, index) => index !== 1)
      .map(([path]) => path as string);
    expect(mocks.remove).toHaveBeenCalledWith(stored);
  });
});
