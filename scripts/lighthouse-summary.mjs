// Summarises Lighthouse JSON reports into e2e/baseline/lighthouse.json (P0-2).
// Reproduce the baseline (mobile preset is Lighthouse's default):
//   npx -y lighthouse@12.8.2 https://<site>/ar --output=json --output-path=lh-ar.json \
//     --chrome-flags="--headless=new"            (set CHROME_PATH to Chrome or Edge)
//   npx -y lighthouse@12.8.2 https://<site>/en --output=json --output-path=lh-en.json ...
//   node scripts/lighthouse-summary.mjs lh-ar.json lh-en.json
import { readFileSync, writeFileSync } from "node:fs";

const reports = process.argv.slice(2);
if (reports.length === 0) {
  console.error("Usage: node scripts/lighthouse-summary.mjs <report.json> [...]");
  process.exit(1);
}

const out = {
  capturedAt: new Date().toISOString(),
  tool: "lighthouse 12.8.2, mobile (default), Microsoft Edge headless",
  pages: {}
};

for (const file of reports) {
  const r = JSON.parse(readFileSync(file, "utf8"));
  const c = r.categories;
  const a = r.audits;
  const items = a["resource-summary"]?.details?.items ?? [];
  const kb = (type) =>
    Math.round((items.find((i) => i.resourceType === type)?.transferSize ?? 0) / 1024);

  out.pages[new URL(r.finalDisplayedUrl).pathname] = {
    url: r.finalDisplayedUrl,
    scores: Object.fromEntries(
      ["performance", "accessibility", "best-practices", "seo"].map((k) => [
        k,
        Math.round(c[k].score * 100)
      ])
    ),
    metrics: {
      lcpMs: Math.round(a["largest-contentful-paint"].numericValue),
      fcpMs: Math.round(a["first-contentful-paint"].numericValue),
      tbtMs: Math.round(a["total-blocking-time"].numericValue),
      cls: Number(a["cumulative-layout-shift"].numericValue.toFixed(3)),
      speedIndexMs: Math.round(a["speed-index"].numericValue)
    },
    transferKB: { scripts: kb("script"), total: kb("total") },
    lcpElement:
      a["largest-contentful-paint-element"]?.details?.items?.[0]?.items?.[0]?.node?.snippet?.slice(
        0,
        160
      ) ?? null,
    failingAudits: Object.values(a)
      .filter((x) => x.score !== null && x.score < 0.9 && x.scoreDisplayMode === "binary")
      .map((x) => x.id)
      .slice(0, 15)
  };
}

writeFileSync("e2e/baseline/lighthouse.json", `${JSON.stringify(out, null, 2)}\n`);
console.log("Wrote e2e/baseline/lighthouse.json for", Object.keys(out.pages).join(", "));
