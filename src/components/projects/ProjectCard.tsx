import Link from "next/link";
import { ArrowUpRight, Github } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { TagPill } from "@/components/ui/TagPill";
import { Project, Locale } from "@/types";
import { ProjectVisual } from "@/components/projects/ProjectVisual";

export function ProjectCard({ project, locale }: { project: Project; locale: Locale }) {
  const title = locale === "ar" ? project.title_ar : project.title_en;
  const description =
    locale === "ar"
      ? project.description_ar ?? project.description_en ?? ""
      : project.description_en ?? project.description_ar ?? "";

  return (
    <GlassCard as="article" className="group overflow-hidden">
      <ProjectVisual title={title} imageUrl={project.thumbnail_url ?? project.images[0]} />
      <div className="p-5">
        <TagPill active>{project.category}</TagPill>
        <h3 className="mt-4 flex items-center justify-between gap-3 font-duran text-2xl font-black text-white">
          {title}
          <ArrowUpRight className="size-5 text-[var(--neon)] transition group-hover:translate-x-1 group-hover:-translate-y-1" />
        </h3>
        <p className="mt-3 line-clamp-2 min-h-12 text-sm leading-6 text-[var(--text-secondary)]">
          {description}
        </p>
        <div className="my-5 h-px bg-white/10" />
        <div className="flex flex-wrap gap-2">
          {project.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="rounded-full bg-white/[0.04] px-2.5 py-1 font-mono text-[10px] text-[var(--text-muted)]">
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-5 flex items-center gap-4 text-sm">
          <Link
            href={`/${locale}/projects/${project.slug}`}
            className="focus-ring text-white hover:text-[var(--neon)]"
          >
            Details
          </Link>
          {project.live_url ? (
            <Link href={project.live_url} className="focus-ring text-white hover:text-[var(--neon)]">
              Live ↗
            </Link>
          ) : null}
          {project.github_url ? (
            <Link href={project.github_url} className="focus-ring inline-flex items-center gap-1 text-[var(--text-secondary)] hover:text-white">
              <Github size={14} />
              GitHub
            </Link>
          ) : null}
        </div>
      </div>
    </GlassCard>
  );
}
