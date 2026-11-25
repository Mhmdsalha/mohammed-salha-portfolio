import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";

// Storage clean-up when a project is deleted (D1-5, D-031). Uploads live in the `projects`
// bucket under `projects/{slug}/` (D-030). A deleted project's files are:
//  * everything in its slug folder (including uploads the project no longer references, such as
//    an older cover, and files left by a failed save);
//  * any of its referenced images stored elsewhere in the bucket (e.g. under an old slug after a
//    rename).
// A file another project still references is never removed.

export const PROJECTS_BUCKET = "projects";

type AdminClient = ReturnType<typeof createAdminClient>;
type ImageRefs = { thumbnail_url: string | null; images: string[] };

/** The bucket path of a public URL that points into the projects bucket, or null. */
export function storagePathFromUrl(url: string | null, supabaseUrl: string): string | null {
  if (!url) return null;
  const prefix = `${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/${PROJECTS_BUCKET}/`;
  if (!url.startsWith(prefix)) return null;
  const path = decodeURIComponent(url.slice(prefix.length).split(/[?#]/)[0] ?? "");
  return path && !path.split("/").includes("..") ? path : null;
}

const referencedPaths = (project: ImageRefs, supabaseUrl: string) =>
  [project.thumbnail_url, ...project.images]
    .map((url) => storagePathFromUrl(url, supabaseUrl))
    .filter((path): path is string => path !== null);

/** Which bucket paths to remove for a deleted project. Pure, so it is unit-tested directly. */
export function filesToRemove(input: {
  deleted: ImageRefs & { slug: string };
  others: ImageRefs[];
  folderFiles: string[];
  supabaseUrl: string;
}): string[] {
  const { deleted, others, folderFiles, supabaseUrl } = input;
  const keep = new Set(others.flatMap((project) => referencedPaths(project, supabaseUrl)));
  const candidates = [
    ...folderFiles.map((name) => `projects/${deleted.slug}/${name}`),
    ...referencedPaths(deleted, supabaseUrl)
  ];
  return [...new Set(candidates)].filter((path) => !keep.has(path));
}

/**
 * Removes a deleted project's files. Returns how many were removed, or throws if Storage could
 * not be listed or cleaned (the caller logs it; the row is already gone).
 */
export async function removeProjectFiles(
  client: AdminClient,
  deleted: ImageRefs & { slug: string },
  supabaseUrl: string
): Promise<number> {
  const { data: others, error: othersError } = await client
    .from("projects")
    .select("thumbnail_url,images");
  if (othersError) throw othersError;

  const storage = client.storage.from(PROJECTS_BUCKET);
  const { data: listing, error: listError } = await storage.list(`projects/${deleted.slug}`, {
    limit: 1000
  });
  if (listError) throw listError;

  const paths = filesToRemove({
    deleted,
    others,
    // Folders come back without an id; uploads are flat, so only files are removed.
    folderFiles: listing.filter((entry) => entry.id !== null).map((entry) => entry.name),
    supabaseUrl
  });
  if (paths.length === 0) return 0;

  const { error: removeError } = await storage.remove(paths);
  if (removeError) throw removeError;
  return paths.length;
}
