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
    // P3-1: every visible string in the new site comes from src/messages (AR and EN) (D-025).
    // Covers whole directories so new files are included automatically; the old-site files listed
    // under `ignores` are deleted in P4-10. The dashboard keeps its own copy until the D5 tickets.
    files: [
      "src/components/sections/home/**",
      "src/components/site/**",
      "src/components/ui/**",
      "src/app/\\[locale\\]/**"
    ],
    ignores: [
      "src/components/ui/{Background,GlassCard,LanguageSwitcher,NeonButton,ScrollReveal,SectionLabel,TagPill}.tsx",
      "src/app/\\[locale\\]/page.tsx",
      "src/app/\\[locale\\]/projects/**"
    ],
    rules: {
      // Text children. Symbols that are not words are allowed.
      "react/jsx-no-literals": [
        "error",
        { noStrings: true, ignoreProps: true, allowedStrings: ["✦", "—", "·", "/", "(", ")", "."] }
      ],
      // What jsx-no-literals lets through: user-facing attributes, and text picked by a condition.
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "JSXAttribute[name.name=/^(aria-label|aria-description|aria-roledescription|aria-valuetext|alt|title|placeholder)$/] > Literal",
          message: "User-facing attribute text must come from src/messages (t(...))."
        },
        {
          selector:
            "JSXAttribute[name.name=/^(aria-label|aria-description|aria-roledescription|aria-valuetext|alt|title|placeholder)$/] > JSXExpressionContainer > Literal",
          message: "User-facing attribute text must come from src/messages (t(...))."
        },
        {
          selector:
            ":matches(JSXElement, JSXFragment) > JSXExpressionContainer > :matches(ConditionalExpression, LogicalExpression) > Literal[value=/[A-Za-z\\u0600-\\u06FF]/]",
          message: "Text chosen by a condition must come from src/messages (t(...))."
        }
      ]
    }
  }
];

export default eslintConfig;
