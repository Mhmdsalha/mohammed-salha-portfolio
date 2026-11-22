import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { fontVariables } from "@/app/fonts";
import { LOCALES, type AppLocale, dirOf } from "@/lib/i18n/locales";

// Source of the share cards and icons (P3-3, D-027). scripts/brand-images.mjs screenshots each
// [data-brand] element at its exact size, so the images use the real fonts and tokens and Arabic
// is shaped by the browser (a canvas/Satori renderer would break the letter joins, R3).
// Development only: production returns 404.

export function generateMetadata(): Metadata {
  return process.env.NODE_ENV === "production"
    ? {}
    : { title: "Brand images", robots: { index: false } };
}

const STACK = ["1", "2", "3", "4"] as const;
const latin = (chunks: React.ReactNode) => <bdi className="whitespace-nowrap">{chunks}</bdi>;

async function OgCard({ locale }: { locale: AppLocale }) {
  const meta = await getTranslations({ locale, namespace: "site.meta" });
  const hero = await getTranslations({ locale, namespace: "home.hero" });
  const stack = await getTranslations({ locale, namespace: "home.spec.stack.items" });

  return (
    <div
      data-brand={`og-${locale}`}
      lang={locale}
      dir={dirOf(locale)}
      className="relative flex h-[630px] w-[1200px] shrink-0 items-center gap-12 overflow-hidden bg-paper px-16 font-body text-ink"
    >
      <div aria-hidden="true" className="absolute inset-0 bg-dot-grid opacity-40" />
      <div className="relative min-w-0 flex-1">
        <p className="flex items-center gap-3 font-label text-[20px] font-medium text-ink-2">
          <span className="inline-block size-3 rounded-full bg-accent" />
          {meta("location")}
        </p>
        <p className="mt-5 font-display text-[88px] leading-[1.12] font-black">
          {meta("siteName")}
          <span className="text-accent">.</span>
        </p>
        <p className="mt-5 font-display text-[40px] leading-[1.3] font-extrabold">
          {hero("titleLine1")}
        </p>
        <p className="text-outline font-display text-[40px] leading-[1.3] font-extrabold">
          {hero.rich("titleLine2", { latin })}
        </p>
        <div dir="ltr" className="mt-9 flex flex-wrap justify-start gap-2.5 rtl:justify-end">
          {STACK.map((key) => (
            <span
              key={key}
              className="rounded-full border-[1.5px] border-ink px-4 py-1 text-[18px] font-medium"
            >
              {stack(key)}
            </span>
          ))}
        </div>
      </div>
      <div className="relative size-[360px] shrink-0 overflow-hidden rounded-full bg-accent shadow-portrait">
        <div aria-hidden="true" className="absolute inset-0 bg-dot-grid" />
        <Image
          src="/images/portrait.webp"
          alt=""
          width={700}
          height={750}
          priority
          className="absolute inset-x-0 bottom-0 mx-auto h-auto w-[88%]"
        />
      </div>
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-3 bg-ink" />
    </div>
  );
}

// The mark: "م." with the logo's accent dot ("محمد صالحة."), on ink. One element per size so each
// is rendered at its pixel size. `square` is for Apple touch icons, which iOS rounds itself.
function Mark({ size, square = false }: { size: number; square?: boolean }) {
  return (
    <div
      data-brand={`icon-${size}`}
      dir="rtl"
      style={{ width: size, height: size, fontSize: size * 0.66 }}
      className={`flex shrink-0 items-center justify-center bg-ink font-display font-black text-paper ${square ? "" : "rounded-[22%]"}`}
    >
      {/* The meem's tail hangs below the baseline: lift the pair so the ink is centred. */}
      <span className="leading-none" style={{ transform: `translateY(-${size * 0.09}px)` }}>
        م<span className="text-accent">.</span>
      </span>
    </div>
  );
}

export default async function BrandPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className={`${fontVariables} flex flex-col items-start gap-10 bg-paper-sunk p-10`}>
      {LOCALES.map((locale) => (
        <OgCard key={locale} locale={locale} />
      ))}
      {/* No background here: the rounded icons keep transparent corners. */}
      <div data-icons className="flex items-end gap-10">
        <Mark size={512} />
        <Mark size={180} square />
        <Mark size={48} />
        <Mark size={32} />
        <Mark size={16} />
      </div>
    </main>
  );
}
