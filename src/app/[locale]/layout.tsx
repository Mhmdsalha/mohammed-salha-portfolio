import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import "@/app/globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { legacyMono } from "@/app/fonts";
import { Background } from "@/components/ui/Background";
import { LOCALES, dirOf, isLocale } from "@/lib/i18n/locales";
import { defaultOgImage, siteUrl, socialMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

// No `dynamicParams = false` here: Next applies it to every child route, so project pages would
// stop accepting slugs added after the build (A7 review, D-026). The isLocale() check below
// turns any other first segment (only paths with a dot reach it) into a 404.

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "site.meta" });
  const siteName = t("siteName");

  // Site-wide defaults (P3-3, D-027). Canonical, hreflang and og:url are set by each page, never
  // here: the layout's would be inherited by every page that forgets its own (A7 review).
  return {
    metadataBase: siteUrl(),
    title: { default: t("title"), template: `%s — ${siteName}` },
    description: t("description"),
    applicationName: siteName,
    authors: [{ name: siteName }],
    creator: siteName,
    ...socialMetadata({
      locale,
      siteName,
      title: t("title"),
      description: t("description"),
      image: defaultOgImage(locale, t("ogImageAlt"))
    })
  };
}

/**
 * Root layout for the public site (there is no app/layout.tsx; dashboard, dev and the global 404
 * have their own): <html lang dir> comes from the locale (P3-2), so /ar is Arabic right-to-left
 * from the first byte. No NextIntlClientProvider: every translation is
 * resolved on the server, so the messages are not shipped to the browser (D-023, D-026).
 * Client components that need copy receive it as props.
 */
export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale} dir={dirOf(locale)} suppressHydrationWarning>
      <body className={legacyMono.variable}>
        {/* Old site's backdrop; the new pages paint over it until P4-10 removes it. */}
        <Background />
        {children}
        {/* Real-visitor Core Web Vitals: the LCP budget is judged on this field data (D-024). */}
        <SpeedInsights />
      </body>
    </html>
  );
}
