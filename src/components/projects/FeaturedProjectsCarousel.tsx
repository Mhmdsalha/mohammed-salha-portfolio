"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, Github } from "lucide-react";
import { Locale, Project } from "@/types";

const intervalMs = 5200;
type SlideDirection = "next" | "prev";

function projectText(project: Project, locale: Locale) {
  return {
    title: locale === "ar" ? project.title_ar : project.title_en,
    description:
      locale === "ar"
        ? project.description_ar ?? project.description_en ?? ""
        : project.description_en ?? project.description_ar ?? ""
  };
}

export function FeaturedProjectsCarousel({
  projects,
  locale
}: {
  projects: Project[];
  locale: Locale;
}) {
  const [active, setActive] = useState(0);
  const [slideDirection, setSlideDirection] = useState<SlideDirection>("next");
  const isAr = locale === "ar";
  const safeProjects = useMemo(() => projects.filter(Boolean), [projects]);
  const project = safeProjects[active] ?? safeProjects[0];

  useEffect(() => {
    if (safeProjects.length < 2) {
      return;
    }

    const timer = window.setInterval(() => {
      setSlideDirection("next");
      setActive((current) => (current + 1) % safeProjects.length);
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [safeProjects.length]);

  if (!project) {
    return null;
  }

  const { title, description } = projectText(project, locale);
  const imageUrl = project.thumbnail_url ?? project.images[0];
  const slideClass =
    slideDirection === "next" ? "featured-project-slide-next" : "featured-project-slide-prev";

  const goTo = (direction: "next" | "prev") => {
    setSlideDirection(direction);
    setActive((current) => {
      if (direction === "next") {
        return (current + 1) % safeProjects.length;
      }

      return (current - 1 + safeProjects.length) % safeProjects.length;
    });
  };

  const selectProject = (index: number) => {
    if (index === active) {
      return;
    }

    setSlideDirection(index > active ? "next" : "prev");
    setActive(index);
  };

  return (
    <div className="relative overflow-hidden rounded-[22px] border border-white/10 bg-[#050505] shadow-[0_22px_70px_rgba(0,0,0,0.42)]">
      <div key={project.id} className={`featured-project-slide ${slideClass}`}>
        <div className="featured-project-media relative border-b border-white/10 bg-black">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={`${title} preview`}
              className="block max-h-[330px] w-full object-contain"
              loading="lazy"
            />
          ) : (
            <div className="aspect-[16/6] bg-[radial-gradient(circle_at_20%_20%,rgba(0,245,255,0.2),transparent_28%),linear-gradient(135deg,#071113,#0a0a0a_55%,#111)]" />
          )}
          <div className="absolute left-4 top-4 rounded-full border border-[var(--border-neon)] bg-black/70 px-3 py-1.5 font-mono text-[11px] font-semibold text-white backdrop-blur-md">
            <span className="mr-2 inline-block size-2 rounded-full bg-[var(--neon)] shadow-[0_0_12px_rgba(0,245,255,0.85)]" />
            {isAr ? "مشروع مميز" : "Featured Project"}
          </div>
        </div>

        <div className="featured-project-content grid gap-5 p-5 md:p-6 lg:grid-cols-[0.62fr_0.38fr] lg:items-end">
          <div className="featured-project-copy">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
              {project.category}
            </p>
            <h3 className="mt-3 font-duran text-3xl font-black leading-tight text-white md:text-4xl">
              {title}
            </h3>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-secondary)] md:text-base">
              {description}
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
          </div>

          <div className="flex flex-col gap-4 lg:items-end">
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link
                href={`/${locale}/projects/${project.slug}`}
                className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--border)] px-4 text-sm text-[var(--text-secondary)] hover:text-white"
              >
                {isAr ? "تفاصيل المشروع" : "Project Details"}
              </Link>
              {project.live_url ? (
                <Link
                  href={project.live_url}
                  target="_blank"
                  rel="noreferrer"
                  className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--border-neon)] px-4 text-sm font-semibold text-white hover:shadow-[0_0_24px_rgba(0,245,255,0.18)]"
                >
                  {isAr ? "معاينة مباشرة" : "Live Preview"} <ArrowUpRight size={16} />
                </Link>
              ) : null}
              {project.github_url ? (
                <Link
                  href={project.github_url}
                  target="_blank"
                  rel="noreferrer"
                  className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--border)] px-4 text-sm text-[var(--text-secondary)] hover:text-white"
                >
                  <Github size={16} /> GitHub
                </Link>
              ) : null}
            </div>

            {safeProjects.length > 1 ? (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => goTo("prev")}
                  className="focus-ring flex size-9 items-center justify-center rounded-full border border-white/10 text-white/70 hover:text-white"
                  aria-label={isAr ? "المشروع السابق" : "Previous project"}
                >
                  {isAr ? <ArrowRight size={15} /> : <ArrowLeft size={15} />}
                </button>
                <div className="flex items-center gap-2">
                  {safeProjects.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectProject(index)}
                      className={`h-2 rounded-full transition-all ${
                        index === active
                          ? "w-8 bg-[var(--neon)] shadow-[0_0_16px_rgba(0,245,255,0.55)]"
                          : "w-2 bg-white/20 hover:bg-white/45"
                      }`}
                      aria-label={`${isAr ? "عرض المشروع" : "Show project"} ${index + 1}`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => goTo("next")}
                  className="focus-ring flex size-9 items-center justify-center rounded-full border border-white/10 text-white/70 hover:text-white"
                  aria-label={isAr ? "المشروع التالي" : "Next project"}
                >
                  {isAr ? <ArrowLeft size={15} /> : <ArrowRight size={15} />}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
