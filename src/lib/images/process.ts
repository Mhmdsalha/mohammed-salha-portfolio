import "server-only";
import sharp from "sharp";
import { MAX_UPLOAD_BYTES } from "@/lib/images/rules";
import { sniffImageFormat } from "@/lib/images/sniff";

// Server-side image intake (D1-3, D-030). Every upload is checked and then re-encoded:
//  1. size: at most MAX_UPLOAD_BYTES;
//  2. type: PNG, JPEG, WebP or AVIF by magic bytes (the name and declared type are ignored);
//  3. decode and re-encode to WebP with sharp. Only a real, decodable image survives; metadata
//     (EXIF, GPS, XMP) is dropped after the orientation is applied;
//     huge images are scaled down; a decompression bomb hits the pixel limit.

/** Longest side kept, in pixels; larger images are scaled down (never up). */
export const MAX_IMAGE_SIDE = 2400;

/** Rejects decompression bombs before they are decoded (about 50 megapixels). */
const MAX_INPUT_PIXELS = 50_000_000;

export class ImageRejected extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageRejected";
  }
}

/** Checks one uploaded file and returns it as WebP bytes, or throws ImageRejected. */
export async function toSafeWebp(file: File): Promise<Buffer> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new ImageRejected(`${file.name} is larger than 5 MB.`);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.byteLength > MAX_UPLOAD_BYTES) {
    throw new ImageRejected(`${file.name} is larger than 5 MB.`);
  }
  if (!sniffImageFormat(bytes)) {
    throw new ImageRejected(`${file.name} is not a PNG, JPEG, WebP or AVIF image.`);
  }

  try {
    return await sharp(bytes, { limitInputPixels: MAX_INPUT_PIXELS, failOn: "error" })
      .rotate()
      .resize({
        width: MAX_IMAGE_SIDE,
        height: MAX_IMAGE_SIDE,
        fit: "inside",
        withoutEnlargement: true
      })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new ImageRejected(`${file.name} could not be read as an image.`);
  }
}
