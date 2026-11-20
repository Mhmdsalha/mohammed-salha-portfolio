// D1-1 "Attacker" path from PLAN.md, in a real browser: forged dashboard cookies never get in.
// Runs against any deployment (BASE_URL); it makes no login attempts, so it never touches the
// rate limit. Login-limit and server-action checks are covered by tests/unit/auth/*.
import { expect, test, type BrowserContext } from "@playwright/test";

const DASHBOARD_PATHS = ["/dashboard", "/dashboard/projects", "/dashboard/settings"];

// Each test loads the login page once per dashboard route over the network.
test.describe.configure({ timeout: 90_000 });

type ForgedCookie = { name: string; value: string; path: string };

function base64url(value: object) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

/** Built at run time: a fixed iat would soon be rejected for age alone, hiding an alg bug. */
function forgedCookies(): Record<string, ForgedCookie> {
  const now = Math.floor(Date.now() / 1000);
  return {
    // The old site set this at path=/dashboard, so that is where a real leftover lives.
    "legacy constant cookie": {
      name: "dashboard_token",
      value: "authenticated",
      path: "/dashboard"
    },
    "unsigned alg:none token": {
      name: "dashboard_session",
      value: `${base64url({ alg: "none", typ: "JWT" })}.${base64url({ sub: "admin", iat: now, exp: now + 3600 })}.`,
      path: "/"
    },
    "garbage session": { name: "dashboard_session", value: "not-a-jwt", path: "/" }
  };
}

async function setCookie(context: BrowserContext, baseURL: string, cookie: ForgedCookie) {
  const { hostname, protocol } = new URL(baseURL);
  await context.addCookies([
    {
      ...cookie,
      domain: hostname,
      secure: protocol === "https:",
      httpOnly: true,
      sameSite: "Strict"
    }
  ]);
}

for (const [label, cookie] of Object.entries(forgedCookies())) {
  test(`forged cookie never reaches the dashboard: ${label}`, async ({
    page,
    context,
    baseURL
  }) => {
    for (const path of DASHBOARD_PATHS) {
      // Set again before every page: the previous redirect cleared it, and each route must be
      // tested WITH the forged cookie, not without it.
      await context.clearCookies();
      await setCookie(context, baseURL!, cookie);
      expect(
        (await context.cookies()).some((c) => c.name === cookie.name),
        path
      ).toBe(true);

      await page.goto(path, { waitUntil: "domcontentloaded" });
      await expect(page, path).toHaveURL(/\/dashboard\/login$/);

      const left = (await context.cookies()).filter((c) => c.name === cookie.name);
      expect(left, `${path}: middleware should clear ${cookie.name}`).toHaveLength(0);
    }
  });
}

test("no cookie is sent to login", async ({ page }) => {
  for (const path of DASHBOARD_PATHS) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await expect(page, path).toHaveURL(/\/dashboard\/login$/);
  }
});

test("locale-prefixed dashboard path redirects to the real dashboard route first", async ({
  request
}) => {
  const response = await request.get("/en/dashboard", { maxRedirects: 0 });
  expect(response.status()).toBe(307);
  expect(new URL(response.headers()["location"] ?? "", "http://x").pathname).toBe("/dashboard");
});
