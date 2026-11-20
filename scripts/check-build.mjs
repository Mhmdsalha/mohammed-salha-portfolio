// Runs after `next build` (npm "postbuild"), locally, in CI and on Vercel.
// Fails the build if Next did not compile the middleware: with an `src/app` directory Next only
// loads `src/middleware.ts`, and a misplaced file is silently ignored (A7 review of D1-1).
import { readFileSync } from "node:fs";

const manifestPath = ".next/server/middleware-manifest.json";
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const entries = Object.keys(manifest.middleware ?? {});

if (entries.length === 0) {
  console.error(
    `Build check failed: no middleware in ${manifestPath}. It must live at src/middleware.ts.`
  );
  process.exit(1);
}

console.log(`Build check passed: middleware compiled (${entries.join(", ")}).`);
