// Site settings (D1-4, D-029): cached under the "settings" tag; a missing settings file is the
// real state (defaults, cached), any other Storage failure throws so it is never cached.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cached: [] as Array<{ key: string[]; tags: string[] }>,
  download: vi.fn()
}));

vi.mock("next/cache", () => ({
  unstable_cache: <T>(read: T, key: string[], options: { tags: string[] }) => {
    mocks.cached.push({ key, tags: options.tags });
    return read;
  }
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ storage: { from: () => ({ download: mocks.download }) } })
}));

const { getSiteSettings } = await import("@/lib/site-settings");

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service");
  mocks.download.mockReset();
});
afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getSiteSettings", () => {
  it("is cached under the settings tag", () => {
    expect(mocks.cached).toEqual([{ key: ["data", "site-settings"], tags: ["settings"] }]);
  });

  it("returns the saved settings merged over the defaults", async () => {
    mocks.download.mockResolvedValue({
      data: new Blob([JSON.stringify({ github: "https://github.com/Mhmdsalha" })]),
      error: null
    });
    expect(await getSiteSettings()).toMatchObject({
      github: "https://github.com/Mhmdsalha",
      email: ""
    });
  });

  it("returns the defaults when no settings were saved yet (Storage 404)", async () => {
    mocks.download.mockResolvedValue({
      data: null,
      error: { message: "Object not found", status: 400, statusCode: "404" }
    });
    expect((await getSiteSettings()).github).toBe("");
  });

  it("throws on any other failure, so no page is cached without contact links", async () => {
    mocks.download.mockResolvedValue({
      data: null,
      error: { message: "Internal error", status: 500, statusCode: "500" }
    });
    await expect(getSiteSettings()).rejects.toThrow(/site settings/);
  });

  it("throws in production without Supabase env (fail closed)", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("VERCEL_ENV", "production");
    await expect(getSiteSettings()).rejects.toThrow(/environment variables/);
  });
});
