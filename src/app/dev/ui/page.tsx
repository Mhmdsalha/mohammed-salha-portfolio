import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { LineReveal } from "@/components/ui/LineReveal";
import { Marquee } from "@/components/ui/Marquee";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Tag } from "@/components/ui/Tag";

// P2-2 demo of the design primitives, in RTL and LTR. Development only: production returns 404.
// Sample copy is hard-coded on purpose; real copy comes from the message files (P3-1).

export const metadata: Metadata = { title: "UI primitives", robots: { index: false } };

const STACK = [
  "Next.js",
  "React",
  "TypeScript",
  "FastAPI",
  "PostgreSQL",
  "Tailwind CSS",
  "WebSocket"
];

const COPY = {
  ar: {
    dir: "rtl" as const,
    lang: "ar",
    heading: "واجهة المكوّنات",
    lines: [{ text: "مهندس حاسوب" }, { text: "ومطوّر Full-Stack", outlined: true }],
    primary: "استعرض المشاريع",
    secondary: "تحميل السيرة الذاتية",
    cv: "السيرة الذاتية",
    caseStudy: "دراسة الحالة",
    live: "معاينة مباشرة",
    label: "مشروع تدريبي",
    kind: "منصة خدمات",
    eyebrow: "أبرز الأعمال",
    title: "المشاريع",
    outlined: "الرئيسية",
    aside: "كل أداة هنا مرتبطة بمشروع حقيقي.",
    revealText: "يظهر هذا المربع عند التمرير إليه، أو مباشرة إذا كانت الحركة مقللة.",
    stack: "التقنيات"
  },
  en: {
    dir: "ltr" as const,
    lang: "en",
    heading: "UI primitives",
    lines: [{ text: "Computer engineer" }, { text: "and Full-Stack developer", outlined: true }],
    primary: "View projects",
    secondary: "Download CV",
    cv: "CV",
    caseStudy: "Case study",
    live: "Live preview",
    label: "Training project",
    kind: "Services platform",
    eyebrow: "Selected work",
    title: "Featured",
    outlined: "projects",
    aside: "Every tool here is tied to a real project.",
    revealText: "This box rises in as you scroll to it, or simply appears with reduced motion.",
    stack: "Stack"
  }
};

function Demo({ locale }: { locale: keyof typeof COPY }) {
  const t = COPY[locale];
  return (
    <section dir={t.dir} lang={t.lang} aria-labelledby={`demo-${locale}`} data-demo={locale}>
      <div className="mx-auto max-w-page space-y-12 px-gutter py-section font-body">
        <h2 id={`demo-${locale}`} className="font-label text-sm text-ink-4">
          {t.heading} · {t.dir.toUpperCase()}
        </h2>

        <LineReveal lines={t.lines} className="text-hero" />

        <div className="flex flex-wrap gap-3" data-demo-part="buttons">
          <Button href="#" icon="arrow">
            {t.primary}
          </Button>
          <Button href="#" variant="ghost">
            {t.secondary}
          </Button>
          <Button variant="ink" size="md" icon="arrow">
            {t.caseStudy}
          </Button>
          <Button variant="ghost" size="md">
            {t.live}
          </Button>
          <Button variant="ink" size="sm" icon="download">
            {t.cv}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2" data-demo-part="tags">
          <Tag variant="accent">{t.label}</Tag>
          <Tag>{t.kind}</Tag>
          {STACK.slice(0, 4).map((s) => (
            <Tag key={s} variant="chip">
              {s}
            </Tag>
          ))}
          <Tag size="sm">{t.kind}</Tag>
        </div>

        <SectionHeader
          index="01"
          eyebrow={t.eyebrow}
          title={t.title}
          outlined={t.outlined}
          aside={<p className="max-w-[380px] text-ink-2">{t.aside}</p>}
        />

        <Reveal className="rounded-frame border border-line bg-paper-raised p-6">
          <p className="text-lead text-ink-2">{t.revealText}</p>
        </Reveal>
      </div>

      <Marquee items={STACK} label={t.stack} />
    </section>
  );
}

export default function UiPrimitivesPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="min-h-screen bg-paper text-ink">
      <Demo locale="ar" />
      <Demo locale="en" />
    </main>
  );
}
