import type { ImageFormat } from "@/lib/images/rules";

// Identifies an image by its first bytes ("magic numbers"), never by its name or declared type
// (D1-3, D-030). An SVG (text), an HTML page or an executable renamed to .png is rejected here.
// This is the first gate only: process.ts also checks what sharp actually decoded, because sharp
// picks its decoder from the content, not from this result (A7 review: an SVG starting with
// "<!--ftypavif-->" passed the first version of the AVIF check).

const ascii = (bytes: Uint8Array, start: number, end: number) =>
  String.fromCharCode(...bytes.subarray(start, end));

const startsWith = (bytes: Uint8Array, signature: number[]) =>
  bytes.length >= signature.length && signature.every((byte, index) => bytes[index] === byte);

const AVIF_BRANDS = new Set(["avif", "avis"]);

/**
 * AVIF is an ISO-BMFF file: it starts with an `ftyp` box (4-byte size, "ftyp", major brand,
 * minor version, compatible brands). The box size must be sane, and the **major** brand must be
 * avif/avis: libvips derives the codec it reports from the major brand, so this keeps both gates
 * in agreement (a file with another major brand that only lists avif is refused here, with the
 * right message, instead of passing here and failing in decodedAs; A7 re-review). Text that
 * merely contains "ftypavif" is not taken for AVIF.
 */
function isAvif(bytes: Uint8Array): boolean {
  if (bytes.length < 16 || ascii(bytes, 4, 8) !== "ftyp") return false;
  const boxSize = new DataView(bytes.buffer, bytes.byteOffset, 4).getUint32(0);
  if (boxSize < 16 || boxSize > bytes.length || boxSize > 256 || boxSize % 4 !== 0) return false;
  return AVIF_BRANDS.has(ascii(bytes, 8, 12));
}

/** The accepted format the bytes are, or null. */
export function sniffImageFormat(bytes: Uint8Array): ImageFormat | null {
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "jpeg";
  if (bytes.length >= 12 && ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP") {
    return "webp";
  }
  if (isAvif(bytes)) return "avif";
  return null;
}
