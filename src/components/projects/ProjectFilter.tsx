"use client";

import { useMemo, useState } from "react";
import { Project, ProjectCategory, Locale } from "@/types";
import { ProjectCard } from "@/components/projects/ProjectCard";

type Filter = "all" | ProjectCategory;

const filterLabels: Record<Filter, { en: string; ar: string }> = {
  all: { en: "All", ar: "الكل" },
  salla: { en: "Salla Stores", ar: "متاجر سلة" },
  webapp: { en: "Web Apps", ar: "تطبيقات ويب" },
  pos: { en: "POS Systems", ar: "أنظمة نقاط بيع" },
  other: { en: "Other", ar: "أخرى" }
};

export function ProjectFilter({
  projects,
  locale
}: {
  projects: Project[];
  locale: Locale;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const filtered = useMemo(
    () => (filter === "all" ? projects : projects.filter((project) => project.category === filter)),
    [filter, projects]
  );

  return (
    <>
      <div className="mb-8 flex gap-3 overflow-x-auto pb-2">
        {(Object.keys(filterLabels) as Filter[]).slice(0, 4).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`focus-ring relative min-h-11 shrink-0 rounded-full border px-4 text-sm transition ${
              filter === item
                ? "border-[var(--border-neon)] bg-[var(--neon)] text-black"
                : "border-[var(--border)] text-[var(--text-secondary)] hover:text-white"
            }`}
          >
            {filterLabels[item][locale]}
          </button>
        ))}
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((project) => (
          <div key={project.id}>
            <ProjectCard project={project} locale={locale} />
          </div>
        ))}
      </div>
    </>
  );
}
