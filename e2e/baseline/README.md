# Baseline: the site before the rebuild (P0-2)

Captured 2026-11-20 from production (`https://mohammed-salha-portfolio.vercel.app`, commit `6a6b6b0`), with Microsoft Edge through Playwright, reduced motion on. These are **reference images** for comparing the rebuild with what came before; they are not visual-regression snapshots (the new design replaces the page entirely). Visual snapshots of the new design are added with the P4 tickets.

Re-capture with:

```bash
BASE_URL=https://mohammed-salha-portfolio.vercel.app PW_CHANNEL=msedge npm run e2e:baseline
```

## Files

- `ar-{360,768,1280,1920}.jpg`, `en-…jpg`: full-page screenshots (JPEG, quality 60).
- `metrics.json`: status, page height, horizontal overflow, `<html lang/dir>` and console errors per page and width.
- `lighthouse.json`: Lighthouse 12.8.2 mobile scores and metrics for `/ar` and `/en` (one run each, so expect a few points of variance).

## What the baseline shows

|                     | `/ar`  | `/en`  | Plan target      |
| ------------------- | ------ | ------ | ---------------- |
| Performance         | 65     | 62     | 95               |
| Accessibility       | 96     | 96     | 100              |
| Best Practices      | 96     | 96     | 100              |
| SEO                 | 100    | 100    | 100              |
| LCP                 | 2.9 s  | 3.4 s  | < 2.0 s          |
| Total Blocking Time | 1.2 s  | 1.0 s  | —                |
| CLS                 | 0.001  | 0.008  | < 0.05           |
| Script transfer     | 122 KB | 122 KB | < 180 KB gzipped |

Problems the baseline confirms (audit IDs from `docs/PLAN.md`):

- `/ar` is served with `<html lang="en">` and no `dir` attribute (I2).
- 56 px of horizontal scroll at 768 and 1280 px, in both locales (R4).
- A 404 for a resource on `/ar` at 360 px, plus console errors flagged by Lighthouse.
- Colour-contrast failures (Lighthouse `color-contrast`).
- Lighthouse `bf-cache` failure (the page cannot be restored from the back/forward cache).
