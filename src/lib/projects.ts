import { mockProjects } from "@/data/mock-projects";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { CACHE_REVALIDATE_SECONDS, CACHE_TAGS, type CacheTag } from "@/lib/cache-tags";
import { hasSupabaseEnv } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";
import {
  PROJECT_CATEGORIES,
  PROJECT_LABELS,
  SKILL_CATEGORIES,
  type Project,
  type Skill
} from "@/types";
import type { Tables } from "@/types/database";

// Public data API (D1-2, D-028). Reads go through the anon key, so the database's row-level
// security decides what is public: published projects with a GitHub repository (D-004).
//  * A database error throws (DataError). It never falls back to mock data: an outage shows the
//    error page instead of fake projects.
//  * Mock data is used only when no Supabase env is set at all (local development, CI builds),
//    and never in a Vercel deployment.
//  * Every database read is cached with a tag (D1-4, D-008, D-029): pages are served from the
//    cache, and each dashboard change revalidates its tag, so the next request shows the edit.
//    The anon client sends no cookies, which a cached function must not read (R18). A thrown
//    error is never cached.

export class DataError extends Error {
  constructor(what: string, cause?: unknown) {
    super(`Could not load ${what} from Supabase.`, { cause });
    this.name = "DataError";
  }
}

/** Every column the public pages use; `*` would also return columns added later. */
// One string literal (not concatenated), so supabase-js can infer the row type from it.
export const PROJECT_COLUMNS =
  "id,slug,title_ar,title_en,description_ar,description_en,category,label,tags,thumbnail_url,images,live_url,github_url,featured,featured_order,order_num,highlights_ar,highlights_en,published,created_at,updated_at";

function isOneOf<T extends string>(values: readonly T[], value: unknown): value is T {
  return values.includes(value as T);
}

/** Narrows a row to Project; the check constraints guarantee this, so a mismatch is a bug. */
export function asProject(row: Tables<"projects">): Project {
  const { category, label } = row;
  if (
    !isOneOf(PROJECT_CATEGORIES, category) ||
    !(label === null || isOneOf(PROJECT_LABELS, label))
  ) {
    throw new DataError(`project "${row.slug}"`, new Error(`unexpected category/label`));
  }
  return { ...row, category, label };
}

function withoutDatabase<T>(what: string, fallback: () => T): T {
  if (process.env.VERCEL) {
    throw new DataError(what, new Error("The Supabase environment variables are not set."));
  }
  return fallback();
}

const isPublic = (project: Project) => project.published && project.github_url !== null;

/** Caches a database read under the given tags (see src/lib/cache-tags.ts). */
function cachedRead<A extends unknown[], R>(
  key: string,
  tags: CacheTag[],
  read: (...args: A) => Promise<R>
): (...args: A) => Promise<R> {
  // The arguments are part of the cache key, next to `key`.
  return unstable_cache(read, ["data", key], { tags, revalidate: CACHE_REVALIDATE_SECONDS });
}

const readProjects = cachedRead("projects", [CACHE_TAGS.projects], async () => {
  const supabase = await createPublicClient();
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_COLUMNS)
    .order("order_num", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new DataError("projects", error);
  return data.map(asProject);
});

const readFeatured = cachedRead("featured", [CACHE_TAGS.projects], async () => {
  const supabase = await createPublicClient();
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_COLUMNS)
    .eq("featured", true)
    .order("featured_order", { ascending: true, nullsFirst: false })
    .order("order_num", { ascending: true });

  if (error) throw new DataError("featured projects", error);
  return data.map(asProject);
});

// null, not undefined, for "no such project": the cache stores JSON.
const readProjectBySlug = cachedRead(
  "project-by-slug",
  [CACHE_TAGS.projects],
  async (slug: string): Promise<Project | null> => {
    const supabase = await createPublicClient();
    const { data, error } = await supabase
      .from("projects")
      .select(PROJECT_COLUMNS)
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw new DataError("the project", error);
    return data ? asProject(data) : null;
  }
);

// Skills embed their projects, so a project change revalidates them too.
const readSkills = cachedRead("skills", [CACHE_TAGS.skills, CACHE_TAGS.projects], async () => {
  const supabase = await createPublicClient();
  const { data, error } = await supabase
    .from("skills")
    .select("id,name,abbr,category,order_num,project_skills(projects(slug))")
    .order("category", { ascending: true })
    .order("order_num", { ascending: true });

  if (error) throw new DataError("skills", error);
  return data.map(({ project_skills, category, ...skill }): Skill => {
    if (!isOneOf(SKILL_CATEGORIES, category)) {
      throw new DataError(`skill "${skill.name}"`, new Error("unexpected category"));
    }
    return {
      ...skill,
      category,
      // Links to hidden projects come back without a project (row-level security).
      projectSlugs: project_skills.flatMap((link) => (link.projects ? [link.projects.slug] : []))
    };
  });
});

/** Public projects in archive order. */
export async function getProjects(): Promise<Project[]> {
  if (!hasSupabaseEnv()) return withoutDatabase("projects", () => mockProjects.filter(isPublic));
  return readProjects();
}

/** Public featured projects in carousel order (`featured_order`, then archive order). */
export async function getFeatured(): Promise<Project[]> {
  if (!hasSupabaseEnv()) {
    return withoutDatabase("featured projects", () =>
      mockProjects.filter((project) => isPublic(project) && project.featured)
    );
  }
  return readFeatured();
}

/**
 * One public project, or undefined when no public project has this slug. Also wrapped in React's
 * cache(), so a page and its generateMetadata share one lookup per request.
 */
export const getProjectBySlug = cache(async (slug: string): Promise<Project | undefined> => {
  if (!hasSupabaseEnv()) {
    return withoutDatabase("the project", () =>
      mockProjects.find((project) => isPublic(project) && project.slug === slug)
    );
  }
  return (await readProjectBySlug(slug)) ?? undefined;
});

/** Skills in tab order, each with the slugs of the public projects that use it. */
export async function getSkills(): Promise<Skill[]> {
  if (!hasSupabaseEnv()) return withoutDatabase("skills", () => []);
  return readSkills();
}

export function getFeaturedProject(projects: Project[]) {
  return projects.find((project) => project.featured) ?? projects[0];
}

export function getProjectTitle(project: Project, locale: "ar" | "en") {
  return locale === "ar" ? project.title_ar : project.title_en;
}

export function getProjectDescription(project: Project, locale: "ar" | "en") {
  return locale === "ar"
    ? (project.description_ar ?? project.description_en ?? "")
    : (project.description_en ?? project.description_ar ?? "");
}
