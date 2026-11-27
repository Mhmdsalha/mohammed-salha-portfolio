import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { MobileMenu } from "@/components/site/MobileMenu";
import { Button } from "@/components/ui/Button";
import { FOCUS_RING } from "@/components/ui/focus";
import { type AppLocale, otherLocale } from "@/lib/i18n/locales";
import { localePath } from "@/lib/seo";

// Site header (P4-1, D-032, SPEC §3.1): sticky, translucent paper with a 10px blur; logo with the
// accent dot; section links (from 900px up); language pill; CV button; a 1px ink rule that draws
// in from the start side. Below 900px the links move into the MobileMenu sheet, and below 640px
// the CV button does too, so nothing overflows at 360px.
// Its height never changes on scroll, so it causes no layout shift.

const SECTIONS = [
  ["featured", "projects"],
  ["skills", "skills"],
  ["education", "education"],
  ["contact", "contact"]
] as const;

/** The CV file, served once D5-5 lets the dashboard upload it. */
export const CV_HREF = "/cv.pdf";

type SiteHeaderProps = {
  locale: AppLocale;
  /** The page holding the sections the links jump to: `/{locale}` (the preview until P4-10). */
  homePath: string;
  /** The current page without its locale (e.g. "/" or "/projects/x"), for the language switch. */
  currentPath: string;
};

export async function SiteHeader({ locale, homePath, currentPath }: SiteHeaderProps) {
  const t = await getTranslations({ locale, namespace: "site.nav" });
  const other = otherLocale(locale);
  const switchHref = localePath(other, currentPath);
  const links = SECTIONS.map(([id, key]) => ({ href: `${homePath}#${id}`, label: t(key) }));

  return (
    <>
      {/* Kept just above the viewport and slid into view on focus: always in the accessibility
          tree, never in the layout, so focusing it shifts nothing (A7 review: Tailwind's
          not-sr-only reset its padding). */}
      <a
        href="#main"
        className={`fixed start-4 top-4 z-50 -translate-y-[calc(100%+2rem)] rounded-full bg-ink px-5 py-3 font-semibold text-paper focus:translate-y-0 ${FOCUS_RING}`}
      >
        {t("skipToContent")}
      </a>

      <header data-site-header className="sticky top-0 z-20 bg-paper/90 backdrop-blur-[10px]">
        <div className="mx-auto flex max-w-page animate-fade-up items-center justify-between gap-4 px-gutter py-[18px] motion-reduce:animate-none">
          <Link
            href={homePath}
            data-header-home
            className={`font-display text-[21px] font-black whitespace-nowrap ${FOCUS_RING}`}
          >
            {t("logo")}
            <span className="text-accent">.</span>
          </Link>

          <nav
            aria-label={t("label")}
            className="hidden gap-7 text-[15px] font-medium min-[900px]:flex"
          >
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`${FOCUS_RING} bg-[linear-gradient(currentColor,currentColor)] bg-[length:0_2px] bg-no-repeat pb-[3px] [background-position:100%_100%] hover:bg-[length:100%_2px] focus-visible:bg-[length:100%_2px] ltr:[background-position:0_100%] motion-safe:transition-[background-size] motion-safe:duration-[400ms] motion-safe:ease-reveal`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button
              href={switchHref}
              variant="ghost"
              size="sm"
              hrefLang={other}
              lang={other}
              className="min-w-11"
            >
              {t("switchLocale")}
              <span className="sr-only">{t("switchLocaleLabel")}</span>
            </Button>
            <div className="hidden sm:block">
              <Button
                href={CV_HREF}
                variant="ink"
                size="sm"
                icon="download"
                download
                aria-label={t("cvLabel")}
              >
                {t("cv")}
              </Button>
            </div>
            <MobileMenu
              links={links}
              cvHref={CV_HREF}
              switchHref={switchHref}
              switchLang={other}
              copy={{
                open: t("openMenu"),
                close: t("closeMenu"),
                title: t("menuTitle"),
                cv: t("cv"),
                cvLabel: t("cvLabel"),
                switchLocale: t("switchLocale"),
                switchLocaleLabel: t("switchLocaleLabel")
              }}
            />
          </div>
        </div>
        <div
          aria-hidden="true"
          className="h-px animate-rule-draw bg-ink [animation-delay:0.2s] motion-reduce:animate-none ltr:origin-left rtl:origin-right"
        />
      </header>
    </>
  );
}
