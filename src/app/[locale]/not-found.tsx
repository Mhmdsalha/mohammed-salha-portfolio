import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { fontVariables } from "@/app/fonts";
import { isLocale } from "@/lib/i18n/locales";

// Localised 404 for /ar/... and /en/... (P3-2). Rendered inside the locale layout, so it has the
// right <html lang dir>. The designed version comes with the other error pages in P4-9.
export default async function LocaleNotFound() {
  const current = await getLocale();
  const locale = isLocale(current) ? current : "ar";
  const t = await getTranslations({ locale, namespace: "site.errors" });

  return (
    <main
      className={`${fontVariables} flex min-h-screen items-center justify-center bg-paper p-6 font-body text-ink`}
    >
      <div className="max-w-md space-y-3 text-center">
        <h1 className="font-display text-3xl font-black">{t("notFoundTitle")}</h1>
        <p className="text-ink-2">{t("notFoundBody")}</p>
        <Link href={`/${locale}`} className="inline-block font-semibold text-accent underline">
          {t("backHome")}
        </Link>
      </div>
    </main>
  );
}
