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
    expect(order).toHaveLength(8);
    expect(new Set(order).size).toBe(8);
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
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe(
      "hidden"
    );

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
