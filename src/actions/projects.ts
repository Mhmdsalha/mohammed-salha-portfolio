"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guard";
import { ImageRejected, toSafeWebp } from "@/lib/images/process";
import { MAX_UPLOAD_BYTES } from "@/lib/images/rules";
import { createAdminClient } from "@/lib/supabase/admin";
import { PROJECT_CATEGORIES } from "@/types";

const projectSchema = z.object({
  title_en: z.string().min(2),
  title_ar: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/),
  category: z.enum(PROJECT_CATEGORIES),
  description_en: z.string().optional(),
  description_ar: z.string().optional(),
  live_url: z.string().url().optional().or(z.literal("")),
  github_url: z.string().url().optional().or(z.literal("")),
  tags: z.array(z.string()).max(8),
  thumbnail_url: z.string().url().optional().or(z.literal("")),
  images: z.array(z.string().url()).default([]),
  featured: z.boolean(),
  order_num: z.coerce.number().int().min(0)
});

const storageBucket = "projects";

/**
 * After any project change: the public pages (home, project pages, sitemap) and skills, through
 * their cache tags (D1-4, D-029), plus the dashboard lists.
 */
function revalidateProjects() {
  revalidateTag(CACHE_TAGS.projects);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
}

async function ensureProjectsBucket() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage.listBuckets();

  if (error) {
    throw error;
  }

  const exists = data.some((bucket) => bucket.name === storageBucket);
  if (!exists) {
    // Only what toSafeWebp produces (D1-3). The existing production bucket keeps its settings;
    // L-1 reviews its policies.
    const { error: createError } = await supabase.storage.createBucket(storageBucket, {
      public: true,
      fileSizeLimit: MAX_UPLOAD_BYTES,
      allowedMimeTypes: ["image/webp"]
    });

    if (createError) {
      throw createError;
    }
  }
}

/**
 * Stores an already checked and re-encoded image under a random name (D1-3, D-030): the name
 * reveals nothing and cannot be guessed, and `upsert: false` means an upload can never replace
 * an existing file.
 */
async function storeWebp(webp: Buffer, slug: string, prefix: string) {
  const supabase = createAdminClient();
  const path = `projects/${slug}/${prefix}-${crypto.randomUUID()}.webp`;

  const { error } = await supabase.storage.from(storageBucket).upload(path, webp, {
    contentType: "image/webp",
    cacheControl: "31536000",
    upsert: false
  });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(storageBucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadProjectImages(formData: FormData) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const slug = String(formData.get("slug") ?? "");

  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return { success: false, message: "Save a valid slug before uploading images." };
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { success: false, message: "Missing Supabase credentials." };
  }

  const thumbnail = formData.get("thumbnail");
  const coverFile = thumbnail instanceof File && thumbnail.size > 0 ? thumbnail : null;
  const imageFiles = formData
    .getAll("images")
    .filter((value): value is File => value instanceof File && value.size > 0);

  // Check and convert every file before storing any, so one bad file uploads nothing.
  let cover: Buffer | null;
  let gallery: Buffer[];
  try {
    cover = coverFile ? await toSafeWebp(coverFile) : null;
    gallery = [];
    for (const file of imageFiles) gallery.push(await toSafeWebp(file));
  } catch (error) {
    if (error instanceof ImageRejected) return { success: false, message: error.message };
    throw error;
  }

  try {
    await ensureProjectsBucket();

    const thumbnailUrl = cover ? await storeWebp(cover, slug, "cover") : null;
    const imageUrls = await Promise.all(
      gallery.map((webp, index) => storeWebp(webp, slug, `gallery-${index + 1}`))
    );

    return {
      success: true,
      message: "Images uploaded.",
      thumbnailUrl,
      imageUrls
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Image upload failed."
    };
  }
}

export async function createProject(data: unknown) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const parsed = projectSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, message: "Please check the project fields." };
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      success: true,
      message: "Project validated locally. Add Supabase credentials to persist it."
    };
  }

  const supabase = createAdminClient();
  const payload = {
    ...parsed.data,
    description_ar: parsed.data.description_ar ?? null,
    description_en: parsed.data.description_en ?? null,
    live_url: parsed.data.live_url || null,
    github_url: parsed.data.github_url || null,
    thumbnail_url: parsed.data.thumbnail_url || null,
    images: parsed.data.images
  };

  const { error } = await supabase.from("projects").insert(payload);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidateProjects();
  return { success: true, message: "Project created." };
}

export async function updateProject(id: string, data: unknown) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const parsed = projectSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, message: "Please check the project fields." };
  }

  if (id.startsWith("mock-")) {
    return {
      success: true,
      message: "Mock project validated locally. Add a real Supabase project row to persist edits."
    };
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      success: true,
      message: "Project validated locally. Add Supabase credentials to persist it."
    };
  }

  const supabase = createAdminClient();
  const payload = {
    ...parsed.data,
    description_ar: parsed.data.description_ar ?? null,
    description_en: parsed.data.description_en ?? null,
    live_url: parsed.data.live_url || null,
    github_url: parsed.data.github_url || null,
    thumbnail_url: parsed.data.thumbnail_url || null,
    images: parsed.data.images
  };

  const { error } = await supabase.from("projects").update(payload).eq("id", id);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidateProjects();
  return { success: true, message: "Project updated." };
}

export async function deleteProject(id: string) {
  const denied = await requireAdmin();
  if (denied) return denied;

  if (id.startsWith("mock-")) {
    return {
      success: true,
      message: "Mock project ignored. Add real Supabase data to delete persisted rows."
    };
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      success: true,
      message: "Delete simulated locally. Add Supabase credentials to persist it."
    };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("projects").delete().eq("id", id);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidateProjects();
  return { success: true, message: "Project deleted." };
}
