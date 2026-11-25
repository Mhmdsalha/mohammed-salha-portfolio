// Upload rules shared by the dashboard form (an early, friendly check) and the server, which
// enforces them (D1-3, D-030). Safe to import in the browser: no Node APIs here.

/**
 * Largest single upload request. Vercel rejects function request bodies over 4.5 MB before the
 * app runs (A7 review), and next.config.ts limits server actions to 4 MB to match, so the form
 * stops at 4 MB and asks for fewer files at once (R10).
 */
export const MAX_REQUEST_BYTES = 4_000_000;

/** Largest accepted image file: it must fit in one request (the plan's 5 MB cannot, D-030). */
export const MAX_UPLOAD_BYTES = MAX_REQUEST_BYTES;

/** Most files in one upload: decoding is CPU-heavy, and functions have a time limit. */
export const MAX_FILES_PER_UPLOAD = 12;

export const ACCEPTED_IMAGE_FORMATS = ["png", "jpeg", "webp", "avif"] as const;
export type ImageFormat = (typeof ACCEPTED_IMAGE_FORMATS)[number];

/** For the file picker's `accept` attribute. The server never trusts the declared type. */
export const ACCEPTED_IMAGE_MIME = "image/png,image/jpeg,image/webp,image/avif";

const MB = (bytes: number) => `${Math.round(bytes / 100_000) / 10} MB`;

/** The first problem with a set of files about to be uploaded together, or null. */
export function checkFilesBeforeUpload(files: Array<Pick<File, "name" | "size" | "type">>) {
  if (files.length > MAX_FILES_PER_UPLOAD) {
    return `Upload at most ${MAX_FILES_PER_UPLOAD} images at a time.`;
  }
  for (const file of files) {
    if (file.size > MAX_UPLOAD_BYTES) {
      return `${file.name} is ${MB(file.size)}; the limit is ${MB(MAX_UPLOAD_BYTES)} per image.`;
    }
    if (!ACCEPTED_IMAGE_MIME.split(",").includes(file.type)) {
      return `${file.name} is not a PNG, JPEG, WebP or AVIF image.`;
    }
  }
  const total = files.reduce((sum, file) => sum + file.size, 0);
  if (total > MAX_REQUEST_BYTES) {
    return `These images add up to ${MB(total)}; upload at most ${MB(MAX_REQUEST_BYTES)} at a time.`;
  }
  return null;
}
