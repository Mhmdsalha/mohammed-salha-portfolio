import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AboutSection } from "@/components/sections/AboutSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { HeroSection } from "@/components/sections/HeroSection";
import { ProjectsSection } from "@/components/sections/ProjectsSection";
import { ServicesSection } from "@/components/sections/ServicesSection";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { getProjects } from "@/lib/projects";
import { getSiteSettings } from "@/lib/site-settings";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { JsonLd } from "@/components/site/JsonLd";
import { otherLocale } from "@/lib/i18n/locales";
import { alternatesFor, defaultOgImage, profileLinks, socialMetadata } from "@/lib/seo";
import { profilePageJsonLd } from "@/lib/structured-data";
import { Locale } from "@/types";

// P3-3: canonical, hreflang, Open Graph with og:url, and the ProfilePage JSON-LD. P4-10 keeps
// them when it swaps the preview in (D-027).
export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "site.meta" });
  return {
    alternates: alternatesFor(locale),
    ...socialMetadata({
      locale,
      siteName: t("siteName"),
      title: t("title"),
      description: t("description"),
      path: "/",
      image: defaultOgImage(locale, t("ogImageAlt"))
    })
  };
}

export default async function PortfolioPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const [projects, settings, t, other] = await Promise.all([
    getProjects(),
    getSiteSettings(),
    getTranslations({ locale, namespace: "site.meta" }),
    getTranslations({ locale: otherLocale(locale), namespace: "site.meta" })
  ]);

  return (
    <>
      <JsonLd
        data={profilePageJsonLd({
          locale,
          name: t("siteName"),
          alternateName: other("siteName"),
          jobTitle: t("jobTitle"),
          description: t("description"),
          sameAs: profileLinks([settings.github, settings.linkedin])
        })}
      />
      <Header locale={locale} />
      <main>
        <HeroSection locale={locale} settings={settings} />
        <ScrollReveal>
          <AboutSection locale={locale} />
        </ScrollReveal>
        <ScrollReveal delay={80}>
          <ProjectsSection projects={projects} locale={locale} />
        </ScrollReveal>
        <ScrollReveal delay={120}>
          <ServicesSection locale={locale} />
        </ScrollReveal>
        <ScrollReveal delay={160}>
          <ContactSection locale={locale} settings={settings} />
        </ScrollReveal>
      </main>
      <Footer locale={locale} settings={settings} />
    </>
  );
}
