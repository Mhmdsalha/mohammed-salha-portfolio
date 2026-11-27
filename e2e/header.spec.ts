// P4-1 acceptance (D-032): "Keyboard-only navigation works; no layout shift on scroll", plus the
// mobile sheet's focus trap, Esc and focus return (R14), in both directions. Runs against any
// build: the header is on the (noindex) preview route until P4-10.
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function open(page: Page, locale: "ar" | "en", width: number) {
  await page.setViewportSize({ width, height: 800 });
  await page.goto(`/${locale}/preview`, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
}

/** The element that has focus, described well enough to assert on. */
const focused = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    return {
      tag: el?.tagName.toLowerCase(),
      label: el?.getAttribute("aria-label") ?? el?.textContent?.trim() ?? "",
      inDialog: Boolean(el?.closest("dialog")),
      id: el?.id ?? ""
    };
  });

/**
 * Clicks where the element is, as a finger would. Playwright's locator.click() first scrolls the
 * element into view, and for a control in a sticky header that scrolls the page to the top.
 */
async function tapInPlace(page: Page, selector: string) {
  const [x, y] = await page.locator(selector).evaluate((el) => {
    const box = el.getBoundingClientRect();
    return [box.x + box.width / 2, box.y + box.height / 2];
  });
  await page.mouse.click(x, y);
}

