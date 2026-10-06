"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { text } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/lib/types";

export async function suggest(formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please log in to make suggestions." };
  const kind = text(formData, "kind");
  const name = text(formData, "name", 60);
  if (!name) return { error: "Enter a name." };
  const table = kind === "place_category" ? "place_categories" : kind === "amenity" ? "amenities" : null;
  if (!table) return { error: "Choose what you're suggesting." };

  const supabase = await createClient();
  const { error } = await supabase.from(table).insert({ name });
  if (error) {
    return { error: error.code === "23505" ? `“${name}” already exists or was already suggested.` : error.message };
  }
  revalidatePath("/suggest");
  return { message: `Thanks! “${name}” will appear once an admin approves it.` };
}
