// P2-2 acceptance in a real browser, on the dev-only /dev/ui page: motion respects reduced motion
// (R13), it mirrors correctly in LTR vs RTL (R2/R21), nothing scrolls sideways (R4), and the
// design fonts and outline render. Skips automatically where /dev/ui is a 404 (production).
import { expect, test, type Page } from "@playwright/test";

test.describe.configure({ timeout: 120_000 });

async function open(page: Page) {
  const response = await page.goto("/dev/ui", { waitUntil: "load", timeout: 90_000 });
  test.skip(response?.status() === 404, "/dev/ui only exists in development");
  await page.evaluate(() => document.fonts.ready);
}

const demo = (page: Page, locale: "ar" | "en") => page.locator(`[data-demo="${locale}"]`);

test("motion runs when allowed", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await open(page);
  for (const locale of ["ar", "en"] as const) {
    const d = demo(page, locale);
    await expect(d.locator(".animate-marquee")).toHaveCSS("animation-name", "marquee");
    await expect(d.locator(".animate-line-rise").first()).toHaveCSS("animation-name", "line-rise");
  }
});

test("reduced motion stops the marquee, the line reveal and the scroll reveal", async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  for (const locale of ["ar", "en"] as const) {
    const d = demo(page, locale);
    await expect(d.locator(".animate-marquee")).toHaveCSS("animation-name", "none");
    await expect(d.locator(".animate-line-rise").first()).toHaveCSS("animation-name", "none");
    await expect(d.locator(".reveal-on-scroll").last()).toHaveCSS("animation-name", "none");
    // Content is fully visible, not stuck at the animation's start.
    await expect(d.locator(".reveal-on-scroll").last()).toHaveCSS("opacity", "1");
  }
});

test("the arrow points and moves in the reading direction (RTL vs LTR)", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await open(page);

  const arrow = (locale: "ar" | "en") =>
    demo(page, locale).locator('[data-demo-part="buttons"] a').first().locator("svg");

  // Mirrored in RTL only.
  await expect(arrow("ar")).toHaveCSS("scale", "-1 1");
  await expect(arrow("en")).toHaveCSS("scale", "none");

  // Hover nudges it 4px toward the end of the line: left in RTL, right in LTR.
  for (const [locale, expected] of [
    ["ar", "-4px"],
    ["en", "4px"]
  ] as const) {
    await demo(page, locale).locator('[data-demo-part="buttons"] a').first().hover();
    await expect(arrow(locale)).toHaveCSS("translate", expected);
  }
});

test("the marquee pauses on hover", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await open(page);
  const marquee = demo(page, "en").locator('[dir="ltr"].group').last();
  await marquee.hover();
  await expect(marquee.locator(".animate-marquee")).toHaveCSS("animation-play-state", "paused");
});

test("no horizontal scroll at 360px (R4)", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await open(page);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBe(0);
});

test("design fonts and outlined text render", async ({ page }) => {
  await open(page);
  const heading = demo(page, "ar").locator("h1");
  expect(await heading.evaluate((el) => getComputedStyle(el).fontFamily)).toContain("Alexandria");
  expect(await page.evaluate(() => document.fonts.check('900 40px "Alexandria"'))).toBe(true);

  const outlined = demo(page, "ar").locator("h1 .text-outline");
  // Paper-coloured fill painted over a doubled stroke hides Arabic join seams (R20).
  await expect(outlined).toHaveCSS("paint-order", "stroke");
  await expect(outlined).toHaveCSS("color", "rgb(243, 239, 231)");
  await expect(outlined).toHaveCSS("-webkit-text-stroke-width", "3px");
});
