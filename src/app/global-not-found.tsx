import type { Metadata } from "next";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import "@/app/globals.css";
import { NotFoundContent } from "@/components/site/NotFoundContent";
import { DEFAULT_LOCALE, LOCALE_HEADER, dirOf, isLocale } from "@/lib/i18n/locales";

// 404 for every URL no route matches, e.g. /ar/xyz or /en/a/b (P3-2, D-026). Next renders it on
// the server with status 404, so crawlers and visitors get the localised page from the first
// byte. It is its own root layout. The locale comes from the header the middleware sets.
async function requestLocale() {
  const value = (await headers()).get(LOCALE_HEADER) ?? undefined;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await requestLocale();
  const t = await getTranslations({ locale, namespace: "site.errors" });
  return { title: t("notFoundTitle"), robots: { index: false, follow: false } };
}

export default async function GlobalNotFound() {
  const locale = await requestLocale();
  return (
    <html lang={locale} dir={dirOf(locale)}>
      <body>
        <NotFoundContent locale={locale} />
      </body>
    </html>
  );
}
