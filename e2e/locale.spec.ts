// P3-2 acceptance: <html lang dir> per locale, "/" opens Arabic, the switch keeps the page.
import { expect, test } from "@playwright/test";

const htmlAttrs = (html: string) => ({
  lang: html.match(/<html[^>]*\slang="([^"]+)"/)?.[1],
  dir: html.match(/<html[^>]*\sdir="([^"]+)"/)?.[1]
});

test("the server sends <html lang dir> for each locale (curl-level)", async ({ request }) => {
  for (const [path, lang, dir] of [
    ["/ar", "ar", "rtl"],
    ["/en", "en", "ltr"],
    ["/ar/preview", "ar", "rtl"],
    ["/en/preview", "en", "ltr"],
    ["/dashboard/login", "en", "ltr"]
  ] as const) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    expect(htmlAttrs(await response.text()), path).toEqual({ lang, dir });
  }
});

test('"/" redirects to the Arabic site', async ({ request }) => {
  const response = await request.get("/", { maxRedirects: 0 });
  expect(response.status()).toBe(307);
  expect(new URL(response.headers()["location"] ?? "", "http://x").pathname).toBe("/ar");
});

test("an unknown top-level path moves under /ar", async ({ request }) => {
  const response = await request.get("/definitely-not-a-page", { maxRedirects: 0 });
  expect(response.status()).toBe(307);
  expect(new URL(response.headers()["location"] ?? "", "http://x").pathname).toBe(
    "/ar/definitely-not-a-page"
  );
});

test("an unknown page is a localised 404 with status 404", async ({ page }) => {
  // Next 15 sends its generic error shell as the first HTML of a 404 and renders the not-found
  // page on the client (D-026), so this checks what the visitor actually sees.
  for (const [path, lang, dir, title] of [
    ["/ar/definitely-not-a-page", "ar", "rtl", "الصفحة غير موجودة"],
    ["/en/definitely-not-a-page", "en", "ltr", "Page not found"],
    ["/ar/projects/no-such-project", "ar", "rtl", "الصفحة غير موجودة"]
  ] as const) {
    const response = await page.goto(path, { waitUntil: "load" });
    expect(response?.status(), path).toBe(404);
    await expect(page.locator("h1"), path).toHaveText(title);
    await expect(page.locator("html"), path).toHaveAttribute("lang", lang);
    await expect(page.locator("html"), path).toHaveAttribute("dir", dir);
  }
});

test("the language switch keeps the current page", async ({ page }) => {
  await page.goto("/ar", { waitUntil: "domcontentloaded" });
  const projectLink = page.locator('a[href^="/ar/projects/"]').first();
  const href = await projectLink.getAttribute("href");
  test.skip(!href, "no project page linked from /ar");

  await page.goto(href!, { waitUntil: "domcontentloaded" });
  const switcher = page.locator('a[hreflang="en"]').first();
  await expect(switcher).toHaveAttribute("href", href!.replace(/^\/ar/, "/en"));
});
