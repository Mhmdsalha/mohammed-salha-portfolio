import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import "@/app/globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { legacyMono } from "@/app/fonts";
import { Background } from "@/components/ui/Background";
import { LOCALES, dirOf, isLocale } from "@/lib/i18n/locales";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

// Only "ar" and "en" exist: any other first segment (e.g. /xyz) is a 404 that Next renders on
// the server from src/app/not-found.tsx, instead of this layout failing on an unknown locale.
export const dynamicParams = false;

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "site.meta" });
  // Full SEO (Open Graph, hreflang, sitemap) is P3-3.
  return { title: t("title"), description: t("description") };
}

/**
 * Root layout for the public site (there is no app/layout.tsx; dashboard and dev have their own): <html lang dir> comes from the locale (P3-2), so /ar is
 * Arabic right-to-left from the first byte. No NextIntlClientProvider: every translation is
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
