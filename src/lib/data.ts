import { createClient } from "./supabase/server";
import type { FixedListItem, RatingCategory, SuggestableItem } from "./types";

export interface Lists {
  seating: FixedListItem[];
  parking: FixedListItem[];
  amenities: SuggestableItem[];
  ratingCategories: RatingCategory[];
  placeCategories: SuggestableItem[];
}

/** All admin-managed option lists. Suggestion lists include only approved items. */
export async function getLists(): Promise<Lists> {
  const supabase = await createClient();
  const [seating, parking, amenities, ratingCategories, placeCategories] = await Promise.all([
    supabase.from("seating_types").select("*").order("sort_order").order("name"),
    supabase.from("parking_types").select("*").order("sort_order").order("name"),
    supabase.from("amenities").select("*").eq("status", "approved").order("sort_order").order("name"),
    supabase.from("rating_categories").select("*").order("sort_order").order("name"),
    supabase.from("place_categories").select("*").eq("status", "approved").order("sort_order").order("name"),
  ]);
  return {
    seating: seating.data ?? [],
    parking: parking.data ?? [],
    amenities: amenities.data ?? [],
    ratingCategories: ratingCategories.data ?? [],
    placeCategories: placeCategories.data ?? [],
  };
}

/** Display names for a set of profile ids. */
export async function getDisplayNames(ids: (string | null | undefined)[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter((id): id is string => !!id))];
  if (unique.length === 0) return new Map();
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id, display_name").in("id", unique);
  return new Map((data ?? []).map((p) => [p.id, p.display_name]));
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
