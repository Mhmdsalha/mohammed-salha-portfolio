import "server-only";
import { mockProjects } from "@/data/mock-projects";
import { requireAdminPage } from "@/lib/auth/guard";
import { DataError, PROJECT_COLUMNS, asProject } from "@/lib/projects";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Project } from "@/types";

// Dashboard reads (D1-2, D-028). The dashboard must see every project, including hidden ones
// (unpublished, or no GitHub link yet, like Lamsa and Lolo), which the anon key cannot read. So
// these use the service-role client, and each one checks the admin session first, even though
// the page already did (defence in depth). Errors throw; mock data only without Supabase env,
// never in production.

function hasAdminEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function withoutDatabase<T>(what: string, fallback: () => T): T {
  if (process.env.VERCEL_ENV === "production") {
    throw new DataError(what, new Error("The Supabase admin environment variables are not set."));
  }
  return fallback();
}

/** Every project, hidden ones included, in archive order. */
export async function getAllProjectsForAdmin(): Promise<Project[]> {
  await requireAdminPage();
  if (!hasAdminEnv()) return withoutDatabase("projects", () => mockProjects);

  const { data, error } = await createAdminClient()
    .from("projects")
    .select(PROJECT_COLUMNS)
    .order("order_num", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new DataError("projects", error);
  return data.map(asProject);
}

/** One project by id, hidden or not. */
export async function getProjectForAdmin(id: string): Promise<Project | undefined> {
  await requireAdminPage();
  if (!hasAdminEnv()) {
    return withoutDatabase("the project", () => mockProjects.find((project) => project.id === id));
  }

  // Postgres rejects a malformed uuid with an error; a bad id in the URL is a 404, not a failure.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return undefined;

  const { data, error } = await createAdminClient()
    .from("projects")
    .select(PROJECT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new DataError("the project", error);
  return data ? asProject(data) : undefined;
}
