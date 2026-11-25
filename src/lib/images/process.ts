import "server-only";
import sharp from "sharp";
import { MAX_UPLOAD_BYTES, type ImageFormat } from "@/lib/images/rules";
import { sniffImageFormat } from "@/lib/images/sniff";

// Server-side image intake (D1-3, D-030). Every upload is checked and then re-encoded:
//  1. size: at most MAX_UPLOAD_BYTES;
//  2. type: PNG, JPEG, WebP or AVIF by magic bytes (the name and declared type are ignored);
//  3. what sharp actually decodes must be that same format: sharp picks its decoder from the
//     content, so a file that only looks like an image (an SVG polyglot) never reaches librsvg;
//  4. decode and re-encode to WebP. Only a real, decodable image survives; metadata (EXIF, GPS,
//     XMP, ICC) is dropped after the orientation is applied; huge images are scaled down; a
//     decompression bomb hits the pixel limit. `failOn: "error"` also rejects damaged files,
//     including a JPEG missing only its end marker, which browsers would still show.

/** Longest side kept, in pixels; larger images are scaled down (never up). */
export const MAX_IMAGE_SIDE = 2400;

/** Rejects decompression bombs before they are decoded (about 50 megapixels). */
const MAX_INPUT_PIXELS = 50_000_000;

/**
 * Whether sharp decoded the sniffed format: AVIF is HEIF with AV1 compression, so a HEIC photo
 * (HEVC) or another container that only claims an AVIF brand is refused.
 */
export function decodedAs(format: ImageFormat, metadata: sharp.Metadata): boolean {
  if (format === "avif") return metadata.format === "heif" && metadata.compression === "av1";
  return metadata.format === format;
}

export class ImageRejected extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageRejected";
  }
}

/** Checks one uploaded file and returns it as WebP bytes, or throws ImageRejected. */
export async function toSafeWebp(file: File): Promise<Buffer> {
  const tooLarge = `${file.name} is larger than ${MAX_UPLOAD_BYTES / 1_000_000} MB.`;
  if (file.size > MAX_UPLOAD_BYTES) throw new ImageRejected(tooLarge);

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.byteLength > MAX_UPLOAD_BYTES) throw new ImageRejected(tooLarge);

  const notAnImage = `${file.name} is not a PNG, JPEG, WebP or AVIF image.`;
  const format = sniffImageFormat(bytes);
  if (!format) throw new ImageRejected(notAnImage);

  const options = { limitInputPixels: MAX_INPUT_PIXELS, failOn: "error" } as const;
  let metadata: sharp.Metadata;
  try {
    metadata = await sharp(bytes, options).metadata();
  } catch {
    throw new ImageRejected(`${file.name} could not be read as an image.`);
  }
  if (!decodedAs(format, metadata)) throw new ImageRejected(notAnImage);

  try {
    return await sharp(bytes, options)
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
