// P4-2 acceptance for the new hero, on the preview route (D-023). Runs against any build,
// including production, because /[locale]/preview is a real (noindex) page.
import { expect, test, type Page } from "@playwright/test";

const WIDTHS = [360, 768, 1280, 1920];

async function open(page: Page, locale: "ar" | "en") {
  await page.goto(`/${locale}/preview`, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
}

for (const locale of ["ar", "en"] as const) {
  test(`${locale}: the portrait never leaves its circle and nothing scrolls sideways`, async ({
    page
  }) => {
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await open(page, locale);

      const circle = page.locator("[data-hero-circle]");
      await expect(circle, `${width}px`).toHaveCSS("overflow", "hidden");
      // rounded-full computes to a huge px radius: anything >= half the width is a full circle.
      const radius = await circle.evaluate((el) => ({
        r: parseFloat(getComputedStyle(el).borderTopLeftRadius),
        w: el.getBoundingClientRect().width
      }));
      expect(radius.r, `${width}px`).toBeGreaterThanOrEqual(radius.w / 2);

      // Both boxes in one call, so they come from the same frame while the circle scales in.
      const { c, img } = await circle.evaluate((el) => {
        const box = (r: DOMRect) => ({ x: r.x, y: r.y, width: r.width, height: r.height });
        return {
          c: box(el.getBoundingClientRect()),
          img: box(el.querySelector("img")!.getBoundingClientRect())
        };
      });
      // Bottom-anchored inside the circle, never wider than it.
      expect(img.y + img.height, `${width}px`).toBeLessThanOrEqual(c.y + c.height + 0.5);
      expect(img.x, `${width}px`).toBeGreaterThanOrEqual(c.x - 0.5);
      expect(img.x + img.width, `${width}px`).toBeLessThanOrEqual(c.x + c.width + 0.5);

      // Freeze both rings at 45°, where a turning square sticks out furthest (R4 worst case).
      await page.addStyleTag({
        content:
          ".animate-ring-spin{animation-delay:-3.5s!important;animation-play-state:paused!important}" +
          ".animate-ring-spin-reverse{animation-delay:-5s!important;animation-play-state:paused!important}"
      });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow, `${width}px`).toBe(0);
    }
  });

  test(`${locale}: headings and rotating words have stable accessible text`, async ({ page }) => {
    await open(page, locale);
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toHaveCount(1);
    await expect(page.locator("section#top")).toHaveAttribute("aria-labelledby", "hero-title");
    await expect(h1).toHaveAttribute("id", "hero-title");

    // The animated words are hidden; one plain sentence is announced instead.
    const animated = page
      .locator(".animate-word-cycle")
      .locator("xpath=ancestor::*[@aria-hidden='true'][1]");
    await expect(animated).toHaveCount(1);
    await expect(page.locator("section#top p.sr-only")).toHaveCount(1);
  });

  test(`${locale}: the portrait paints at once (LCP-safe) and is high priority`, async ({
    page
  }) => {
    await open(page, locale);
    const img = page.locator("[data-hero-circle] img");
    await expect(img).toHaveAttribute("fetchpriority", "high");
    await expect(img).not.toHaveAttribute("loading", "lazy");
    // Preloaded from <head> as well.
    await expect(page.locator('link[rel="preload"][as="image"]')).toHaveCount(1);
    // Neither the photo nor its circle ever starts transparent (V-1).
    await expect(img).toHaveCSS("opacity", "1");
    await expect(page.locator("[data-hero-circle]")).toHaveCSS("opacity", "1");
  });
}

test("reduced motion: rings, word cycle, dot and entrances are still", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page, "ar");
  for (const selector of [
    ".animate-ring-spin",
    ".animate-ring-spin-reverse",
    ".animate-word-cycle",
    ".animate-dot-pulse",
    ".animate-portrait-in",
    ".animate-line-rise",
    ".animate-fade-up"
  ]) {
    await expect(page.locator(selector).first(), selector).toHaveCSS("animation-name", "none");
  }
  // The first phrase is the one shown, fully in place.
  await expect(page.locator(".animate-word-cycle")).toHaveCSS("transform", "none");
});

test("motion runs when allowed", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await open(page, "ar");
  await expect(page.locator(".animate-ring-spin").first()).toHaveCSS("animation-name", "ring-spin");
  await expect(page.locator(".animate-word-cycle")).toHaveCSS("animation-name", "word-cycle");
});

test("the CV button is a plain download link, not client-routed", async ({ page }) => {
  await open(page, "en");
  // The hero's button; the header (P4-1) has its own "Download CV (PDF)".
  const cv = page.locator("main").getByRole("link", { name: "Download CV" });
  await expect(cv).toHaveAttribute("href", "/cv.pdf");
  await expect(cv).toHaveAttribute("download", "");
});

test("the preview is not indexed", async ({ page }) => {
  await open(page, "ar");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

for (const locale of ["ar", "en"] as const) {
  test(`${locale}: the design fonts are really used and loaded (A7 review)`, async ({ page }) => {
    await open(page, locale);
    const family = (selector: string) =>
      page
        .locator(selector)
        .first()
        .evaluate((el) => getComputedStyle(el).fontFamily);

    expect(await family("#hero-title")).toMatch(/^"?Alexandria/);
    expect(await family(".animate-word-cycle")).toMatch(/^"?Alexandria/);
    expect(await family("section#top p.text-lead")).toMatch(/^"?IBM Plex Sans Arabic/);
    expect(await family("[data-hero-portrait] text")).toMatch(/^"?IBM Plex Sans Arabic/);

    // The font files themselves arrived (not just a name in the stack).
    const loaded = await page.evaluate(async () => {
      await document.fonts.ready;
      return [...document.fonts]
        .filter((f) => f.status === "loaded")
        .map((f) => f.family.replace(/"/g, ""));
    });
    expect(loaded).toContain("Alexandria");
    expect(loaded).toContain("IBM Plex Sans Arabic");
  });
}
