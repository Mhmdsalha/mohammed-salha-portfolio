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
  },
  {
    // P3-1: every visible string in the new site comes from src/messages (AR and EN). Applies to
    // the new site's code only; old-site files are deleted in P4-10, and the dashboard keeps its
    // own copy until the D5 tickets (D-025). Symbols that are not words are allowed.
    files: [
      "src/components/sections/home/**",
      "src/components/site/**",
      "src/components/ui/{Button,Icon,LineReveal,Marquee,Reveal,SectionHeader,Tag}.tsx",
      "src/app/\\[locale\\]/preview/**"
    ],
    rules: {
      "react/jsx-no-literals": [
        "error",
        { noStrings: true, ignoreProps: true, allowedStrings: ["✦", "—", "·", "/", "(", ")", "."] }
      ]
    }
  }
];

export default eslintConfig;
