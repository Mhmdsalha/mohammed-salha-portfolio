import { Code2, SlidersHorizontal, Store } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Locale } from "@/types";

const services = [
  {
    icon: Store,
    titleEn: "Salla Store Design",
    titleAr: "تصميم متاجر سلة",
    descEn: "Custom Salla storefronts with complete visual identity, responsive sections, and conversion-focused details.",
    descAr: "تصميم متاجر سلة مخصصة بهوية بصرية متكاملة وتفاصيل ترفع جودة تجربة الشراء."
  },
  {
    icon: Code2,
    titleEn: "Web Development",
    titleAr: "تطوير مواقع ويب",
    descEn: "Modern full-stack applications with fast interfaces, clean architecture, and thoughtful bilingual support.",
    descAr: "تطوير تطبيقات ويب حديثة بأداء عال وبنية نظيفة ودعم عربي/إنجليزي مدروس."
  },
  {
    icon: SlidersHorizontal,
    titleEn: "Store Customization",
    titleAr: "تخصيص وتحسين المتاجر",
    descEn: "Refining existing Salla stores with custom sections, UX fixes, performance improvements, and premium polish.",
    descAr: "تحسين متاجر سلة الحالية بأقسام مخصصة، إصلاحات تجربة المستخدم، ورفع مستوى الواجهة."
  }
];

export function ServicesSection({ locale }: { locale: Locale }) {
  const isAr = locale === "ar";

  return (
    <section id="services" className="section-shell py-24 md:py-36">
      <SectionLabel>{"// 03 - SERVICES"}</SectionLabel>
      <h2 className="font-duran text-4xl font-black text-white md:text-6xl">
        {isAr ? "ما أقدمه" : "What I Do"}
      </h2>
      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {services.map((service) => (
          <GlassCard key={service.titleEn} as="article" className="p-6">
            <service.icon className="size-10 text-[var(--neon)] drop-shadow-[0_0_16px_rgba(0,245,255,0.55)]" />
            <h3 className="mt-7 text-xl font-semibold text-white">
              {isAr ? service.titleAr : service.titleEn}
            </h3>
            <p className="font-arabic mt-2 text-sm text-[var(--text-muted)]">
              {isAr ? service.titleEn : service.titleAr}
            </p>
            <p className="mt-5 min-h-24 text-sm leading-7 text-[var(--text-secondary)]">
              {isAr ? service.descAr : service.descEn}
            </p>
            <a href="#contact" className="focus-ring mt-5 inline-flex text-sm text-[var(--neon)]">
              {isAr ? "اعرف المزيد" : "Learn More"} →
            </a>
          </GlassCard>
        ))}
      </div>
    </section>
  );
}
