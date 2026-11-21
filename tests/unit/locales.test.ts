import { describe, expect, it } from "vitest";
import { DEFAULT_LOCALE, dirOf, isLocale, otherLocale, switchLocalePath } from "@/lib/i18n/locales";

describe("locales", () => {
  it("is Arabic first", () => {
    expect(DEFAULT_LOCALE).toBe("ar");
    expect(dirOf("ar")).toBe("rtl");
    expect(dirOf("en")).toBe("ltr");
    expect(otherLocale("ar")).toBe("en");
  });

  it("recognises only supported locales", () => {
    expect(isLocale("ar")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });
});

describe("switchLocalePath", () => {
  it("keeps the page when switching language", () => {
    expect(switchLocalePath("/ar", "en")).toBe("/en");
    expect(switchLocalePath("/ar/projects/arzaq", "en")).toBe("/en/projects/arzaq");
    expect(switchLocalePath("/en/preview", "ar")).toBe("/ar/preview");
  });

  it("keeps the query and hash", () => {
    expect(switchLocalePath("/ar/projects/x?tab=2#gallery", "en")).toBe(
      "/en/projects/x?tab=2#gallery"
    );
  });

  it("adds a locale where there is none, and handles a trailing slash", () => {
    expect(switchLocalePath("/", "en")).toBe("/en");
    expect(switchLocalePath("/projects/x", "ar")).toBe("/ar/projects/x");
    expect(switchLocalePath("/ar/", "en")).toBe("/en");
  });

  it("only treats a whole first segment as a locale", () => {
    expect(switchLocalePath("/arabic-page", "en")).toBe("/en/arabic-page");
  });
});
