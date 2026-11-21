// P3-1: the Arabic and English message files stay complete, valid and in step.
import { TYPE, parse, type MessageFormatElement } from "@formatjs/icu-messageformat-parser";
import { IntlMessageFormat } from "intl-messageformat";
import { describe, expect, it } from "vitest";
import ar from "@/messages/ar.json";
import en from "@/messages/en.json";

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

/** Flattens to "a.b.c" -> value; arrays are marked so the no-arrays test can see them. */
function flatten(value: Json, prefix = ""): Map<string, Json> {
  const out = new Map<string, Json>();
  if (Array.isArray(value)) {
    out.set(`${prefix}.length`, value.length);
    value.forEach((v, i) => flatten(v, `${prefix}[${i}]`).forEach((x, k) => out.set(k, x)));
  } else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      flatten(v, prefix ? `${prefix}.${k}` : k).forEach((x, key) => out.set(key, x));
    }
  } else {
    out.set(prefix, value);
  }
  return out;
}

const AR = flatten(ar as Json);
const EN = flatten(en as Json);
const strings = (m: Map<string, Json>) =>
  [...m].filter((entry): entry is [string, string] => typeof entry[1] === "string");

type Shape = { args: string[]; tags: string[]; plurals: { name: string; options: string[] }[] };

/** Arguments, rich-text tags and plural forms of a parsed ICU message. */
function shape(elements: MessageFormatElement[]): Shape {
  const args = new Set<string>();
  const tags = new Set<string>();
  const plurals: Shape["plurals"] = [];
  const walk = (els: MessageFormatElement[]) => {
    for (const el of els) {
      if (el.type === TYPE.tag) {
        tags.add(el.value);
        walk(el.children);
      } else if (el.type === TYPE.plural || el.type === TYPE.select) {
        args.add(el.value);
        if (el.type === TYPE.plural)
          plurals.push({ name: el.value, options: Object.keys(el.options) });
        Object.values(el.options).forEach((option) => walk(option.value));
      } else if (
        el.type === TYPE.argument ||
        el.type === TYPE.number ||
        el.type === TYPE.date ||
        el.type === TYPE.time
      ) {
        args.add(el.value);
      }
    }
  };
  walk(elements);
  return { args: [...args].sort(), tags: [...tags].sort(), plurals };
}

const parsed = (locale: "ar" | "en", map: Map<string, Json>) =>
  strings(map).map(([key, value]) => {
    try {
      return { key, value, shape: shape(parse(value)), error: null as string | null };
    } catch (error) {
      return { key, value, shape: null, error: `${locale}: ${(error as Error).message}` };
    }
  });

const AR_PARSED = parsed("ar", AR);
const EN_PARSED = parsed("en", EN);

/**
 * Keys whose Arabic value may equal the English one: proper names, technology names, numbers and
 * symbols that are the same in both languages.
 */
const SAME_IN_BOTH =
  /^(?:home\.spec\.role\.value|home\.spec\.stack\.items\.\d+|home\.marquee\.items\.\d+|home\.(?:spec|featured|archive|skills|education)\.(?:\w+\.)?index|home\.education\.rows\.stack\.value|home\.contact\.(?:github|linkedin))$/;

describe("message files", () => {
  it("use no arrays (an array switches off next-intl's key checking for its namespace)", () => {
    expect([...EN.keys()].filter((key) => key.endsWith(".length"))).toEqual([]);
  });

  it("have exactly the same keys", () => {
    expect([...AR.keys()].sort()).toEqual([...EN.keys()].sort());
  });

  it("have no empty values", () => {
    for (const [key, value] of [...strings(AR), ...strings(EN)]) {
      expect(value.trim(), key).not.toBe("");
    }
  });

  it("are valid ICU messages", () => {
    const errors = [...AR_PARSED, ...EN_PARSED]
      .filter((m) => m.error)
      .map((m) => `${m.key}: ${m.error}`);
    expect(errors).toEqual([]);
  });

  it("use the same arguments and rich-text tags in both languages", () => {
    const byKey = new Map(AR_PARSED.map((m) => [m.key, m.shape]));
    for (const { key, shape: enShape } of EN_PARSED) {
      const arShape = byKey.get(key);
      expect(arShape?.args, `${key} arguments`).toEqual(enShape?.args);
      expect(arShape?.tags, `${key} tags`).toEqual(enShape?.tags);
    }
  });

  it("give every Arabic plural all six forms (zero, one, two, few, many, other)", () => {
    const required = new Intl.PluralRules("ar").resolvedOptions().pluralCategories;
    for (const { key, shape: s } of AR_PARSED) {
      for (const plural of s?.plurals ?? []) {
        expect(plural.options, `${key} {${plural.name}}`).toEqual(expect.arrayContaining(required));
      }
    }
  });

  it("format without errors for typical numbers", () => {
    for (const [locale, list] of [
      ["ar", AR_PARSED],
      ["en", EN_PARSED]
    ] as const) {
      for (const { key, value, shape: s } of list) {
        if (!s || (s.args.length === 0 && s.tags.length === 0)) continue;
        for (const n of [0, 1, 2, 3, 11, 100]) {
          const values: Record<string, unknown> = Object.fromEntries(s.args.map((arg) => [arg, n]));
          s.tags.forEach((tag) => (values[tag] = (chunks: unknown[]) => chunks.join("")));
          const out = new IntlMessageFormat(value, locale).format(values);
          expect(String(out), `${locale} ${key} n=${n}`).not.toMatch(/[{}]/);
        }
      }
    }
  });

  it("are translated: Arabic differs from English except for names and symbols", () => {
    const untranslated = strings(EN)
      .filter(([key, value]) => AR.get(key) === value && !SAME_IN_BOTH.test(key))
      .map(([key]) => key);
    expect(untranslated).toEqual([]);
  });

  it("contain no Salla copy (non-goal, P0-3 follow-up)", () => {
    for (const [key, value] of [...strings(AR), ...strings(EN)]) {
      expect(value, key).not.toMatch(/salla|سلة/i);
    }
  });
});
