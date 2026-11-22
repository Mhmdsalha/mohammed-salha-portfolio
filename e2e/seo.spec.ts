// P3-3 (D-027): what crawlers and link previews read, checked on the served HTML.
import { expect, test } from "@playwright/test";

const tag = (html: string, pattern: RegExp) => html.match(pattern)?.[1];
const meta = (html: string, key: string) =>
  tag(html, new RegExp(`<meta (?:property|name)="${key}" content="([^"]*)"`));
// Absolute URLs only: a relative og:image or canonical fails here, not just in a debugger.
const pathOf = (url = "") => {
  expect(url, "an absolute http(s) URL").toMatch(/^https?:\/\/[^/]+\//);
  return new URL(url).pathname;
};
const canonicals = (html: string) => [...html.matchAll(/<link rel="canonical" href="([^"]+)"/g)];

function jsonLd(html: string) {
  return [...html.matchAll(/<script type="application\/ld\+json">([^<]*)<\/script>/g)].map(
    (match) => JSON.parse(match[1]!)
  );
}

for (const [locale, other, ogLocale] of [
  ["ar", "en", "ar_AR"],
  ["en", "ar", "en_US"]
] as const) {
  test(`/${locale}: canonical, hreflang, Open Graph, Twitter and ProfilePage`, async ({
    request
  }) => {
    const html = await (await request.get(`/${locale}`)).text();

    expect(canonicals(html)).toHaveLength(1);
    expect(pathOf(tag(html, /<link rel="canonical" href="([^"]+)"/))).toBe(`/${locale}`);
    expect(meta(html, "og:url")).toBe(tag(html, /<link rel="canonical" href="([^"]+)"/));
    for (const [lang, path] of [
      [locale, `/${locale}`],
      [other, `/${other}`],
      ["x-default", "/ar"]
    ]) {
      expect(pathOf(tag(html, new RegExp(`hrefLang="${lang}" href="([^"]+)"`))), lang).toBe(path);
    }

    expect(meta(html, "og:locale")).toBe(ogLocale);
    expect(pathOf(meta(html, "og:url"))).toBe(`/${locale}`);
    expect(pathOf(meta(html, "og:image"))).toBe(`/og/${locale}.jpg`);
    expect(meta(html, "og:image:width")).toBe("1200");
    expect(meta(html, "og:image:height")).toBe("630");
    expect(meta(html, "og:image:alt")).toBeTruthy();
    expect(meta(html, "twitter:card")).toBe("summary_large_image");
    expect(meta(html, "description")).toBeTruthy();

    const profile = jsonLd(html).find((data) => data["@type"] === "ProfilePage");
    expect(profile?.mainEntity?.["@type"]).toBe("Person");
    expect(profile?.mainEntity?.name).toBeTruthy();
  });
}

test("a project page has its own title, canonical, hreflang and breadcrumb", async ({
  request
}) => {
  const home = await (await request.get("/en")).text();
  const href = tag(home, /href="(\/en\/projects\/[^"]+)"/);
  expect(href, "a project link on /en").toBeTruthy();

  const html = await (await request.get(href!)).text();
  expect(canonicals(html)).toHaveLength(1);
  expect(pathOf(tag(html, /<link rel="canonical" href="([^"]+)"/))).toBe(href);
  expect(pathOf(tag(html, /hrefLang="ar" href="([^"]+)"/))).toBe(href!.replace(/^\/en/, "/ar"));
  expect(meta(html, "og:type")).toBe("article");
  expect(pathOf(meta(html, "og:url"))).toBe(href);
  expect(tag(html, /<title>([^<]+)<\/title>/)).toContain(" — Mohammed Salha");

  const crumbs = jsonLd(html).find((data) => data["@type"] === "BreadcrumbList");
  expect(crumbs?.itemListElement).toHaveLength(2);
});

test("robots.txt blocks the dashboard and names the sitemap", async ({ request }) => {
  const response = await request.get("/robots.txt");
  expect(response.status()).toBe(200);
  const body = await response.text();
  expect(body).toContain("Disallow: /dashboard");
  expect(body).toMatch(/Sitemap: \S+\/sitemap\.xml/);
});

test("sitemap.xml lists both locales with hreflang links", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect(response.status()).toBe(200);
  const xml = await response.text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => pathOf(match[1]));
  expect(locs).toEqual(expect.arrayContaining(["/ar", "/en"]));
  expect(locs.some((path) => /preview|dashboard|dev/.test(path))).toBe(false);
  expect(xml).toContain('hreflang="x-default"');
});

test("icons and share cards are served", async ({ request }) => {
  for (const [path, type] of [
    ["/favicon.ico", "image/x-icon"],
    ["/icon.png", "image/png"],
    ["/apple-icon.png", "image/png"],
    ["/og/ar.jpg", "image/jpeg"],
    ["/og/en.jpg", "image/jpeg"]
  ]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    expect(response.headers()["content-type"], path).toContain(type);
  }
});

test("the preview and dashboard stay out of the index and claim no page URL", async ({
  request
}) => {
  for (const path of ["/ar/preview", "/dashboard/login"]) {
    const html = await (await request.get(path)).text();
    expect(meta(html, "robots"), path).toContain("noindex");
    expect(html, path).not.toMatch(/<link rel="canonical"/);
    // The layout's Open Graph defaults carry no og:url (A7 review).
    expect(meta(html, "og:url"), path).toBeUndefined();
  }
});
