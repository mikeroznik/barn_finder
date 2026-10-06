"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { PHOTO_BUCKET } from "@/lib/photos";
import { createClient } from "@/lib/supabase/server";

export interface PhotoTarget {
  rinkId?: string;
  reviewRatingId?: string;
  placeId?: string;
}

/** Records a photo the browser has already uploaded to storage. */
export async function addPhoto(storagePath: string, target: PhotoTarget, caption: string, path: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Please log in to add photos." };
  if (!storagePath.startsWith(`${user.id}/`)) return { error: "Invalid upload." };

  const supabase = await createClient();
  const { error } = await supabase.from("photos").insert({
    storage_path: storagePath,
    uploaded_by: user.id,
    rink_id: target.rinkId ?? null,
    review_rating_id: target.reviewRatingId ?? null,
    place_id: target.placeId ?? null,
    caption: caption.trim().slice(0, 200) || null,
  });
  if (error) {
    await supabase.storage.from(PHOTO_BUCKET).remove([storagePath]);
    return {
      error: error.code === "23505" ? "You've already added a photo here. Delete it first to replace it." : error.message,
    };
  }
  revalidatePath(path);
  return {};
}

/** Owner or admin removes a photo and its file. */
export async function deletePhoto(photoId: string, path: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Please log in.");
  const supabase = await createClient();
  const { data: photo } = await supabase.from("photos").select("storage_path, uploaded_by").eq("id", photoId).single();
  if (!photo) throw new Error("Photo not found.");
  if (photo.uploaded_by !== user.id && !user.isAdmin) throw new Error("You can only delete your own photos.");

  const { error } = await supabase.from("photos").delete().eq("id", photoId);
  if (error) throw new Error(error.message);
  await supabase.storage.from(PHOTO_BUCKET).remove([photo.storage_path]);
  revalidatePath(path);
}