for (const locale of ["ar", "en"] as const) {
  const other = locale === "ar" ? "en" : "ar";

  test(`${locale}: desktop header, keyboard only, in reading order`, async ({ page }) => {
    await open(page, locale, 1280);
    const header = page.locator("header");
    const nav = header.getByRole("navigation");
    await expect(nav.getByRole("link")).toHaveCount(4);
    await expect(header.getByRole("button", { name: /menu|القائمة/i })).toBeHidden();

    // Skip link first; it moves focus to the main content.
    await page.keyboard.press("Tab");
    expect((await focused(page)).tag).toBe("a");
    await page.keyboard.press("Enter");
    expect((await focused(page)).id).toBe("main");

    // From the top again: skip link, logo, the four sections, language, CV.
    await page.goto(`/${locale}/preview`, { waitUntil: "load" });
    const order: string[] = [];
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press("Tab");
      order.push((await focused(page)).label);
    }
    // The exact reading order: skip link, logo, the four sections, language, CV.
    const expected = await page.evaluate(() => {
      const label = (el: Element) => el.getAttribute("aria-label") ?? el.textContent?.trim() ?? "";
      const header = document.querySelector("header")!;
      const desktopNav = header.querySelector("nav")!;
      return [
        label(document.querySelector('a[href="#main"]')!),
        label(header.querySelector("[data-header-home]")!),
        ...Array.from(desktopNav.querySelectorAll("a")).map(label),
        label(header.querySelector(":scope > div > div > a[hreflang]")!),
        label(header.querySelector(':scope > div > div a[href="/cv.pdf"]')!)
      ];
    });
    expect(order).toEqual(expected);
    await expect(header.getByRole("link", { name: /CV|السيرة/ })).toHaveAttribute(
      "href",
      "/cv.pdf"
    );
    // The header's own switch (the sheet, also inside <header>, has a second one).
    await expect(header.locator(`a[hreflang="${other}"]`).first()).toHaveAttribute(
      "href",
      `/${other}/preview`
    );
  });

  test(`${locale}: the header keeps its size and place while scrolling (no layout shift)`, async ({
    page
  }) => {
    await open(page, locale, 1280);
    await page.waitForTimeout(1300); // let the entrance animation finish
    const box = async () =>
      page.locator("header").evaluate((el) => el.getBoundingClientRect().toJSON());
    const before = await box();
    const shifts = await page.evaluate(async () => {
      let total = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as Array<PerformanceEntry & { value: number }>) {
          total += entry.value;
        }
      }).observe({ type: "layout-shift", buffered: false });
      for (const y of [200, 600, 1200, 0, 900]) {
        window.scrollTo(0, y);
        await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 50)));
      }
      return total;
    });
    await page.evaluate(() => window.scrollTo(0, 900));
    const after = await box();
    expect(after.top).toBe(0); // sticky
    expect(after.height).toBe(before.height);
    expect(shifts).toBe(0);
  });

  test(`${locale}: mobile sheet traps focus, closes on Esc and returns focus`, async ({ page }) => {
    await open(page, locale, 360);
    const header = page.locator("header");
    await expect(header.getByRole("navigation")).toBeHidden();
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(360);

    const menuButton = page.locator('button[aria-haspopup="dialog"]');
    await menuButton.focus();
    await page.keyboard.press("Enter");
    const dialog = page.locator("dialog[data-menu-sheet]");
    await expect(dialog).toBeVisible();
    expect((await focused(page)).inDialog).toBe(true);

    // Twelve Tabs and Shift+Tabs never leave the sheet.
    for (const key of [...Array(12).fill("Tab"), ...Array(6).fill("Shift+Tab")]) {
      await page.keyboard.press(key);
      expect((await focused(page)).inDialog, key).toBe(true);
    }
    // The page behind does not scroll while the sheet is open.
    expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).toBe("hidden");

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    expect(await menuButton.evaluate((el) => el === document.activeElement)).toBe(true);
  });

  test(`${locale}: a link in the sheet closes it and goes to its section`, async ({ page }) => {
    await open(page, locale, 360);
    await page.locator('button[aria-haspopup="dialog"]').click();
    const dialog = page.locator("dialog[data-menu-sheet]");
    const links = dialog.getByRole("navigation").getByRole("link");
    await expect(links).toHaveCount(4);
    await links.first().click();
    await expect(dialog).toBeHidden();
    expect(page.url()).toMatch(new RegExp(`/${locale}/preview#featured$`));

    // The backdrop closes it too: click beside the sheet, which sits at the inline end (the left
    // in Arabic, the right in English).
    await page.locator('button[aria-haspopup="dialog"]').click();
    const sheet = (await dialog.boundingBox())!;
    // The free strip is on the left when the sheet starts away from 0, on the right otherwise.
    const x = sheet.x > 1 ? sheet.x / 2 : (sheet.x + sheet.width + 360) / 2;
    await page.mouse.click(x, 400);
    await expect(dialog).toBeHidden();
  });

  test(`${locale}: the skip link shows fully, shifts nothing, and targets clear the header`, async ({
    page
  }) => {
    await open(page, locale, 1280);
    await page.waitForTimeout(1300);
    const headerBefore = await page.locator("header").boundingBox();
    await page.keyboard.press("Tab");
    const skip = page.locator('a[href="#main"]');
    const box = (await skip.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.y).toBeGreaterThanOrEqual(0); // slid into view
    expect(await page.locator("header").boundingBox()).toEqual(headerBefore);
    // Section links land below the sticky header (A7 review).
    expect(
      await page.evaluate(() => getComputedStyle(document.documentElement).scrollPaddingTop)
    ).toBe("96px");
  });

  test(`${locale}: focus is clearly visible on the header controls`, async ({ page }) => {
    await open(page, locale, 360);
    const ring = (selector: string) =>
      page.locator(selector).evaluate((el) => {
        const style = getComputedStyle(el);
        return [style.outlineStyle, style.outlineWidth, style.outlineOffset].join(" ");
      });
    await page.keyboard.press("Tab"); // skip link
    await page.keyboard.press("Tab"); // logo
    expect(await ring("[data-header-home]")).toBe("solid 2px 4px");
    await page.locator('button[aria-haspopup="dialog"]').focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab"); // keyboard focus, so :focus-visible applies
    expect(await ring('button[aria-haspopup="dialog"]')).toBe("solid 2px 4px");
    // The language pill meets the 44px target in both directions (A7 review: "ع" was 38.9px).
    const pill = (await page.locator("header a[hreflang]").first().boundingBox())!;
    expect(Math.min(pill.width, pill.height)).toBeGreaterThanOrEqual(43.9); // sub-pixel rounding
  });

  test(`${locale}: opening the sheet on a scrolled page keeps the header in place`, async ({
    page
  }) => {
    await open(page, locale, 360);
    await page.mouse.move(180, 500);
    await page.mouse.wheel(0, 150);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
    await page.waitForTimeout(600); // let the old site's smooth scrolling settle
    const scrolled = await page.evaluate(() => window.scrollY);
    await tapInPlace(page, 'button[aria-haspopup="dialog"]');
    await expect(page.locator("dialog[data-menu-sheet]")).toBeVisible();
    const top = await page.locator("header").evaluate((el) => el.getBoundingClientRect().top);
    expect(top).toBe(0);
    // The page stays where it was (A7 review: the first fix jumped it back to the top)…
    expect(await page.evaluate(() => window.scrollY)).toBe(scrolled);
    // …and is locked: a scroll attempt does not move it.
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(150);
    expect(await page.evaluate(() => window.scrollY)).toBe(scrolled);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(600);
    expect(await page.evaluate(() => window.scrollY)).toBe(scrolled);
  });

  test(`${locale}: widening the window closes the sheet and keeps focus visible`, async ({
    page
  }) => {
    await open(page, locale, 360);
    await page.locator('button[aria-haspopup="dialog"]').click();
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.locator("dialog[data-menu-sheet]")).toBeHidden();
    // The menu button is gone at this width, so focus moves to the logo, not to <body>.
    expect(
      await page.evaluate(() => document.activeElement?.hasAttribute("data-header-home"))
    ).toBe(true);
  });

  test(`${locale}: no serious accessibility issues in the header and the open sheet`, async ({
    page
  }) => {
    for (const width of [1280, 360]) {
      await open(page, locale, width);
      if (width === 360) await page.locator('button[aria-haspopup="dialog"]').click();
      const results = await new AxeBuilder({ page })
        .include(width === 360 ? "dialog[data-menu-sheet]" : "header")
        .analyze();
      const serious = results.violations.filter((v) =>
        ["serious", "critical"].includes(v.impact ?? "")
      );
      expect(
        serious.map((v) => `${v.id}: ${v.help}`),
        `${width}px`
      ).toEqual([]);
    }
  });
}

test("reduced motion: the header and its rule do not animate", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page, "ar", 1280);
  const names = await page
    .locator("header, header *")
    .evaluateAll((els) => els.map((el) => getComputedStyle(el).animationName));
  expect(names.every((name) => name === "none")).toBe(true);
});
