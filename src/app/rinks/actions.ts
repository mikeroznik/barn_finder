"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ids, optionalNumber, optionalText, readAddress, text } from "@/lib/forms";
import { isUuid } from "@/lib/ids";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/lib/types";

/** Add a rink (no id) or edit one (id). Any verified user may do either. */
export async function saveRink(formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please log in to submit changes." };

  const id = text(formData, "id");
  const sheets = optionalNumber(formData, "sheet_count");
  const values = {
    name: text(formData, "name", 150),
    ...readAddress(formData),
    sheet_count: sheets == null ? null : Math.max(0, Math.min(50, Math.round(sheets))),
    seating_type_ids: ids(formData, "seating"),
    seating_notes: optionalText(formData, "seating_notes"),
    parking_type_ids: ids(formData, "parking"),
    parking_notes: optionalText(formData, "parking_notes"),
    amenity_ids: ids(formData, "amenities"),
  };
  if (!values.name) return { error: "Rink name is required." };
  if (!values.street || !values.city) return { error: "Street and city are required." };

  const supabase = await createClient();
  let rinkId = id;
  if (id) {
    if (!isUuid(id)) return { error: "Unknown rink." };
    const { data, error } = await supabase.from("rinks").update(values).eq("id", id).select("id");
    if (error) return { error: error.message };
    if (!data?.length) return { error: "This rink can't be edited right now." };
  } else {
    const { data, error } = await supabase.from("rinks").insert(values).select("id").single();
    if (error) return { error: error.message };
    rinkId = data.id;
  }

  revalidatePath("/");
  revalidatePath(`/rinks/${rinkId}`);
  redirect(`/rinks/${rinkId}`);
}
