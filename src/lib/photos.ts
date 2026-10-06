import { SUPABASE_URL } from "./supabase/env";

export const PHOTO_BUCKET = "photos";

export function photoUrl(storagePath: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${PHOTO_BUCKET}/${storagePath
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.82;

/** Shrinks an image in the browser so the longest edge is at most 1600px, as JPEG. */
export async function resizeImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser could not process this image.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not compress image."))), "image/jpeg", JPEG_QUALITY),
  );
}
