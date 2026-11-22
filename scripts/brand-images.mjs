// Renders the share cards and icons from /dev/brand (P3-3, D-027).
//
//   npm run dev                      (in another terminal)
//   node scripts/brand-images.mjs    [BASE_URL=http://localhost:3000] [PW_CHANNEL=msedge]
//
// Writes public/og/{ar,en}.jpg (1200×630), src/app/icon.png (512), src/app/apple-icon.png (180)
// and src/app/favicon.ico (32 + 16 + 48; Next reads the size of the first). Commit the results; the build does not run this.
import { mkdir, writeFile as writeFileAt } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
// Paths are relative to the repo root, wherever the script is run from.
const ROOT = new URL("../", import.meta.url);
const fromRoot = (path) => fileURLToPath(new URL(path, ROOT));
const writeFile = (path, data) => writeFileAt(fromRoot(path), data);

/** An .ico holding PNG images (supported by every current browser). */
function icoFromPngs(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);
  let offset = 6 + 16 * entries.length;
  const directory = entries.map(({ size, png }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += png.length;
    return entry;
  });
  return Buffer.concat([header, ...directory, ...entries.map(({ png }) => png)]);
}

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || undefined });
try {
  const page = await browser.newPage({
    viewport: { width: 1400, height: 900 },
    deviceScaleFactor: 1
  });
  const response = await page
    .goto(`${BASE_URL}/dev/brand`, { waitUntil: "networkidle" })
    .catch((error) => {
      throw new Error(`Cannot reach ${BASE_URL}/dev/brand: start \`npm run dev\` first.`, {
        cause: error
      });
    });
  if (!response?.ok()) throw new Error(`/dev/brand returned ${response?.status()}: run next dev`);
  await page.evaluate(() => document.fonts.ready);
  // Hide Next's dev indicator, which would otherwise land in a corner of the screenshots.
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  await page.waitForFunction(() =>
    [...document.images].every((image) => image.complete && image.naturalWidth > 0)
  );

  const shot = (name, options = {}) =>
    page.locator(`[data-brand="${name}"]`).screenshot({ animations: "disabled", ...options });

  await mkdir(fromRoot("public/og"), { recursive: true });
  for (const locale of ["ar", "en"]) {
    await writeFile(
      `public/og/${locale}.jpg`,
      await shot(`og-${locale}`, { type: "jpeg", quality: 82 })
    );
  }

  // Rounded icons keep transparent corners (every background behind them is cleared); the Apple
  // icon is square and opaque.
  await page.evaluate(() => {
    for (const element of [
      document.documentElement,
      document.body,
      document.querySelector("main")
    ]) {
      element?.style.setProperty("background", "transparent", "important");
    }
  });
  await writeFile("src/app/icon.png", await shot("icon-512", { omitBackground: true }));
  await writeFile("src/app/apple-icon.png", await shot("icon-180"));
  const small = [];
  for (const size of [32, 16, 48]) {
    small.push({ size, png: await shot(`icon-${size}`, { omitBackground: true }) });
  }
  await writeFile("src/app/favicon.ico", icoFromPngs(small));
  console.log("Wrote public/og/{ar,en}.jpg, src/app/icon.png, apple-icon.png and favicon.ico");
} finally {
  await browser.close();
}
