// P2-1 acceptance: "No hex colour or font name outside globals.css".
// Run: node scripts/design-tokens.mjs   (part of `npm run lint`)
// Colours and font families must come from the tokens in src/app/globals.css.
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Files that may hold raw colours or font names. */
export const TOKEN_SOURCES = ["src/app/globals.css", "src/app/fonts.ts"];

/**
 * Old-site files that already break the rule. Each is deleted or rewritten by a P4 / D5 ticket;
 * remove its line when that happens. New files are never added here.
 */
export const LEGACY_ALLOWLIST = new Set(
  JSON.parse(readFileSync(new URL("./design-tokens-legacy.json", import.meta.url), "utf8")).files
);

const FONT_NAMES = [
  "Alexandria",
  "IBM Plex",
  "IBM_Plex",
  "Plex Mono",
  "Plex Sans",
  "Opificio",
  "ExpoArabic",
  "EXPOARABIC",
  "JetBrains",
  "Inter",
  "Roboto",
  "Arial",
  "Helvetica"
];

const RULES = [
  {
    name: "hex colour",
    // Not after a word char, "&" (entities) or "/" (URLs), nor as a link target (href="#add").
    pattern:
      /(?<![\w&/])(?<!(?:href|to|xlinkHref)=["'`{]*)#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/g
  },
  { name: "rgb/hsl colour", pattern: /\b(?:rgba?|hsla?|oklch|oklab)\(\s*[\d.]/g },
  {
    name: "font name",
    // No trailing \b: next/font names such as IBM_Plex_Mono continue with "_". A following letter
    // still ends the match (so "Interval" is not "Inter").
    pattern: new RegExp(
      `\\b(?:${FONT_NAMES.map((n) => n.replace(/ /g, "[ _]")).join("|")})(?![a-zA-Z])`,
      "g"
    )
  }
];

/** Returns every violation in one file's text, with 1-based line numbers. */
export function findViolations(text) {
  const violations = [];
  text.split(/\r?\n/).forEach((line, index) => {
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
    return /\.(tsx?|css)$/.test(name) ? [full] : [];
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
  console.log("Design tokens: no raw colours or font names outside globals.css.");
}
