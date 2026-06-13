import Link from "next/link";
import { ArrowUpRight, Github } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { TagPill } from "@/components/ui/TagPill";
import { Project, Locale } from "@/types";
import { ProjectVisual } from "@/components/projects/ProjectVisual";

export function ProjectCardFeatured({
  project,
  locale,
  label
}: {
  project: Project;
  locale: Locale;
  label: string;
}) {
  const title = locale === "ar" ? project.title_ar : project.title_en;
  const description =
    locale === "ar"
      ? project.description_ar ?? project.description_en ?? ""
      : project.description_en ?? project.description_ar ?? "";

  return (
    <GlassCard
      as="article"
      className="grid overflow-hidden lg:grid-cols-[0.42fr_0.58fr] lg:items-start"
    >
      <div className="order-2 p-6 md:p-8 lg:order-1">
        <TagPill active>{label}</TagPill>
        <p className="mt-6 font-mono text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
          {project.category}
        </p>
        <h3 className="mt-4 font-duran text-4xl font-black text-white md:text-5xl">{title}</h3>
        <p className="mt-5 max-w-xl text-base leading-8 text-[var(--text-secondary)]">
          {description}
        </p>
        <div className="mt-7 flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-[var(--border)] bg-white/[0.03] px-3 py-1.5 font-mono text-xs text-[var(--text-secondary)]">
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/${locale}/projects/${project.slug}`}
            className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--border)] px-5 text-sm text-[var(--text-secondary)] hover:text-white"
          >
            Project Details
          </Link>
          {project.live_url ? (
            <Link
              href={project.live_url}
              className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--border-neon)] px-5 text-sm font-semibold text-white hover:shadow-[0_0_24px_rgba(0,245,255,0.18)]"
            >
              Live Preview <ArrowUpRight size={16} />
            </Link>
          ) : null}
          {project.github_url ? (
            <Link
              href={project.github_url}
              className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--border)] px-5 text-sm text-[var(--text-secondary)] hover:text-white"
            >
              <Github size={16} /> GitHub
            </Link>
          ) : null}
        </div>
      </div>
      <div className="order-1 lg:order-2">
        <ProjectVisual title={title} imageUrl={project.thumbnail_url ?? project.images[0]} featured />
      </div>
    </GlassCard>
  );
}
