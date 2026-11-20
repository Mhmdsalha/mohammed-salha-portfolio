// P0-2: reference screenshots and layout metrics of the site BEFORE the rebuild, so later work
// can be compared against it. Run with: BASE_URL=<site> npm run e2e:baseline
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "@playwright/test";

const LOCALES = ["ar", "en"] as const;
const WIDTHS = [360, 768, 1280, 1920] as const;
const OUT_DIR = path.join(__dirname, "baseline");

type Metrics = {
  url: string;
  width: number;
  status: number | null;
  documentHeight: number;
  horizontalOverflowPx: number;
  htmlLang: string | null;
  htmlDir: string | null;
  consoleErrors: string[];
};

const results: Metrics[] = [];

test.describe.configure({ mode: "serial" });

test.beforeAll(() => {
  mkdirSync(OUT_DIR, { recursive: true });
});

for (const locale of LOCALES) {
  for (const width of WIDTHS) {
    test(`baseline /${locale} at ${width}px`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text().slice(0, 300));
      });
      page.on("pageerror", (error) => consoleErrors.push(`pageerror: ${error.message}`));

      // Reduced motion gives stable, fully revealed screenshots of an animated page.
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.setViewportSize({ width, height: 900 });
      const response = await page.goto(`/${locale}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(1500);

      const layout = await page.evaluate(() => ({
        documentHeight: document.documentElement.scrollHeight,
        horizontalOverflowPx:
          document.documentElement.scrollWidth - document.documentElement.clientWidth,
        htmlLang: document.documentElement.getAttribute("lang"),
        htmlDir: document.documentElement.getAttribute("dir")
      }));

      await page.screenshot({
        path: path.join(OUT_DIR, `${locale}-${width}.jpg`),
        fullPage: true,
        type: "jpeg",
        quality: 60
      });

      results.push({
        url: page.url(),
        width,
        status: response?.status() ?? null,
        ...layout,
        consoleErrors
      });
    });
  }
}

test.afterAll(() => {
  writeFileSync(
    path.join(OUT_DIR, "metrics.json"),
    `${JSON.stringify({ capturedAt: new Date().toISOString(), baseURL: process.env.BASE_URL ?? "http://localhost:3000", results }, null, 2)}\n`
  );
});
