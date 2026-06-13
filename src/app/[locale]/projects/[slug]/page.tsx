import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Github, Layers, Sparkles, Zap } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LivePreviewFrame } from "@/components/projects/LivePreviewFrame";
import { GlassCard } from "@/components/ui/GlassCard";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { TagPill } from "@/components/ui/TagPill";
import {
  getProjectBySlug,
  getProjectDescription,
  getProjects,
  getProjectTitle
} from "@/lib/projects";
import { getSiteSettings } from "@/lib/site-settings";
import { Locale } from "@/types";

export async function generateStaticParams() {
  const projects = await getProjects();
  return ["en", "ar"].flatMap((locale) =>
    projects.map((project) => ({ locale, slug: project.slug }))
  );
}

export default async function ProjectDetailsPage({
  params
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  const [project, settings] = await Promise.all([getProjectBySlug(slug), getSiteSettings()]);

  if (!project) {
    notFound();
  }

  const isAr = locale === "ar";
  const title = getProjectTitle(project, locale);
  const description = getProjectDescription(project, locale);

  const highlights = [
    {
      icon: Sparkles,
      title: isAr ? "هوية بصرية" : "Visual System",
      text: isAr
        ? "واجهة داكنة متماسكة، هرمية واضحة، وتفاصيل عرض مناسبة لطبيعة المشروع."
        : "A cohesive dark interface, clear hierarchy, and presentation details shaped around the project."
    },
    {
      icon: Zap,
      title: isAr ? "تجربة سريعة" : "Fast Experience",
      text: isAr
        ? "المعاينة الحية تظهر في شاشة واضحة، مع روابط مباشرة للوصول للموقع والمستودع."
        : "The live site appears in a clean screen frame, with direct access to the live build and repository."
    },
    {
      icon: Layers,
      title: isAr ? "مربوط بالداشبورد" : "Dashboard Ready",
      text: isAr
        ? "البيانات والروابط تُدار من Supabase وتنعكس تلقائياً على الصفحة."
        : "Data and links are managed from Supabase and reflected on this page."
    }
  ];

  return (
    <>
      <Header locale={locale} />
      <main className="pt-28">
        <section className="section-shell pb-10 pt-8 md:pb-14">
          <Link
            href={`/${locale}#projects`}
            className="focus-ring mb-8 inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-white"
          >
            <ArrowLeft size={16} className={isAr ? "rotate-180" : ""} />
            {isAr ? "العودة إلى المشاريع" : "Back to projects"}
          </Link>

          <LivePreviewFrame title={title} liveUrl={project.live_url} />
        </section>

        <section className="section-shell grid gap-8 py-10 lg:grid-cols-[0.72fr_0.28fr] lg:items-start">
          <div>
            <SectionLabel>{"// PROJECT CASE STUDY"}</SectionLabel>
            <div className="flex flex-wrap items-center gap-3">
              <TagPill active>{project.category}</TagPill>
              {project.featured ? (
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-[11px] text-[var(--text-secondary)]">
                  {isAr ? "مشروع مميز" : "Featured"}
                </span>
              ) : null}
            </div>
            <h1 className="mt-6 font-duran text-5xl font-black leading-none text-white md:text-7xl">
              {title}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--text-secondary)] md:text-lg">
              {description}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {project.live_url ? (
                <Link
                  href={project.live_url}
                  target="_blank"
                  rel="noreferrer"
                  className="focus-ring inline-flex min-h-12 items-center gap-2 rounded-full border border-[var(--border-neon)] bg-[rgba(0,245,255,0.08)] px-5 text-sm font-semibold text-white hover:shadow-[0_0_20px_rgba(0,245,255,0.14)]"
                >
                  {isAr ? "فتح الموقع" : "Open Site"} <ArrowUpRight size={16} />
                </Link>
              ) : null}
              {project.github_url ? (
                <Link
                  href={project.github_url}
                  target="_blank"
                  rel="noreferrer"
                  className="focus-ring inline-flex min-h-12 items-center gap-2 rounded-full border border-[var(--border)] px-5 text-sm text-[var(--text-secondary)] hover:text-white"
                >
                  <Github size={16} /> GitHub
                </Link>
              ) : null}
            </div>
          </div>

          <GlassCard className="p-6">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-white/70">
              Tech Stack
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[var(--border)] bg-white/[0.03] px-3 py-1.5 font-mono text-xs text-[var(--text-secondary)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </GlassCard>
        </section>

        <section className="section-shell grid gap-5 py-6 md:grid-cols-3 md:py-10">
          {highlights.map((item) => (
            <GlassCard key={item.title} className="p-6">
              <item.icon className="size-8 text-white" />
              <h2 className="mt-5 text-xl font-semibold text-white">{item.title}</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{item.text}</p>
            </GlassCard>
          ))}
        </section>
      </main>
      <Footer locale={locale} settings={settings} />
    </>
  );
}
