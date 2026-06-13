import Link from "next/link";
import { Locale } from "@/types";

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const nextLocale = locale === "ar" ? "en" : "ar";

  return (
    <Link
      href={`/${nextLocale}`}
      className="focus-ring rounded-full border border-black/10 bg-white/20 px-3 py-2 text-xs font-semibold text-[#050505] backdrop-blur-sm transition hover:border-[var(--border-neon)] md:border-[var(--border)] md:bg-white/[0.03] md:text-[var(--text-secondary)] md:hover:text-white"
    >
      {locale === "ar" ? "EN" : "AR"}
    </Link>
  );
}
