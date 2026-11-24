import { unstable_cache } from "next/cache";
import { CACHE_REVALIDATE_SECONDS, CACHE_TAGS } from "@/lib/cache-tags";
import { mockDataAllowed } from "@/lib/mock-data";
import { createAdminClient } from "@/lib/supabase/admin";
import { SiteSettings } from "@/types";

const bucketName = "site-settings";
const filePath = "settings.json";

export function getDefaultSiteSettings(): SiteSettings {
  return {
    whatsapp: "",
    phone: "",
    email: "",
    github: "",
    linkedin: "",
    twitter: "",
    khamsat: "",
    mostaql: ""
  };
}

function mergeSettings(value: Partial<SiteSettings> | null | undefined): SiteSettings {
  return {
    ...getDefaultSiteSettings(),
    ...(value ?? {})
  };
}

// Cached under the "settings" tag; updateSiteSettings revalidates it (D1-4, D-029).
//  * No settings file yet (Storage 404): the defaults, which is the real state, so it is cached.
//  * Any other failure throws. It is never cached, and a page being regenerated keeps its last
//    good version instead of being cached for an hour without contact links (A7 review).
const readSiteSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage.from(bucketName).download(filePath);
    if (error) {
      if (isNotFound(error)) return getDefaultSiteSettings();
      throw new Error("Could not load the site settings from Supabase Storage.", { cause: error });
    }
    return mergeSettings(JSON.parse(await data.text()) as Partial<SiteSettings>);
  },
  ["data", "site-settings"],
  { tags: [CACHE_TAGS.settings], revalidate: CACHE_REVALIDATE_SECONDS }
);

/** Storage answers a missing file or bucket with HTTP 400 and `statusCode: "404"`. */
function isNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    String((error as { statusCode: unknown }).statusCode) === "404"
  );
}

export async function getSiteSettings(): Promise<SiteSettings> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    if (mockDataAllowed()) return getDefaultSiteSettings();
    throw new Error("The Supabase admin environment variables are not set.");
  }
  return readSiteSettings();
}

export async function saveSiteSettings(settings: SiteSettings) {
  const supabase = createAdminClient();
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    throw listError;
  }

  const exists = buckets.some((bucket) => bucket.name === bucketName);
  if (!exists) {
    const { error: createError } = await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 1024 * 20,
      allowedMimeTypes: ["application/json"]
    });

    if (createError) {
      throw createError;
    }
  }

  const body = JSON.stringify(settings, null, 2);
  const { error } = await supabase.storage.from(bucketName).upload(filePath, body, {
    contentType: "application/json",
    upsert: true
  });

  if (error) {
    throw error;
  }
}
