// D1-3 (D-030): uploads are identified by their bytes, re-encoded to WebP, and anything else is
// rejected on the server. Real images are generated with sharp; hostile files are built by hand.
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { ImageRejected, MAX_IMAGE_SIDE, toSafeWebp } from "@/lib/images/process";
import { MAX_UPLOAD_BYTES, checkFilesBeforeUpload } from "@/lib/images/rules";
import { sniffImageFormat } from "@/lib/images/sniff";

const solid = (width: number, height: number) =>
  sharp({ create: { width, height, channels: 3, background: { r: 200, g: 48, b: 42 } } });

const fileOf = (bytes: Uint8Array | Buffer | string, name: string, type = "image/png") =>
  new File([typeof bytes === "string" ? bytes : new Uint8Array(bytes)], name, { type });

const SVG = '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><rect width="1"/></svg>';
// The "MZ" header of a Windows executable, padded.
const EXE = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, ...new Array(60).fill(0)]);

describe("sniffImageFormat", () => {
  it("recognises PNG, JPEG, WebP and AVIF by their bytes", async () => {
    expect(sniffImageFormat(await solid(4, 4).png().toBuffer())).toBe("png");
    expect(sniffImageFormat(await solid(4, 4).jpeg().toBuffer())).toBe("jpeg");
    expect(sniffImageFormat(await solid(4, 4).webp().toBuffer())).toBe("webp");
    expect(sniffImageFormat(await solid(4, 4).avif().toBuffer())).toBe("avif");
  });

  it("rejects SVG, executables, GIF, HTML and empty input", async () => {
    expect(sniffImageFormat(new TextEncoder().encode(SVG))).toBeNull();
    expect(sniffImageFormat(EXE)).toBeNull();
    expect(sniffImageFormat(await solid(4, 4).gif().toBuffer())).toBeNull();
    expect(sniffImageFormat(new TextEncoder().encode("<!doctype html><html>"))).toBeNull();
    expect(sniffImageFormat(new Uint8Array())).toBeNull();
  });

  it("does not take an MP4 (another ftyp file) for AVIF", () => {
    const mp4 = new Uint8Array(32);
    mp4.set([0, 0, 0, 24], 0);
    mp4.set(new TextEncoder().encode("ftypisom\0\0\0\0isomiso2"), 4);
    expect(sniffImageFormat(mp4)).toBeNull();
  });
});

describe("toSafeWebp", () => {
  it("re-encodes an accepted image to WebP", async () => {
    const webp = await toSafeWebp(fileOf(await solid(64, 48).png().toBuffer(), "cover.png"));
    expect(sniffImageFormat(webp)).toBe("webp");
    expect(await sharp(webp).metadata()).toMatchObject({ format: "webp", width: 64, height: 48 });
  });

  it("drops metadata such as EXIF (camera, GPS)", async () => {
    const withExif = await solid(32, 32)
      .jpeg()
      .withMetadata({ exif: { IFD0: { Copyright: "secret", Artist: "someone" } } })
      .toBuffer();
    expect((await sharp(withExif).metadata()).exif).toBeDefined();
    const webp = await toSafeWebp(fileOf(withExif, "photo.jpg", "image/jpeg"));
    expect((await sharp(webp).metadata()).exif).toBeUndefined();
  });

  it(`scales large images down to ${MAX_IMAGE_SIDE}px on the long side, never up`, async () => {
    const big = await toSafeWebp(fileOf(await solid(3000, 1000).png().toBuffer(), "wide.png"));
    expect(await sharp(big).metadata()).toMatchObject({ width: MAX_IMAGE_SIDE, height: 800 });
  });

  it("rejects an SVG, even named .png and declared as image/png", async () => {
    await expect(toSafeWebp(fileOf(SVG, "logo.png"))).rejects.toBeInstanceOf(ImageRejected);
  });

  it("rejects a renamed executable", async () => {
    await expect(toSafeWebp(fileOf(EXE, "photo.jpg", "image/jpeg"))).rejects.toThrow(
      /not a PNG, JPEG, WebP or AVIF/
    );
  });

  it("rejects a file with an image header but no image behind it", async () => {
    const fake = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4]);
    await expect(toSafeWebp(fileOf(fake, "broken.png"))).rejects.toThrow(/could not be read/);
  });

  it("rejects a file over 5 MB before reading it as an image", async () => {
    const huge = new Uint8Array(MAX_UPLOAD_BYTES + 1);
    huge.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    await expect(toSafeWebp(fileOf(huge, "huge.png"))).rejects.toThrow(/larger than 5 MB/);
  });
});

describe("checkFilesBeforeUpload (the form's early check)", () => {
  const file = (name: string, size: number, type = "image/png") => ({ name, size, type });

  it("accepts small images of the four formats", () => {
    expect(
      checkFilesBeforeUpload([
        file("a.png", 1000),
        file("b.jpg", 1000, "image/jpeg"),
        file("c.webp", 1000, "image/webp"),
        file("d.avif", 1000, "image/avif")
      ])
    ).toBeNull();
  });

  it("names the problem: too big, wrong type, or too much at once (R10)", () => {
    expect(checkFilesBeforeUpload([file("a.png", MAX_UPLOAD_BYTES + 1)])).toMatch(
      /a\.png .* limit/
    );
    expect(checkFilesBeforeUpload([file("a.svg", 10, "image/svg+xml")])).toMatch(/not a PNG/);
    expect(checkFilesBeforeUpload([file("a.png", 4_000_000), file("b.png", 4_000_000)])).toMatch(
      /at a time/
    );
  });
});
