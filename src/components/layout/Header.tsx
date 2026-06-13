"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { Locale } from "@/types";

const links = [
  { href: "#about", en: "About", ar: "نبذة" },
  { href: "#projects", en: "Work", ar: "الأعمال" },
  { href: "#services", en: "Services", ar: "الخدمات" },
  { href: "#contact", en: "Contact", ar: "التواصل" }
];

export function Header({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isAr = locale === "ar";

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-50 px-4 pt-4" dir="ltr">
        <div
          className={`mx-auto flex h-16 max-w-6xl items-center justify-between rounded-full border px-4 transition ${
            scrolled
              ? "border-black/10 bg-white/20 backdrop-blur-md md:border-[var(--border)] md:bg-black/60 md:backdrop-blur-xl"
              : "border-black/10 bg-white/10 backdrop-blur-[2px] md:border-white/5 md:bg-black/20 md:backdrop-blur-md"
          }`}
        >
          <Link
            href={`/${locale}`}
            className="focus-ring font-duran text-xl font-black tracking-wide text-[#050505] md:text-white"
          >
            MS
          </Link>

          <nav className="hidden items-center gap-8 md:flex" aria-label="Primary navigation">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="focus-ring group relative text-sm text-[var(--text-secondary)] transition hover:text-white"
              >
                {isAr ? link.ar : link.en}
                <span className="absolute -bottom-2 left-0 h-px w-0 bg-[var(--neon)] transition-all group-hover:w-full" />
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <LanguageSwitcher locale={locale} />
            <Link
              href="#contact"
              className="focus-ring hidden rounded-full border border-[var(--border-neon)] bg-[rgba(0,245,255,0.08)] px-4 py-2 text-xs font-semibold text-white transition hover:shadow-[0_0_24px_rgba(0,245,255,0.18)] sm:inline-flex"
            >
              {isAr ? "وظفني" : "Hire Me"}
            </Link>
            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((value) => !value)}
              className="focus-ring inline-flex size-10 items-center justify-center rounded-full border border-black/10 bg-white/20 text-[#050505] backdrop-blur-sm md:hidden"
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      {open ? (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-8 bg-black/85 px-8 text-center backdrop-blur-xl md:hidden">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="font-duran text-4xl font-black text-white"
            >
              {isAr ? link.ar : link.en}
            </a>
          ))}
        </div>
      ) : null}
    </>
  );
}
