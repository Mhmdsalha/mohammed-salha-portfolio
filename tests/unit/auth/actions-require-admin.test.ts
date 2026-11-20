// R8: every exported server action except login/logout must reject a request without a valid
// session before doing anything. New actions in src/actions/ are picked up automatically.
import { readdirSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { TEST_SECRET, forgedTokens, validToken } from "./helpers";

const { cookieJar, createAdminClient } = vi.hoisted(() => ({
  cookieJar: new Map<string, string>(),
  createAdminClient: vi.fn(() => {
    throw new Error("Admin client reached without a session");
  })
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (cookieJar.has(name) ? { name, value: cookieJar.get(name) } : undefined),
    set: vi.fn(),
    delete: vi.fn()
  }),
  headers: async () => new Headers()
}));

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient }));
vi.mock("@/lib/site-settings", () => ({ saveSiteSettings: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));

const PUBLIC_ACTIONS = new Set(["loginAction", "logoutAction"]);
const UNAUTHORIZED = { success: false, message: "Unauthorized." };
const actionsDir = path.resolve(__dirname, "../../../src/actions");

type Action = (...args: unknown[]) => Promise<unknown>;

async function loadGuardedActions(): Promise<[string, Action][]> {
  const entries: [string, Action][] = [];

  for (const file of readdirSync(actionsDir).filter((name) => name.endsWith(".ts"))) {
    const mod = (await import(path.join(actionsDir, file))) as Record<string, unknown>;
    for (const [name, value] of Object.entries(mod)) {
      if (typeof value === "function" && !PUBLIC_ACTIONS.has(name)) {
        entries.push([`${file}#${name}`, value as Action]);
      }
    }
  }

  return entries;
}

// Arguments that would make an unguarded action reach the database.
function argsFor(): unknown[] {
  const formData = new FormData();
  formData.set("slug", "valid-slug");
  return ["00000000-0000-0000-0000-000000000000", formData];
}

const originalEnv = { ...process.env };
beforeAll(() => {
  process.env.SESSION_SECRET = TEST_SECRET;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key-for-tests";
});
afterAll(() => {
  process.env = originalEnv;
});
beforeEach(() => {
  cookieJar.clear();
  createAdminClient.mockClear();
});

describe("server actions require an admin session (R8)", () => {
  it("finds the guarded actions", async () => {
    const names = (await loadGuardedActions()).map(([name]) => name);
    expect(names).toEqual(
      expect.arrayContaining([
        "projects.ts#createProject",
        "projects.ts#updateProject",
        "projects.ts#deleteProject",
        "projects.ts#uploadProjectImages",
        "settings.ts#updateSiteSettings"
      ])
    );
  });

  it("rejects calls with no cookie", async () => {
    for (const [name, action] of await loadGuardedActions()) {
      expect(await action(...argsFor()), name).toEqual(UNAUTHORIZED);
    }
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("rejects every forged cookie, including the old constant", async () => {
    const forged = await forgedTokens();
    const actions = await loadGuardedActions();

    for (const [tokenName, token] of Object.entries(forged)) {
      cookieJar.clear();
      cookieJar.set("dashboard_session", token);
      cookieJar.set("dashboard_token", "authenticated");

      for (const [name, action] of actions) {
        expect(await action(...argsFor()), `${name} with ${tokenName}`).toEqual(UNAUTHORIZED);
      }
    }
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("lets a valid session past the guard", async () => {
    cookieJar.set("dashboard_session", await validToken());
    const { deleteProject } = await import("@/actions/projects");

    await expect(deleteProject("00000000-0000-0000-0000-000000000000")).rejects.toThrow(
      "Admin client reached without a session"
    );
    expect(createAdminClient).toHaveBeenCalledTimes(1);
  });
});
