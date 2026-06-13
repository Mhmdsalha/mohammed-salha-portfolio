"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { createProject, updateProject, uploadProjectImages } from "@/actions/projects";
import { GlassCard } from "@/components/ui/GlassCard";
import { ImageUploader } from "@/components/dashboard/ImageUploader";
import { Project, ProjectFormValues } from "@/types";

const schema = z.object({
  title_en: z.string().min(2, "English title is required."),
  title_ar: z.string().min(2, "Arabic title is required."),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens."),
  category: z.enum(["salla", "webapp", "pos", "other"]),
  description_en: z.string(),
  description_ar: z.string(),
  live_url: z.string().url("Enter a valid URL.").or(z.literal("")),
  github_url: z.string().url("Enter a valid URL.").or(z.literal("")),
  tags: z.array(z.string()).max(8),
  thumbnail_url: z.string().url().or(z.literal("")),
  images: z.array(z.string().url()),
  featured: z.boolean(),
  order_num: z.coerce.number().int().min(0)
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function projectToDefaults(project?: Project): ProjectFormValues {
  return {
    title_en: project?.title_en ?? "",
    title_ar: project?.title_ar ?? "",
    slug: project?.slug ?? "",
    category: project?.category ?? "salla",
    description_en: project?.description_en ?? "",
    description_ar: project?.description_ar ?? "",
    live_url: project?.live_url ?? "",
    github_url: project?.github_url ?? "",
    tags: project?.tags ?? [],
    thumbnail_url: project?.thumbnail_url ?? "",
    images: project?.images ?? [],
    featured: project?.featured ?? false,
    order_num: project?.order_num ?? 0
  };
}

export function ProjectForm({ project }: { project?: Project }) {
  const router = useRouter();
  const [tagValue, setTagValue] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [isPending, startTransition] = useTransition();
  const defaults = useMemo(() => projectToDefaults(project), [project]);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults
  });
  const tags = watch("tags");
  const thumbnailUrl = watch("thumbnail_url");
  const galleryUrls = watch("images");

  const onTitleBlur = () => {
    const slug = watch("slug");
    if (!slug) {
      setValue("slug", slugify(watch("title_en")));
    }
  };

  const addTag = () => {
    const next = tagValue.trim();
    if (!next || tags.includes(next) || tags.length >= 8) {
      setTagValue("");
      return;
    }
    setValue("tags", [...tags, next], { shouldValidate: true });
    setTagValue("");
  };

  const removeTag = (tag: string) => {
    setValue(
      "tags",
      tags.filter((item) => item !== tag),
      { shouldValidate: true }
    );
  };

  const onSubmit = (values: ProjectFormValues) => {
    startTransition(async () => {
      let payload = values;

      if (thumbnailFile || galleryFiles.length > 0) {
        const formData = new FormData();
        formData.append("slug", values.slug);

        if (thumbnailFile) {
          formData.append("thumbnail", thumbnailFile);
        }

        galleryFiles.forEach((file) => {
          formData.append("images", file);
        });

        const uploadResult = await uploadProjectImages(formData);

        if (!uploadResult.success) {
          toast.error(uploadResult.message);
          return;
        }

        payload = {
          ...values,
          thumbnail_url: uploadResult.thumbnailUrl ?? values.thumbnail_url,
          images: [...values.images, ...(uploadResult.imageUrls ?? [])]
        };
      }

      const result = project ? await updateProject(project.id, payload) : await createProject(payload);
      if (result.success) {
        toast.success(result.message);
        router.push("/dashboard/projects");
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <GlassCard className="p-6">
        <h2 className="text-xl font-semibold text-white">Basic Info</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Title EN" error={errors.title_en?.message}>
            <input {...register("title_en")} onBlur={onTitleBlur} className="field" />
          </Field>
          <Field label="Title AR" error={errors.title_ar?.message}>
            <input {...register("title_ar")} className="field font-arabic" dir="rtl" />
          </Field>
          <Field label="Slug" error={errors.slug?.message}>
            <input {...register("slug")} className="field font-mono" />
          </Field>
          <Field label="Category" error={errors.category?.message}>
            <select {...register("category")} className="field">
              <option value="salla">Salla</option>
              <option value="webapp">Web App</option>
              <option value="pos">POS</option>
              <option value="other">Other</option>
            </select>
          </Field>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="text-xl font-semibold text-white">Description</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Description EN" error={errors.description_en?.message}>
            <textarea {...register("description_en")} rows={4} className="field resize-none" />
          </Field>
          <Field label="Description AR" error={errors.description_ar?.message}>
            <textarea {...register("description_ar")} rows={4} className="field resize-none font-arabic" dir="rtl" />
          </Field>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="text-xl font-semibold text-white">Images</h2>
        <div className="mt-5">
          <ImageUploader
            thumbnailUrl={thumbnailUrl}
            galleryUrls={galleryUrls}
            thumbnailFile={thumbnailFile}
            galleryFiles={galleryFiles}
            onThumbnailChange={setThumbnailFile}
            onGalleryChange={setGalleryFiles}
            onRemoveGalleryUrl={(url) =>
              setValue(
                "images",
                galleryUrls.filter((item) => item !== url),
                { shouldValidate: true }
              )
            }
          />
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="text-xl font-semibold text-white">Links and Tags</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Live URL" error={errors.live_url?.message}>
            <input {...register("live_url")} className="field" />
          </Field>
          <Field label="GitHub URL" error={errors.github_url?.message}>
            <input {...register("github_url")} className="field" />
          </Field>
        </div>
        <div className="mt-5">
          <label className="text-sm text-[var(--text-secondary)]">Tags</label>
          <div className="mt-2 flex gap-2">
            <input
              value={tagValue}
              onChange={(event) => setTagValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === ",") {
                  event.preventDefault();
                  addTag();
                }
              }}
              className="field"
              placeholder="Type and press Enter"
            />
            <button type="button" onClick={addTag} className="focus-ring rounded-full border border-[var(--border)] px-4 text-sm text-white">
              Add
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => removeTag(tag)}
                className="rounded-full border border-[var(--border)] bg-white/[0.03] px-3 py-1 text-xs text-[var(--text-secondary)]"
              >
                {tag} ×
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="text-xl font-semibold text-white">Settings</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="flex min-h-12 items-center justify-between rounded-2xl border border-[var(--border)] px-4 text-sm text-[var(--text-secondary)]">
            Featured
            <input type="checkbox" {...register("featured")} className="size-5 accent-cyan-300" />
          </label>
          <Field label="Order" error={errors.order_num?.message}>
            <input type="number" {...register("order_num", { valueAsNumber: true })} className="field" />
          </Field>
        </div>
      </GlassCard>

      <button
        type="submit"
        disabled={isPending}
        className="focus-ring min-h-12 rounded-full border border-[var(--border-neon)] bg-[rgba(0,245,255,0.1)] px-7 font-semibold text-white hover:shadow-[0_0_28px_rgba(0,245,255,0.18)] disabled:cursor-wait disabled:opacity-60"
      >
        {isPending ? "Saving..." : project ? "Update Project" : "Create Project"}
      </button>
    </form>
  );
}

function Field({
  label,
  error,
  children
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <div className="mt-2">{children}</div>
      {error ? <span className="mt-2 block text-xs text-[var(--danger)]">{error}</span> : null}
    </label>
  );
}
