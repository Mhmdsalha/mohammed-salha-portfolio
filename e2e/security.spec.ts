// D1-1 "Attacker" path from PLAN.md, in a real browser: forged dashboard cookies never get in.
// Runs against any deployment (BASE_URL); it makes no login attempts, so it never touches the
// rate limit. Login-limit and server-action checks are covered by tests/unit/auth/*.
import { expect, test, type BrowserContext } from "@playwright/test";

const FORGED: Record<string, { name: string; value: string }> = {
  "legacy constant cookie": { name: "dashboard_token", value: "authenticated" },
  "unsigned alg:none token": {
    name: "dashboard_session",
    value:
      "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJhZG1pbiIsImlhdCI6MTc5NTE5MDAwMCwiZXhwIjo0MTAyNDQ0ODAwfQ."
  },
  "garbage session": { name: "dashboard_session", value: "not-a-jwt" }
};

async function setCookie(
  context: BrowserContext,
  baseURL: string,
  cookie: { name: string; value: string }
) {
  await context.addCookies([{ ...cookie, url: baseURL }]);
}

for (const [label, cookie] of Object.entries(FORGED)) {
  test(`forged cookie is sent to login: ${label}`, async ({ page, context, baseURL }) => {
    await setCookie(context, baseURL!, cookie);

    for (const path of ["/dashboard", "/dashboard/projects", "/dashboard/settings"]) {
      await page.goto(path);
      await expect(page, path).toHaveURL(/\/dashboard\/login$/);
    }

    const remaining = (await context.cookies()).filter((c) => c.name === "dashboard_session");
    expect(remaining.map((c) => c.value)).not.toContain(FORGED["unsigned alg:none token"].value);
  });
}

test("no cookie is sent to login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard\/login$/);
});

test("locale-prefixed dashboard path redirects to the real dashboard route", async ({ page }) => {
  await page.goto("/en/dashboard");
  await expect(page).toHaveURL(/\/dashboard\/login$/);
});
