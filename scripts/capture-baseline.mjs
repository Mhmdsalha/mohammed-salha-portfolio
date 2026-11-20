// P0-2 baseline capture (e2e/baseline/README.md). Cross-platform wrapper so the npm script can
// set CAPTURE_BASELINE without shell-specific syntax.
//   BASE_URL=<site> [PW_CHANNEL=msedge] npm run e2e:baseline
import { spawnSync } from "node:child_process";

const result = spawnSync("npx", ["playwright", "test", "--project=baseline", "--workers=1"], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: { ...process.env, CAPTURE_BASELINE: "1" }
});

process.exit(result.status ?? 1);
