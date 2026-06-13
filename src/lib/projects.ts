import { mockProjects } from "@/data/mock-projects";
import { hasSupabaseEnv } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Project } from "@/types";

export async function getProjects(options: { fallbackToMock?: boolean } = {}): Promise<Project[]> {
  const fallbackToMock = options.fallbackToMock ?? true;

  if (!hasSupabaseEnv()) {
    return fallbackToMock ? mockProjects : [];
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("order_num", { ascending: true });

    if (error || !data || data.length === 0) {
      return fallbackToMock ? mockProjects : [];
    }

    return data as Project[];
  } catch {
    return fallbackToMock ? mockProjects : [];
  }
}

export function getFeaturedProject(projects: Project[]) {
  return projects.find((project) => project.featured) ?? projects[0];
}

export function getProjectTitle(project: Project, locale: "ar" | "en") {
  return locale === "ar" ? project.title_ar : project.title_en;
}

export function getProjectDescription(project: Project, locale: "ar" | "en") {
  return locale === "ar"
    ? project.description_ar ?? project.description_en ?? ""
    : project.description_en ?? project.description_ar ?? "";
}

export async function getProjectBySlug(slug: string) {
  const projects = await getProjects();
  return projects.find((project) => project.slug === slug);
}
