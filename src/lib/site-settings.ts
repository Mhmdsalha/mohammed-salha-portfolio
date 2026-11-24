import { unstable_cache } from "next/cache";
import { CACHE_REVALIDATE_SECONDS, CACHE_TAGS } from "@/lib/cache-tags";
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

// Cached under the "settings" tag; updateSiteSettings revalidates it (D1-4, D-029). A failed read
// throws inside the cache, so it is never cached; the caller falls back to the defaults for that
// request only (D5-5 turns this into an error).
const readSiteSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage.from(bucketName).download(filePath);
    if (error || !data) throw error ?? new Error("settings.json is empty");
    return mergeSettings(JSON.parse(await data.text()) as Partial<SiteSettings>);
  },
  ["data", "site-settings"],
  { tags: [CACHE_TAGS.settings], revalidate: CACHE_REVALIDATE_SECONDS }
);

export async function getSiteSettings(): Promise<SiteSettings> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return getDefaultSiteSettings();
  }

  try {
    return await readSiteSettings();
  } catch {
    return getDefaultSiteSettings();
  }
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
