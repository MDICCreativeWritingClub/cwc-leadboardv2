import { staffSupabase as supabase } from "@/lib/staffSupabase";

const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.82;

/**
 * Resizes an image file down to MAX_DIMENSION on its longest side and
 * re-encodes it as JPEG, entirely in the browser. This is what actually
 * keeps uploaded images fast-loading: instead of uploading whatever the
 * camera/phone produced (often several MB at 4000px+), we ship a
 * right-sized file from the start.
 */
async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);

  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported in this browser");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Image compression failed"))),
      "image/jpeg",
      JPEG_QUALITY
    );
  });
}

/**
 * Compresses and uploads an image to the given Storage bucket, returning
 * its public URL. Requires the uploading user to be authenticated with an
 * allowed staff_role() (see the storage policies in cwc_db_migration.sql).
 */
export async function uploadImage(file: File, bucket: string): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file (JPG, PNG, WebP, etc.)");
  }

  const compressed = await compressImage(file);

  const fileName = `${crypto.randomUUID()}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(fileName, compressed, {
      contentType: "image/jpeg",
      cacheControl: "31536000", // 1 year — filenames are unique, so this is always safe
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return data.publicUrl;
}

export const uploadNoticeImage = (file: File) => uploadImage(file, "notice-images");

