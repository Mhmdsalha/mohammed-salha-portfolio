import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { fontVariables } from "@/app/fonts";
import type { AppLocale } from "@/lib/i18n/locales";

// The localised 404 message, shared by src/app/global-not-found.tsx (unmatched URLs, rendered on
// the server) and src/app/[locale]/not-found.tsx (notFound() from a page). The designed version
// comes with the other error pages in P4-9.
export async function NotFoundContent({ locale }: { locale: AppLocale }) {
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
