// Locale facts shared by layouts, middleware and the language switch (P3-2). Arabic first.

export const LOCALES = ["ar", "en"] as const;
export type AppLocale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: AppLocale = "ar";

export function isLocale(value: string | undefined): value is AppLocale {
  return LOCALES.includes(value as AppLocale);
}

export function dirOf(locale: AppLocale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

export function otherLocale(locale: AppLocale): AppLocale {
  return locale === "ar" ? "en" : "ar";
}

/**
 * The same page in another locale: swaps the first path segment when it is a locale, otherwise
 * prefixes one. Query and hash are kept. Examples: "/ar/projects/x?y#z" -> "/en/projects/x?y#z";
 * "/" -> "/en".
 */
export function switchLocalePath(href: string, target: AppLocale): string {
  const match = href.match(/^([^?#]*)(.*)$/);
  const path = match?.[1] || "/";
  const rest = match?.[2] ?? "";
  const segments = path.split("/").filter(Boolean);
  if (isLocale(segments[0])) segments[0] = target;
  else segments.unshift(target);
  return `/${segments.join("/")}${rest}`;
}
