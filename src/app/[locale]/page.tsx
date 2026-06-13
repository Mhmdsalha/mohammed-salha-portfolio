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
import { Locale } from "@/types";

export default async function PortfolioPage({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const [projects, settings] = await Promise.all([getProjects(), getSiteSettings()]);

  return (
    <>
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
