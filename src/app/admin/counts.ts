import { createClient } from "@/lib/supabase/server";

export async function getAdminCounts() {
  const supabase = await createClient();
  const [reports, amenities, categories] = await Promise.all([
    supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("amenities").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("place_categories").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);
  return { reports: reports.count ?? 0, suggestions: (amenities.count ?? 0) + (categories.count ?? 0) };
}
