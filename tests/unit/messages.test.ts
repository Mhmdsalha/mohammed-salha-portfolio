// P3-1: the Arabic and English message files stay complete and in step.
import { describe, expect, it } from "vitest";
import ar from "@/messages/ar.json";
import en from "@/messages/en.json";

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

/** Flattens to "a.b.c" (and "a.list[2]") -> value. */
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

// ICU arguments ({year}, {count, plural, …}), not the words inside plural branches.
const placeholders = (text: string) =>
  [...text.matchAll(/\{(\w+)(?=[,}])/g)].map((m) => m[1]).sort();

/**
 * Keys whose Arabic value may equal the English one: proper names, technology names, numbers and
 * symbols that are the same in both languages.
 */
const SAME_IN_BOTH =
  /^(?:home\.spec\.role\.value|home\.spec\.stack\.items\.\d+|home\.marquee\.items\.\d+|home\.(?:spec|featured|archive|skills|education)\.(?:\w+\.)?index|home\.education\.rows\.(?:years|stack)\.value|home\.contact\.(?:github|linkedin))$/;

describe("message files", () => {
  it("use no arrays (an array switches off next-intl's key checking for its namespace)", () => {
    expect([...EN.keys()].filter((key) => key.endsWith(".length"))).toEqual([]);
  });

  it("have exactly the same keys and list lengths", () => {
    expect([...AR.keys()].sort()).toEqual([...EN.keys()].sort());
  });

  it("have no empty values", () => {
    for (const [key, value] of [...strings(AR), ...strings(EN)]) {
      expect(value.trim(), key).not.toBe("");
    }
  });

  it("use the same placeholders in both languages", () => {
    for (const [key, value] of strings(EN)) {
      expect(placeholders(String(AR.get(key))), key).toEqual(placeholders(value));
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
