import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import {
  alternatesFor,
  clampDescription,
  jsonLdString,
  languageAlternates,
  localePath,
  profileLinks,
  siteUrl,
  socialMetadata
} from "@/lib/seo";
import { breadcrumbJsonLd, profilePageJsonLd } from "@/lib/structured-data";

// P3-3 (D-027): URLs, alternates, social tags, JSON-LD, sitemap and robots.

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
  vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
  vi.stubEnv("VERCEL_ENV", "");
  // No database in unit tests: the sitemap reads the mock projects.
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
});
afterEach(() => {
  vi.unstubAllEnvs();
});

describe("siteUrl", () => {
  it("prefers NEXT_PUBLIC_SITE_URL, then Vercel's production domain, then localhost", () => {
    expect(siteUrl().origin).toBe("http://localhost:3000");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "example.vercel.app");
    expect(siteUrl().origin).toBe("https://example.vercel.app");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://salha.dev");
    expect(siteUrl().origin).toBe("https://salha.dev");
  });
});

describe("alternates", () => {
  it("builds locale paths, hreflang for both locales and x-default = Arabic", () => {
    expect(localePath("ar")).toBe("/ar");
    expect(localePath("en", "/projects/x")).toBe("/en/projects/x");
    expect(languageAlternates("/projects/x")).toEqual({
      ar: "/ar/projects/x",
      en: "/en/projects/x",
      "x-default": "/ar/projects/x"
    });
    expect(alternatesFor("en", "/projects/x")?.canonical).toBe("/en/projects/x");
  });
});

describe("socialMetadata", () => {
  it("sets the page URL, both OG locales and a large Twitter card", () => {
    const tags = socialMetadata({
      locale: "ar",
      siteName: "S",
      title: "T",
      description: "D",
      path: "/projects/x",
      image: { url: "/og/ar.jpg", alt: "A" }
    });
    expect(tags.openGraph).toMatchObject({
      url: "/ar/projects/x",
      locale: "ar_AR",
      alternateLocale: ["en_US"]
    });
    expect(tags.twitter).toMatchObject({ card: "summary_large_image" });
  });
});

describe("clampDescription", () => {
  it("keeps short text and cuts long text at a word with an ellipsis", () => {
    expect(clampDescription("  a   b ")).toBe("a b");
    const long = `${"كلمة ".repeat(60)}نهاية`;
    const cut = clampDescription(long);
    expect(cut.length).toBeLessThanOrEqual(160);
    expect(cut.endsWith("كلمة…")).toBe(true);
  });
});

describe("JSON-LD", () => {
  it("can never close the script tag", () => {
    const out = jsonLdString({ name: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("<");
    expect(JSON.parse(out).name).toBe("</script><script>alert(1)</script>");
  });

  it("keeps only http(s) profile links", () => {
    expect(
      profileLinks(["https://github.com/x", "", null, "javascript:alert(1)", "mailto:a@b.c"])
    ).toEqual(["https://github.com/x"]);
  });

  it("describes the owner as a ProfilePage with absolute URLs", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://salha.dev");
    const data = profilePageJsonLd({
      locale: "en",
      name: "Mohammed Salha",
      alternateName: "محمد صالحة",
      jobTitle: "Engineer",
      description: "D",
      sameAs: []
    });
    expect(data["@type"]).toBe("ProfilePage");
    expect(data.url).toBe("https://salha.dev/en");
    expect(data.mainEntity).toMatchObject({ "@type": "Person", name: "Mohammed Salha" });
    expect(data.mainEntity.image).toBe("https://salha.dev/images/portrait.webp");
    expect("sameAs" in data.mainEntity).toBe(false);
  });

  it("numbers breadcrumb items from 1 with absolute URLs", () => {
    const data = breadcrumbJsonLd("ar", [
      { name: "Home", path: "/" },
      { name: "P", path: "/projects/p" }
    ]);
    expect(data.itemListElement.map((item) => [item.position, item.item])).toEqual([
      [1, "http://localhost:3000/ar"],
      [2, "http://localhost:3000/ar/projects/p"]
    ]);
  });
});

describe("sitemap.xml", () => {
  it("lists home and every project in both locales, each with hreflang alternates", async () => {
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);
    expect(urls).toContain("http://localhost:3000/ar");
    expect(urls).toContain("http://localhost:3000/en");
    const projects = urls.filter((url) => url.includes("/projects/"));
    expect(projects.length).toBeGreaterThan(0);
    expect(projects.length % 2).toBe(0);
    expect(urls.some((url) => /preview|dashboard|dev/.test(url))).toBe(false);
    for (const entry of entries) {
      expect(Object.keys(entry.alternates?.languages ?? {}).sort()).toEqual([
        "ar",
        "en",
        "x-default"
      ]);
    }
  });
});

describe("robots.txt", () => {
  it("blocks the dashboard and dev pages and points at the sitemap", () => {
    expect(robots()).toEqual({
      rules: { userAgent: "*", allow: "/", disallow: ["/dashboard", "/dev"] },
      sitemap: "http://localhost:3000/sitemap.xml"
    });
  });

  it("blocks everything on Vercel preview deployments", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(robots()).toEqual({ rules: { userAgent: "*", disallow: "/" } });
  });
});
