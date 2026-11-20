import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname
});

const eslintConfig = [
  {
    ignores: [
      ".claude/**",
      ".next/**",
      "out/**",
      "dist/**",
      "coverage/**",
      "test-results/**",
      "playwright-report/**",
      "next-env.d.ts",
      // Design mockup export: reference only, not app code (docs/DECISIONS.md D-012).
      "docs/design/**"
    ]
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // QA gate 1 (docs/PLAN.md): no `any`, no `@ts-ignore`.
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": ["error", { "ts-ignore": true }]
    }
  },
  {
    // QA gate 1: no `console.log` in app code. CLI scripts under scripts/ may print.
    files: ["src/**", "middleware.ts"],
    rules: {
      "no-console": ["error", { allow: ["warn", "error"] }]
    }
  }
];

export default eslintConfig;
