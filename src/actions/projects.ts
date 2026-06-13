"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hasDashboardSession } from "@/lib/dashboard-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const projectSchema = z.object({
  title_en: z.string().min(2),
  title_ar: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  category: z.enum(["salla", "webapp", "pos", "other"]),
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

async function ensureProjectsBucket() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage.listBuckets();

  if (error) {
    throw error;
  }

  const exists = data.some((bucket) => bucket.name === storageBucket);
  if (!exists) {
    const { error: createError } = await supabase.storage.createBucket(storageBucket, {
      public: true,
      fileSizeLimit: 1024 * 1024 * 6,
      allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"]
    });

    if (createError) {
      throw createError;
    }
  }
}

function getFileExtension(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) {
    return fromName;
  }

  return file.type.split("/").pop() ?? "bin";
}

async function uploadImageFile(file: File, slug: string, prefix: string) {
  if (!file.type.startsWith("image/")) {
    throw new Error(`${file.name} is not an image.`);
  }

  const supabase = createAdminClient();
  const extension = getFileExtension(file);
  const bytes = await file.arrayBuffer();
  const path = `projects/${slug}/${prefix}-${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from(storageBucket).upload(path, bytes, {
    contentType: file.type || "application/octet-stream",
    upsert: true
  });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(storageBucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadProjectImages(formData: FormData) {
  if (!(await hasDashboardSession())) {
    return { success: false, message: "Unauthorized." };
  }

  const slug = String(formData.get("slug") ?? "");

  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return { success: false, message: "Save a valid slug before uploading images." };
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { success: false, message: "Missing Supabase credentials." };
  }

  try {
    await ensureProjectsBucket();

    const thumbnail = formData.get("thumbnail");
    const imageFiles = formData.getAll("images").filter((value): value is File => value instanceof File && value.size > 0);
    const thumbnailUrl =
      thumbnail instanceof File && thumbnail.size > 0
        ? await uploadImageFile(thumbnail, slug, "cover")
        : null;
    const imageUrls = await Promise.all(
      imageFiles.map((file, index) => uploadImageFile(file, slug, `gallery-${index + 1}`))
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
  if (!(await hasDashboardSession())) {
    return { success: false, message: "Unauthorized." };
  }

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

  revalidatePath("/");
  revalidatePath("/dashboard/projects");
  return { success: true, message: "Project created." };
}

export async function updateProject(id: string, data: unknown) {
  if (!(await hasDashboardSession())) {
    return { success: false, message: "Unauthorized." };
  }

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

  revalidatePath("/");
  revalidatePath("/dashboard/projects");
  return { success: true, message: "Project updated." };
}

export async function deleteProject(id: string) {
  if (!(await hasDashboardSession())) {
    return { success: false, message: "Unauthorized." };
  }

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

  revalidatePath("/");
  revalidatePath("/dashboard/projects");
  return { success: true, message: "Project deleted." };
}
