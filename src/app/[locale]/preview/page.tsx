import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { fontVariables } from "@/app/fonts";
import { Hero } from "@/components/sections/home/Hero";
import type { Locale } from "@/types";

// Preview of the rebuilt home page (D-023). The new sections are assembled here, section by
// section, while the live home page keeps the old design; P4-10 swaps this in and deletes the old
// page. Not linked anywhere and not indexed.

export const metadata: Metadata = {
  title: "Preview",
  robots: { index: false, follow: false }
};

export default async function PreviewPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    // font-body sits below the layout's [dir] wrapper, which the old site's CSS still styles (D-022).
    <main className={`${fontVariables} min-h-screen bg-paper font-body text-ink`}>
      <div className="mx-auto max-w-page px-gutter">
        <Hero locale={locale} />
      </div>
    </main>
  );
}
