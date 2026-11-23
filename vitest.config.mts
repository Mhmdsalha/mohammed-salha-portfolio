import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // Tests run outside React Server Components, where "server-only" would throw on import.
      "server-only": fileURLToPath(new URL("./node_modules/server-only/empty.js", import.meta.url))
    }
  },
  // tsconfig keeps `jsx: preserve` for Next, so tests need their own JSX transform (React 19
  // automatic runtime). Component tests that render to a DOM also set
  // `// @vitest-environment jsdom` once A6 adds jsdom.
  oxc: {
    jsx: { runtime: "automatic", importSource: "react" }
  },
  test: {
    environment: "node",
    include: ["{tests,src}/**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next", "e2e"]
  }
});
