import { defineConfig, devices } from "@playwright/test";

/**
 * E2E and visual tests (A6). Target any running site with BASE_URL:
 *   BASE_URL=https://mohammed-salha-portfolio.vercel.app npm run e2e
 * Default is a local `npm run start` on port 3000.
 * PW_CHANNEL picks an installed browser instead of Playwright's own Chromium (e.g. msedge
 * locally); CI installs Chromium with `npx playwright install --with-deps chromium`.
 */
const baseURL = process.env.BASE_URL ?? "http://localhost:3000";
const channel = process.env.PW_CHANNEL || undefined;

export default defineConfig({
  testDir: "e2e",
  outputDir: "test-results",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL,
    trace: "retain-on-failure"
  },
  projects: [
    {
      name: "e2e",
      testIgnore: /baseline\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], channel }
    },
    {
      // Captures reference screenshots of the current site; run on demand, never in CI.
      name: "baseline",
      testMatch: /baseline\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], channel }
    }
  ]
});
