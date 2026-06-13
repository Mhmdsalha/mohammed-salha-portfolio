export async function convertToWebp(file: File, quality = 0.85): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not prepare image canvas.");
  }

  context.drawImage(bitmap, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Could not convert image to WebP."));
        }
      },
      "image/webp",
      quality
    );
  });
}

export async function uploadProjectImage(
  blob: Blob,
  slug: string,
  filename: string
): Promise<string> {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const path = `projects/${slug}/${filename}.webp`;

  const { error } = await supabase.storage
    .from("projects")
    .upload(path, blob, { contentType: "image/webp", upsert: true });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from("projects").getPublicUrl(path);
  return data.publicUrl;
}
