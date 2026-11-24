// D1-3 acceptance: "An SVG or a renamed .exe is rejected server-side". Calls the real server
// action with hostile files and checks that nothing reaches Storage, and that a good image is
// stored as WebP under a random name without overwriting anything.
import sharp from "sharp";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ upload: vi.fn() }));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
vi.mock("@/lib/auth/guard", () => ({ requireAdmin: async () => null }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    storage: {
      listBuckets: async () => ({ data: [{ name: "projects" }], error: null }),
      from: () => ({
        upload: async (...args: unknown[]) => {
          mocks.upload(...args);
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
});
