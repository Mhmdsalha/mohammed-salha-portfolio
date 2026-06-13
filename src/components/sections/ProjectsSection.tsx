import { FeaturedProjectsCarousel } from "@/components/projects/FeaturedProjectsCarousel";
import { ProjectFilter } from "@/components/projects/ProjectFilter";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Locale, Project } from "@/types";

export function ProjectsSection({
  projects,
  locale
}: {
  projects: Project[];
  locale: Locale;
}) {
  const isAr = locale === "ar";
  const featuredProjects = projects.filter((project) => project.featured);
  const carouselProjects = featuredProjects.length > 0 ? featuredProjects : projects.slice(0, 1);
  const carouselIds = new Set(carouselProjects.map((project) => project.id));
  const rest = projects.filter((project) => !carouselIds.has(project.id));

  return (
    <section id="projects" className="section-shell py-18 md:py-24">
      <SectionLabel>{"// 02 - WORK"}</SectionLabel>
      <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <h2 className="font-duran text-4xl font-black text-white md:text-5xl">
          {isAr ? "المشاريع المميزة" : "Featured Projects"}
        </h2>
        <p className="max-w-md text-sm leading-6 text-[var(--text-secondary)]">
          {isAr
            ? "مشاريع مختارة تتحرك تلقائياً لعرض أفضل الأعمال، مع معاينة واضحة وصورة كاملة لكل مشروع."
            : "A rotating showcase of the strongest projects, with complete previews and direct links."}
        </p>
      </div>

      <div className="mx-auto max-w-[1080px]">
        <FeaturedProjectsCarousel projects={carouselProjects} locale={locale} />
      </div>

      {rest.length > 0 ? (
        <div className="mt-8">
          <ProjectFilter projects={rest} locale={locale} />
        </div>
      ) : null}
    </section>
  );
}
