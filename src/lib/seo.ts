import type { Metadata } from "next";
import { DEFAULT_LOCALE, LOCALES, type AppLocale, otherLocale } from "@/lib/i18n/locales";

// SEO helpers shared by the layouts, pages, sitemap and robots (P3-3, D-027).

/**
 * The site's public origin, for absolute URLs in canonical links, Open Graph, the sitemap and
 * JSON-LD. NEXT_PUBLIC_SITE_URL wins (set it when a custom domain is added); on Vercel the
 * production domain is used on every deployment, so previews never advertise themselves.
 */
export function siteUrl(): URL {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return new URL(explicit || (vercel ? `https://${vercel}` : "http://localhost:3000"));
}

export function absoluteUrl(path: string): string {
  return new URL(path, siteUrl()).toString();
}

/** "/" -> "/ar"; "/projects/x" -> "/ar/projects/x". */
export function localePath(locale: AppLocale, path = "/"): string {
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

/** hreflang alternates for every locale, plus x-default (the Arabic page). */
export function languageAlternates(path = "/"): Record<string, string> {
  return {
    ...Object.fromEntries(LOCALES.map((locale) => [locale, localePath(locale, path)])),
    "x-default": localePath(DEFAULT_LOCALE, path)
  };
}

/** Canonical link and hreflang alternates for one page in one locale. */
export function alternatesFor(locale: AppLocale, path = "/"): Metadata["alternates"] {
  return { canonical: localePath(locale, path), languages: languageAlternates(path) };
}

export const OG_LOCALE: Record<AppLocale, string> = { ar: "ar_AR", en: "en_US" };

/** The 1200×630 share card for a locale, made by scripts/brand-images.mjs. */
export function defaultOgImage(locale: AppLocale, alt: string) {
  return { url: `/og/${locale}.jpg`, width: 1200, height: 630, alt, type: "image/jpeg" };
}

type Social = {
  locale: AppLocale;
  siteName: string;
  title: string;
  description: string;
  path: string;
  image: { url: string; width?: number; height?: number; alt: string; type?: string };
  type?: "website" | "article";
};

/**
 * Open Graph and Twitter tags. Next replaces these keys whole when a child page sets them, so
 * every page that sets one passes the full set through here.
 */
export function socialMetadata(social: Social): Pick<Metadata, "openGraph" | "twitter"> {
  const { locale, siteName, title, description, path, image } = social;
  return {
    openGraph: {
      type: social.type ?? "website",
      siteName,
      title,
      description,
      url: localePath(locale, path),
      locale: OG_LOCALE[locale],
      alternateLocale: [OG_LOCALE[otherLocale(locale)]],
      images: [image]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: image.url, alt: image.alt }]
    }
  };
}

/** A description cut to about 160 characters at a word boundary, for meta and Open Graph. */
export function clampDescription(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.،؛:–—-]+$/u, "")}…`;
}

/** JSON-LD as a string that is safe inside <script>: "<" can never close the tag. */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** Public profile links only (http/https), for JSON-LD sameAs. */
export function profileLinks(links: Array<string | null | undefined>): string[] {
  return links.filter((link): link is string => Boolean(link && /^https?:\/\/\S+$/i.test(link)));
}
