// P2-2 acceptance in a real browser, on the dev-only /dev/ui page: motion respects reduced motion
// (R13), it mirrors correctly in LTR vs RTL (R2/R21), nothing scrolls sideways (R4), and the
// design fonts and outline render. Page tests skip where /dev/ui is a 404 (production); the last
// test checks that 404 there.
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

test("reduced motion: hovering a button moves nothing (A7 review)", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  for (const locale of ["ar", "en"] as const) {
    const link = demo(page, locale).locator('[data-demo-part="buttons"] a').first();
    await link.hover();
    await page.waitForTimeout(600); // longer than any transition
    await expect(link).toHaveCSS("translate", "none");
    await expect(link.locator("svg")).toHaveCSS("translate", "none");
    // The global reduced-motion rule leaves transitions at 0.001ms at most.
    const duration = await link.evaluate((el) =>
      parseFloat(getComputedStyle(el).transitionDuration)
    );
    expect(duration).toBeLessThanOrEqual(0.001);
  }
});

test("an LTR block inside the Arabic page follows its own direction", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await open(page);
  const nested = demo(page, "ar").locator('[data-demo-part="nested"] a');
  await expect(nested.locator("svg")).toHaveCSS("scale", "none");
  await nested.hover();
  await expect(nested.locator("svg")).toHaveCSS("translate", "4px");

  const nestedRtl = demo(page, "en").locator('[data-demo-part="nested"] a');
  await expect(nestedRtl.locator("svg")).toHaveCSS("scale", "-1 1");
});

test("the marquee pause control works by keyboard (WCAG 2.2.2)", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await open(page);
  const band = demo(page, "en").locator('[dir="ltr"].group').last();
  const track = band.locator(".animate-marquee");
  const toggle = band.getByRole("checkbox", { name: "Pause animation" });

  await expect(track).toHaveCSS("animation-play-state", "running");
  await toggle.focus();
  await page.keyboard.press("Space");
  await expect(toggle).toBeChecked();
  await page.mouse.move(0, 0);
  await page.locator("body").evaluate(() => (document.activeElement as HTMLElement)?.blur());
  // Paused by the control alone, not by hover or focus.
  await expect(track).toHaveCSS("animation-play-state", "paused");
});

test("the marquee pause control is hidden when nothing moves", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  await expect(demo(page, "en").getByRole("checkbox", { name: "Pause animation" })).toBeHidden();
});

test("the marquee loop is seamless on a 1920px screen", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 900 });
  await open(page);
  const widths = await demo(page, "en")
    .locator(".animate-marquee > ul")
    .evaluateAll((lists) => lists.map((l) => l.getBoundingClientRect().width));
  expect(widths).toHaveLength(2);
  expect(Math.abs(widths[0] - widths[1])).toBeLessThan(0.5);
  // At the loop point the second copy fills the band, so each copy must be at least as wide.
  expect(widths[0]).toBeGreaterThanOrEqual(1920);
});

test("/dev/ui is development-only: production serves a plain 404", async ({ request }) => {
  const response = await request.get("/dev/ui");
  if (response.status() === 404) {
    expect(await response.text()).not.toContain("UI primitives");
  } else {
    // Development: the page exists and asks not to be indexed.
    expect(response.status()).toBe(200);
    expect(await response.text()).toMatch(/<meta name="robots" content="noindex/);
  }
});
