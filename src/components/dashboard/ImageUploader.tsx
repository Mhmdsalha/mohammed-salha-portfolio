"use client";

import Image from "next/image";
import { ImagePlus, X } from "lucide-react";

type ImageUploaderProps = {
  thumbnailUrl: string;
  galleryUrls: string[];
  thumbnailFile: File | null;
  galleryFiles: File[];
  onThumbnailChange: (file: File | null) => void;
  onGalleryChange: (files: File[]) => void;
  onRemoveGalleryUrl: (url: string) => void;
};

function previewFor(file: File | null, fallback: string) {
  if (!file) {
    return fallback;
  }

  return URL.createObjectURL(file);
}

export function ImageUploader({
  thumbnailUrl,
  galleryUrls,
  thumbnailFile,
  galleryFiles,
  onThumbnailChange,
  onGalleryChange,
  onRemoveGalleryUrl
}: ImageUploaderProps) {
  const thumbnailPreview = previewFor(thumbnailFile, thumbnailUrl);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-[var(--text-secondary)]">Thumbnail / Cover</p>
        <label className="mt-2 block cursor-pointer rounded-2xl border border-dashed border-[var(--border-neon)] bg-[rgba(0,245,255,0.04)] p-4 transition hover:bg-[rgba(0,245,255,0.07)]">
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => onThumbnailChange(event.target.files?.[0] ?? null)}
          />
          {thumbnailPreview ? (
            <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-[var(--border)] bg-black">
              <Image
                src={thumbnailPreview}
                alt="Project thumbnail preview"
                fill
                unoptimized={thumbnailPreview.startsWith("blob:")}
                className="object-cover object-top"
              />
            </div>
          ) : (
            <div className="flex min-h-44 flex-col items-center justify-center text-center">
              <ImagePlus className="size-8 text-[var(--neon)]" />
              <p className="mt-3 text-sm font-semibold text-white">Click to choose a cover image</p>
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                Uploaded to Supabase Storage bucket: projects
              </p>
            </div>
          )}
        </label>
        {thumbnailPreview ? (
          <button
            type="button"
            onClick={() => onThumbnailChange(null)}
            className="mt-3 text-xs text-[var(--text-muted)] hover:text-white"
          >
            Clear selected cover
          </button>
        ) : null}
      </div>

      <div>
        <p className="text-sm text-[var(--text-secondary)]">Gallery Images</p>
        <label className="mt-2 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-white/[0.025] p-4 text-center transition hover:border-[var(--border-neon)]">
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(event) => onGalleryChange(Array.from(event.target.files ?? []))}
          />
          <ImagePlus className="size-7 text-[var(--neon)]" />
          <p className="mt-2 text-sm text-white">Choose gallery images</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">You can select multiple files.</p>
        </label>

        {galleryUrls.length > 0 || galleryFiles.length > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {galleryUrls.map((url) => (
              <div key={url} className="relative aspect-[4/3] overflow-hidden rounded-xl border border-[var(--border)] bg-black">
                <Image src={url} alt="Saved gallery image" fill className="object-cover object-top" />
                <button
                  type="button"
                  onClick={() => onRemoveGalleryUrl(url)}
                  className="absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-full bg-black/70 text-white"
                  aria-label="Remove saved image"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            {galleryFiles.map((file) => {
              const url = URL.createObjectURL(file);
              return (
                <div key={`${file.name}-${file.size}`} className="relative aspect-[4/3] overflow-hidden rounded-xl border border-[var(--border)] bg-black">
                  <Image
                    src={url}
                    alt={file.name}
                    fill
                    unoptimized
                    className="object-cover object-top"
                  />
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
