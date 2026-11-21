"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { otherLocale, switchLocalePath } from "@/lib/i18n/locales";
import { Locale } from "@/types";

// Old-site switcher (replaced by the new header in P4-1). P3-2: it keeps the current page, e.g.
// /ar/projects/x -> /en/projects/x, instead of jumping to the other home page.
export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const nextLocale = otherLocale(locale);
  const pathname = usePathname() ?? `/${locale}`;

  return (
    <Link
      href={switchLocalePath(pathname, nextLocale)}
      hrefLang={nextLocale}
      className="focus-ring rounded-full border border-black/10 bg-white/20 px-3 py-2 text-xs font-semibold text-[#050505] backdrop-blur-sm transition hover:border-[var(--border-neon)] md:border-[var(--border)] md:bg-white/[0.03] md:text-[var(--text-secondary)] md:hover:text-white"
    >
      {locale === "ar" ? "EN" : "AR"}
    </Link>
  );
}
