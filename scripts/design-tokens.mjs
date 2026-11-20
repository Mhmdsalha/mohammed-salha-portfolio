// P2-1 acceptance: "No hex colour or font name outside globals.css" (docs/DECISIONS.md D-021).
// Run: node scripts/design-tokens.mjs   (part of `npm run lint`)
// Colours and font families must come from the tokens in src/app/globals.css.
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Files that may hold raw colours or font declarations. */
export const TOKEN_SOURCES = ["src/app/globals.css", "src/app/fonts.ts"];

/**
 * Old-site files that already break the rule. Each is deleted or rewritten by a P4 / D5 ticket;
 * remove its line when that happens. New files are never added here.
 */
export const LEGACY_ALLOWLIST = new Set(
  JSON.parse(readFileSync(new URL("./design-tokens-legacy.json", import.meta.url), "utf8")).files
);

const PALETTE =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const COLOUR_UTILITY_PREFIXES =
  "text|bg|border|border-[trblxyse]|ring|ring-offset|fill|stroke|from|via|to|outline|decoration|shadow|accent|caret|divide|placeholder|inset-shadow|inset-ring";
const NAMED_COLOURS =
  "white|black|red|green|blue|yellow|orange|purple|pink|gray|grey|silver|gold|navy|teal|maroon|olive|lime|aqua|fuchsia";

const RULES = [
  {
    name: "hex colour",
    // Not after a letter/digit (underscore counts as a separator, as in Tailwind's
    // `border-[1.5px_solid_#141414]`), "&" (entities), "/" (URLs) or "}" (`${path}#id`), nor as a
    // link target (href="#add").
    pattern:
      /(?<![0-9A-Za-z&/}])(?<!(?:href|to|xlinkHref)=["'`{]*)#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![0-9A-Za-z])/g
  },
  {
    name: "colour function",
    // rgb()/hsl()/hwb()/lab()/lch()/oklch()/oklab() with literal channels, any case, including
    // inside Tailwind arbitrary values (`shadow-[0_12px_24px_rgba(20,20,20,.18)]`). Colours built
    // from tokens, e.g. rgb(from var(--color-ink) …) or color-mix(… var(--color-ink) …), are fine.
    pattern: /(?<![A-Za-z0-9-])(?:rgba?|hsla?|hwb|lab|lch|oklch|oklab)\(\s*[\d.%+-]/gi
  },
  {
    name: "colour() with a colour space",
    pattern:
      /(?<![A-Za-z0-9-])color\(\s*(?:srgb|srgb-linear|display-p3|a98-rgb|prophoto-rgb|rec2020|xyz)/gi
  },
  {
    name: "Tailwind palette colour",
    // Default palette utilities bypass the design tokens: text-white, bg-black, text-red-500.
    pattern: new RegExp(
      `(?<![\\w-])(?:${COLOUR_UTILITY_PREFIXES})-(?:white|black|(?:${PALETTE})-\\d{2,3})(?![\\w-])`,
      "g"
    )
  },
  {
    name: "named colour",
    // CSS or style-object declarations such as `color: white` or `background: "red"`.
    pattern: new RegExp(
      `(?<![\\w-])(?:color|background(?:-color)?|backgroundColor|border(?:-color)?|borderColor|fill|stroke|outline(?:-color)?|outlineColor)\\s*:\\s*["'\`]?(?:${NAMED_COLOURS})(?![\\w-])`,
      "gi"
    )
  },
  {
    name: "font declaration",
    // Any font-family outside the token sources: CSS, style objects and Tailwind font-[…].
    pattern: /(?<![\w-])(?:font-family\s*:|fontFamily\s*:|font-\[)/g
  },
  {
    name: "next/font import",
    // Fonts are loaded only in src/app/fonts.ts.
    pattern: /from\s+["']next\/font\//g
  }
];

/** Blanks out comments so prose such as `// see #123` is not checked. Keeps line numbers. */
function stripComments(line, state) {
  let out = "";
  let i = 0;
  while (i < line.length) {
    if (state.inBlock) {
      const end = line.indexOf("*/", i);
      if (end === -1) return out;
      state.inBlock = false;
      i = end + 2;
      continue;
    }
    const block = line.indexOf("/*", i);
    // A line comment starts at "//" that is not part of a URL ("https://", "'//cdn…'").
    const lineComment = line.slice(i).search(/(?<![:"'`])\/\//);
    const lineAt = lineComment === -1 ? -1 : i + lineComment;
    if (lineAt !== -1 && (block === -1 || lineAt < block)) return out + line.slice(i, lineAt);
    if (block === -1) return out + line.slice(i);
    out += line.slice(i, block);
    state.inBlock = true;
    i = block + 2;
  }
  return out;
}

/** Returns every violation in one file's text, with 1-based line numbers. */
export function findViolations(text) {
  const violations = [];
  const state = { inBlock: false };
  text.split(/\r?\n/).forEach((raw, index) => {
    const line = stripComments(raw, state);
    for (const rule of RULES) {
      for (const match of line.matchAll(rule.pattern)) {
        violations.push({ line: index + 1, rule: rule.name, match: match[0] });
      }
    }
  });
  return violations;
}

function listSourceFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return listSourceFiles(full);
    return /\.(?:[cm]?[jt]sx?|css)$/.test(name) ? [full] : [];
  });
}

export function checkRepo(root = process.cwd()) {
  const problems = [];
  for (const file of listSourceFiles(path.join(root, "src"))) {
    const rel = path.relative(root, file).split(path.sep).join("/");
    if (TOKEN_SOURCES.includes(rel) || LEGACY_ALLOWLIST.has(rel)) continue;
    for (const v of findViolations(readFileSync(file, "utf8"))) problems.push({ file: rel, ...v });
  }
  const staleAllowlist = [...LEGACY_ALLOWLIST].filter((rel) => {
    try {
      return findViolations(readFileSync(path.join(root, rel), "utf8")).length === 0;
    } catch {
      return true; // file deleted
    }
  });
  return { problems, staleAllowlist };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const { problems, staleAllowlist } = checkRepo();
  for (const p of problems) {
    console.error(`${p.file}:${p.line}  ${p.rule}: ${p.match}  (use a token from globals.css)`);
  }
  for (const rel of staleAllowlist) {
    console.error(`${rel} is clean or gone: remove it from scripts/design-tokens-legacy.json`);
  }
  if (problems.length || staleAllowlist.length) process.exit(1);
  console.log("Design tokens: no raw colours or font declarations outside globals.css.");
}
