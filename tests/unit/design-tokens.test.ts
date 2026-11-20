// P2-1: colours and font families live only in src/app/globals.css (and fonts.ts for next/font).
import { describe, expect, it } from "vitest";
import { checkRepo, findViolations } from "../../scripts/design-tokens.mjs";

const rules = (text: string) => findViolations(text).map((v) => v.rule);
const clean = (text: string) => expect(findViolations(text), text).toEqual([]);

describe("colours", () => {
  it("flags hex colours, including inside Tailwind arbitrary values", () => {
    expect(rules('className="text-[#C8302A]"')).toEqual(["hex colour"]);
    expect(rules("color: #fff;")).toEqual(["hex colour"]);
    expect(rules("border-[1.5px_solid_#141414]")).toEqual(["hex colour"]);
    expect(rules("const c = `#FFF`;")).toEqual(["hex colour"]);
  });

  it("flags colour functions in any case and notation (A7 review)", () => {
    expect(rules("background: rgba(20, 20, 20, 0.18)")).toEqual(["colour function"]);
    expect(rules("shadow-[0_12px_24px_rgba(20,20,20,.18)]")).toEqual(["colour function"]);
    expect(rules("color: RGB( 1 2 3 )")).toEqual(["colour function"]);
    for (const fn of [
      "hsl(10 20% 30%)",
      "hwb(10 20% 30%)",
      "lab(50% 40 59)",
      "lch(52% 72 50)",
      "oklch(0.6 0.2 30)",
      "oklab(0.6 0.1 0.1)"
    ]) {
      expect(rules(`color: ${fn}`), fn).toEqual(["colour function"]);
    }
    expect(rules("color: color(display-p3 1 0 0)")).toEqual(["colour() with a colour space"]);
  });

  it("flags Tailwind palette utilities and named colours", () => {
    expect(rules('className="text-white bg-black"')).toEqual([
      "Tailwind palette colour",
      "Tailwind palette colour"
    ]);
    expect(rules('className="text-red-500 border-t-slate-200 ring-offset-blue-50"')).toHaveLength(
      3
    );
    expect(rules('style={{ color: "white" }}')).toEqual(["named colour"]);
    expect(rules("background-color: red;")).toEqual(["named colour"]);
  });

  it("allows colours built from tokens", () => {
    clean('className="bg-paper text-ink border-line shadow-lift text-on-accent"');
    clean("color: var(--color-accent);");
    clean("color: color-mix(in srgb, var(--color-ink) 50%, transparent);");
    clean("background: rgb(from var(--color-ink) r g b / 0.5);");
    clean('className="text-white-space bg-blackout"'); // not palette utilities
  });
});

describe("fonts", () => {
  it("flags any font declaration or next/font import outside the token sources", () => {
    expect(rules('style={{ fontFamily: "Cairo, Georgia" }}')).toEqual(["font declaration"]);
    expect(rules("font-family: 'IBM Plex Sans Arabic';")).toEqual(["font declaration"]);
    expect(rules("className=\"font-['Cairo']\"")).toEqual(["font declaration"]);
    expect(rules('import { Alexandria } from "next/font/google";')).toEqual(["next/font import"]);
  });

  it("allows font tokens and prose that mentions a font", () => {
    clean('className="font-display font-body font-label"');
    clean("<p>Studied at Alexandria University; Inter-university exchange</p>");
  });
});

describe("no false positives", () => {
  it("ignores anchors, ids, URLs and comments", () => {
    clean('href="#featured" id="contact" aria-controls="tab-panel-1"');
    clean('href="#add"');
    clean("const url = `/${locale}#feed`;");
    clean("const link = 'https://example.com/#abc';");
    clean("// see #123 and #1234");
    clean("/* rgba(0, 0, 0, 0.5) was the old shadow */");
    clean("const interval = setInterval(next, 6500);");
  });

  it("keeps checking code before a trailing comment and after a block comment", () => {
    expect(rules('const a = "#fff"; // white')).toEqual(["hex colour"]);
    expect(rules("/* note */ color: #fff;")).toEqual(["hex colour"]);
  });

  it("reports line numbers across multi-line comments", () => {
    const text = ["/*", " * #fff in a comment", " */", "border: 1px solid #141414;"].join("\n");
    expect(findViolations(text)).toEqual([{ line: 4, rule: "hex colour", match: "#141414" }]);
  });
});

describe("repository", () => {
  it("has no raw colours or font declarations outside globals.css, except listed legacy files", () => {
    const { problems, staleAllowlist } = checkRepo();
    expect(problems).toEqual([]);
    expect(staleAllowlist).toEqual([]);
  });
});
