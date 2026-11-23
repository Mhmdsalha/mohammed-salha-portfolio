import type { MetadataRoute } from "next";
import { unstable_rethrow } from "next/navigation";
import { LOCALES } from "@/lib/i18n/locales";
import { getProjects } from "@/lib/projects";
import { absoluteUrl, languageAlternates, localePath } from "@/lib/seo";

// /sitemap.xml (P3-3, D-027): every public page in both languages, each with its hreflang
// alternates. The preview, dashboard and dev pages are left out (noindex). Only public projects
// (row-level security, D-004); if the database fails, only the home pages are listed.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await getProjects().catch((error: unknown) => {
    // Next's own signals (such as "render this per request") must pass through, not be logged.
    unstable_rethrow(error);
    console.error("sitemap.xml: listing only the home pages, projects failed to load", error);
    return [];
  });
  const absolute = (alternates: Record<string, string>) =>
    Object.fromEntries(Object.entries(alternates).map(([key, path]) => [key, absoluteUrl(path)]));

  const latest = projects.reduce<string | undefined>(
    (max, project) => (!max || project.updated_at > max ? project.updated_at : max),
    undefined
  );

  const pages: Array<{ path: string; lastModified?: string; priority: number }> = [
    { path: "/", lastModified: latest, priority: 1 },
    ...projects.map((project) => ({
      path: `/projects/${project.slug}`,
      lastModified: project.updated_at,
      priority: 0.7
    }))
  ];

  return pages.flatMap(({ path, lastModified, priority }) =>
    LOCALES.map((locale) => ({
      url: absoluteUrl(localePath(locale, path)),
      ...(lastModified ? { lastModified } : {}),
      changeFrequency: "monthly" as const,
      priority,
      alternates: { languages: absolute(languageAlternates(path)) }
    }))
  );
}
