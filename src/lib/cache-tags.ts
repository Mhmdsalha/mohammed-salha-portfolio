// Cache tags for public data (D1-4, D-008, D-029). Every public read is cached under one of these
// tags, and every dashboard change revalidates the tags it affects, so /ar, /en and the project
// pages show an edit on the next request (R7).
export const CACHE_TAGS = {
  projects: "projects",
  skills: "skills",
  settings: "settings"
} as const;

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];

/**
 * Safety net only: cached data is refreshed at least this often, for changes made outside the
 * dashboard (for example in the Supabase SQL editor). Dashboard edits revalidate at once.
 */
export const CACHE_REVALIDATE_SECONDS = 3600;
