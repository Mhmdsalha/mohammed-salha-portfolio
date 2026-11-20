// P2-1: colours and font names live only in src/app/globals.css (and fonts.ts for next/font).
import { describe, expect, it } from "vitest";
import { checkRepo, findViolations } from "../../scripts/design-tokens.mjs";

const rules = (text: string) => findViolations(text).map((v) => `${v.rule}: ${v.match}`);

describe("findViolations", () => {
  it("flags raw colours in any notation", () => {
    expect(rules('className="text-[#C8302A]"')).toEqual(["hex colour: #C8302A"]);
    expect(rules("color: #fff;")).toEqual(["hex colour: #fff"]);
    expect(rules("background: rgba(20, 20, 20, 0.18)")).toEqual(["rgb/hsl colour: rgba(2"]);
    expect(rules("color: oklch(0.6 0.2 30)")).toEqual(["rgb/hsl colour: oklch(0"]);
  });

  it("flags font names, including next/font identifiers", () => {
    expect(rules('fontFamily: "Alexandria"')).toEqual(["font name: Alexandria"]);
    expect(rules("import { IBM_Plex_Mono } from 'next/font/google'")).toEqual([
      "font name: IBM_Plex"
    ]);
    expect(rules("font-family: 'IBM Plex Sans Arabic'")).toEqual(["font name: IBM Plex"]);
  });

  it("allows tokens, anchors, ids and ordinary words", () => {
    expect(rules('className="bg-paper text-ink font-display rounded-frame"')).toEqual([]);
    expect(rules('href="#featured" id="contact"')).toEqual([]);
    expect(rules('href="#add" aria-controls="tab-panel-1"')).toEqual([]);
    expect(rules("const interval = setInterval(next, 6500); // Interval")).toEqual([]);
    expect(rules("color: var(--color-accent);")).toEqual([]);
  });

  it("reports line numbers", () => {
    expect(findViolations("ok\nborder: 1px solid #141414;")[0].line).toBe(2);
  });
});

describe("repository", () => {
  it("has no raw colours or font names outside globals.css, except listed legacy files", () => {
    const { problems, staleAllowlist } = checkRepo();
    expect(problems).toEqual([]);
    expect(staleAllowlist).toEqual([]);
  });
});
