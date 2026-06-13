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

export async function getSiteSettings(): Promise<SiteSettings> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return getDefaultSiteSettings();
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage.from(bucketName).download(filePath);

    if (error || !data) {
      return getDefaultSiteSettings();
    }

    const text = await data.text();
    return mergeSettings(JSON.parse(text) as Partial<SiteSettings>);
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
