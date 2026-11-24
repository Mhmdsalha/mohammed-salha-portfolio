import type { ImageFormat } from "@/lib/images/rules";

// Identifies an image by its first bytes ("magic numbers"), never by its name or declared type
// (D1-3, D-030). An SVG (text), an HTML page or an executable renamed to .png is rejected here.

const ascii = (bytes: Uint8Array, start: number, end: number) =>
  String.fromCharCode(...bytes.subarray(start, end));

const startsWith = (bytes: Uint8Array, signature: number[]) =>
  bytes.length >= signature.length && signature.every((byte, index) => bytes[index] === byte);

/** The accepted format the bytes are, or null. */
export function sniffImageFormat(bytes: Uint8Array): ImageFormat | null {
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "jpeg";
  if (bytes.length >= 12 && ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP") {
    return "webp";
  }
  // ISO-BMFF: a box size, then "ftyp", the major brand and a list of compatible brands.
  if (bytes.length >= 16 && ascii(bytes, 4, 8) === "ftyp") {
    const boxSize = new DataView(bytes.buffer, bytes.byteOffset, 4).getUint32(0);
    const end = Math.min(boxSize, bytes.length);
    for (let offset = 8; offset + 4 <= end; offset += 4) {
      if (offset === 12) continue; // minor version, not a brand
      const brand = ascii(bytes, offset, offset + 4);
      if (brand === "avif" || brand === "avis") return "avif";
    }
  }
  return null;
}
