"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { optionalText, readAddress, text } from "@/lib/forms";
import { isUuid } from "@/lib/ids";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/lib/types";

/** Add a place to a rink (no id) or edit one (id). */
export async function savePlace(formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please log in to submit changes." };

  const id = text(formData, "id");
  const rinkId = text(formData, "rink_id");
  const values = {
    name: text(formData, "name", 150),
    category_id: text(formData, "category_id"),
    ...readAddress(formData),
    description: optionalText(formData, "description", 5000),
  };
  if (!values.name) return { error: "Name is required." };
  if (!isUuid(values.category_id)) return { error: "Pick a category." };
  if (!values.street || !values.city) return { error: "Street and city are required." };

  const supabase = await createClient();
  let placeId = id;
  if (id) {
    if (!isUuid(id)) return { error: "Unknown place." };
    const { data, error } = await supabase.from("places").update(values).eq("id", id).select("id, rink_id");
    if (error) return { error: error.message };
    if (!data?.length) return { error: "This place can't be edited right now." };
    revalidatePath(`/rinks/${data[0].rink_id}`);
  } else {
    if (!isUuid(rinkId)) return { error: "Unknown rink." };
    const { data, error } = await supabase
      .from("places")
      .insert({ ...values, rink_id: rinkId })
      .select("id")
      .single();
    if (error) return { error: error.message };
    placeId = data.id;
    revalidatePath(`/rinks/${rinkId}`);
  }
  redirect(`/places/${placeId}`);
}

/** Create or update the current user's single comment on a place. */
export async function saveComment(formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please log in to comment." };
  const placeId = text(formData, "place_id");
  const commentId = text(formData, "comment_id");
  const body = text(formData, "body", 3000);
  if (!isUuid(placeId)) return { error: "Unknown place." };
  if (!body) return { error: "Comment can't be empty." };

  const supabase = await createClient();
  if (commentId) {
    const { data, error } = await supabase.from("place_comments").update({ body }).eq("id", commentId).select("id");
    if (error) return { error: error.message };
    if (!data?.length) return { error: "You can only edit your own comment." };
  } else {
    const { error } = await supabase.from("place_comments").insert({ place_id: placeId, user_id: user.id, body });
    if (error) return { error: error.code === "23505" ? "You've already commented here. Edit your comment instead." : error.message };
  }
  revalidatePath(`/places/${placeId}`);
  return { message: "Comment saved." };
}

export async function deleteComment(commentId: string, placeId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Please log in.");
  const supabase = await createClient();
  const { data, error } = await supabase.from("place_comments").delete().eq("id", commentId).select("id");
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error("You can only delete your own comment.");
  revalidatePath(`/places/${placeId}`);
}
