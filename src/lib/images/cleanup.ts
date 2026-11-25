import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";

// Storage clean-up when a project is deleted (D1-5, D-031). Uploads live in the `projects`
// bucket under `projects/{slug}/` (D-030). A deleted project's files are:
//  * everything in its slug folder (including uploads the project no longer references, such as
//    an older cover, and files left by a failed save);
//  * any of its referenced images stored elsewhere in the bucket (e.g. under an old slug after a
//    rename).
// A file another project still references is never removed.
//
// Asymmetry on purpose (A7 review): deciding what to KEEP is broad (any host, public, signed or
// transformed URLs, odd slashes, undecodable escapes), because keeping too much is harmless.
// Deciding what to DELETE from a URL is strict (this project's own public URL form only, clean
// paths only), because deleting the wrong file is not.

export const PROJECTS_BUCKET = "projects";

/** Supabase caps both a Storage listing and a PostgREST select at 1000 rows per request. */
const PAGE_SIZE = 1000;

type AdminClient = ReturnType<typeof createAdminClient>;
type ImageRefs = { thumbnail_url: string | null; images: string[] };

const isCleanPath = (path: string) => {
  const segments = path.split("/");
  return (
    segments.length >= 3 &&
    segments[0] === PROJECTS_BUCKET &&
    segments.every((segment) => segment !== "" && segment !== "." && segment !== "..")
  );
};

function safeDecode(path: string): string | null {
  try {
    return decodeURIComponent(path);
  } catch {
    return null;
  }
}

/**
 * The bucket path of a public URL of this project's Supabase (`{supabaseUrl}/storage/v1/object/
 * public/projects/…`), or null. Strict: used to decide what to delete.
 */
export function storagePathFromUrl(url: string | null, supabaseUrl: string): string | null {
  if (!url) return null;
  const prefix = `${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/${PROJECTS_BUCKET}/`;
  if (url.slice(0, prefix.length).toLowerCase() !== prefix.toLowerCase()) return null;
  const raw = url.slice(prefix.length).split(/[?#]/)[0] ?? "";
  const path = safeDecode(raw);
  return path !== null && isCleanPath(path) ? path : null;
}

const KEEP_PATTERN =
  /\/storage\/v1\/(?:object|render\/image)\/(?:public|sign|authenticated)\/projects\/([^?#]+)/i;

/**
 * Every bucket path a URL might refer to, from any host and in any Supabase URL form. Broad:
 * used to decide what to keep.
 */
export function keptPathsFromUrl(url: string | null): string[] {
  const raw = url?.match(KEEP_PATTERN)?.[1];
  if (!raw) return [];
  const collapse = (path: string) => path.replace(/\/{2,}/g, "/").replace(/\/$/, "");
  const decoded = safeDecode(raw);
  return [...new Set([collapse(raw), ...(decoded === null ? [] : [collapse(decoded)])])];
}

const urlsOf = (project: ImageRefs) => [project.thumbnail_url, ...project.images];

/** Which bucket paths to remove for a deleted project. Pure, so it is unit-tested directly. */
export function filesToRemove(input: {
  deleted: ImageRefs & { slug: string };
  others: ImageRefs[];
  folderFiles: string[];
  supabaseUrl: string;
}): string[] {
  const { deleted, others, folderFiles, supabaseUrl } = input;
  const keep = new Set(others.flatMap(urlsOf).flatMap(keptPathsFromUrl));
  const candidates = [
    ...folderFiles.map((name) => `${PROJECTS_BUCKET}/${deleted.slug}/${name}`),
    ...urlsOf(deleted).map((url) => storagePathFromUrl(url, supabaseUrl))
  ].filter((path): path is string => path !== null && isCleanPath(path));
  return [...new Set(candidates)].filter((path) => !keep.has(path));
}

/** Every other project's image references, page by page, so the keep list is complete. */
async function readAllReferences(client: AdminClient): Promise<ImageRefs[]> {
  const rows: ImageRefs[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await client
      .from("projects")
      .select("thumbnail_url,images")
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < PAGE_SIZE) return rows;
  }
}

/** Every file name directly in a folder, page by page. Sub-folders (no id) are skipped. */
async function listFolder(client: AdminClient, folder: string): Promise<string[]> {
  const names: string[] = [];
  const storage = client.storage.from(PROJECTS_BUCKET);
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await storage.list(folder, { limit: PAGE_SIZE, offset });
    if (error) throw error;
    names.push(...data.filter((entry) => entry.id !== null).map((entry) => entry.name));
    if (data.length < PAGE_SIZE) return names;
  }
}

/**
 * Removes a deleted project's files. Call it after the row is deleted, so the other projects'
 * references no longer include it. Returns how many files were removed, or throws if Storage
 * could not be listed or cleaned (the caller logs it; the row is already gone).
 */
export async function removeProjectFiles(
  client: AdminClient,
  deleted: ImageRefs & { slug: string },
  supabaseUrl: string
): Promise<number> {
  const others = await readAllReferences(client);
  const folderFiles = await listFolder(client, `${PROJECTS_BUCKET}/${deleted.slug}`);
  const paths = filesToRemove({ deleted, others, folderFiles, supabaseUrl });
  if (paths.length === 0) return 0;

  const { error } = await client.storage.from(PROJECTS_BUCKET).remove(paths);
  if (error) throw error;
  return paths.length;
}
