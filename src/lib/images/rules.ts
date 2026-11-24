// Upload rules shared by the dashboard form (an early, friendly check) and the server, which
// enforces them (D1-3, D-030). Safe to import in the browser: no Node APIs here.

/** Largest accepted image file. */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/**
 * Largest single upload request. Server actions accept 8 MB (next.config.ts), and multipart
 * encoding adds a little, so the form stops below it and asks for fewer files at once (R10).
 */
export const MAX_REQUEST_BYTES = 7.5 * 1024 * 1024;

export const ACCEPTED_IMAGE_FORMATS = ["png", "jpeg", "webp", "avif"] as const;
export type ImageFormat = (typeof ACCEPTED_IMAGE_FORMATS)[number];

/** For the file picker's `accept` attribute. The server never trusts the declared type. */
export const ACCEPTED_IMAGE_MIME = "image/png,image/jpeg,image/webp,image/avif";

const MB = (bytes: number) => `${Math.round((bytes / 1024 / 1024) * 10) / 10} MB`;

/** The first problem with a set of files about to be uploaded together, or null. */
export function checkFilesBeforeUpload(files: Array<Pick<File, "name" | "size" | "type">>) {
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
