"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { text } from "@/lib/forms";
import { isUuid } from "@/lib/ids";
import { PHOTO_BUCKET } from "@/lib/photos";
import { createClient } from "@/lib/supabase/server";
import type { FormState, RatingCategory } from "@/lib/types";

/**
 * Create the current user's review for a rink, or update an existing review
 * (the author's own, or any review when called by an admin).
 */
export async function saveReview(formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please log in to write a review." };

  const rinkId = text(formData, "rink_id");
  const reviewId = text(formData, "review_id");
  const returnTo = text(formData, "return_to");
  const body = text(formData, "body", 5000);
  if (!isUuid(rinkId)) return { error: "Unknown rink." };
  if (!body) return { error: "Please write a few words about the rink." };

  const supabase = await createClient();
  const { data: categories } = await supabase.from("rating_categories").select("*");
  const ratings: { category_id: string; rating: number; other_label: string | null }[] = [];
  for (const c of (categories ?? []) as RatingCategory[]) {
    const value = Number(text(formData, `rating_${c.id}`));
    if (!(value >= 1 && value <= 5)) continue;
    const label = c.is_other ? text(formData, "other_label", 60) : "";
    if (c.is_other && !label) return { error: "Tell us what your “Other” rating is for, or clear that rating." };
    ratings.push({ category_id: c.id, rating: Math.round(value), other_label: c.is_other ? label : null });
  }

  let id = reviewId;
  if (reviewId) {
    if (!isUuid(reviewId)) return { error: "Unknown review." };
    const { data, error } = await supabase.from("reviews").update({ body }).eq("id", reviewId).select("id");
    if (error) return { error: error.message };
    if (!data?.length) return { error: "You can only edit your own review." };
  } else {
    const { data, error } = await supabase
      .from("reviews")
      .insert({ rink_id: rinkId, user_id: user.id, body })
      .select("id")
      .single();
    if (error) {
      return { error: error.code === "23505" ? "You've already reviewed this rink. Reload to edit it." : error.message };
    }
    id = data.id;
  }

  // Sync ratings: remove cleared ones (and their photos), upsert the rest.
  const keep = new Set(ratings.map((r) => r.category_id));
  const { data: existing } = await supabase.from("review_ratings").select("id, category_id").eq("review_id", id);
  const removed = (existing ?? []).filter((r) => !keep.has(r.category_id)).map((r) => r.id);
  if (removed.length) {
    const { data: orphanPhotos } = await supabase.from("photos").select("storage_path").in("review_rating_id", removed);
    const { error } = await supabase.from("review_ratings").delete().in("id", removed);
    if (error) return { error: error.message };
    if (orphanPhotos?.length) await supabase.storage.from(PHOTO_BUCKET).remove(orphanPhotos.map((p) => p.storage_path));
  }
  if (ratings.length) {
    const { error } = await supabase
      .from("review_ratings")
      .upsert(ratings.map((r) => ({ ...r, review_id: id })), { onConflict: "review_id,category_id" });
    if (error) return { error: error.message };
  }

  revalidatePath(`/rinks/${rinkId}`);
  redirect(returnTo.startsWith("/") ? returnTo : `/rinks/${rinkId}/review?saved=1`);
}

export async function deleteReview(reviewId: string, rinkId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Please log in.");
  const supabase = await createClient();
  const { data: ratings } = await supabase.from("review_ratings").select("id").eq("review_id", reviewId);
  const ratingIds = (ratings ?? []).map((r) => r.id);
  const { data: photos } = ratingIds.length
    ? await supabase.from("photos").select("storage_path").in("review_rating_id", ratingIds)
    : { data: [] };
  const { data, error } = await supabase.from("reviews").delete().eq("id", reviewId).select("id");
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error("You can only delete your own review.");
  if (photos?.length) await supabase.storage.from(PHOTO_BUCKET).remove(photos.map((p) => p.storage_path));
  revalidatePath(`/rinks/${rinkId}`);
  redirect(`/rinks/${rinkId}`);
}
