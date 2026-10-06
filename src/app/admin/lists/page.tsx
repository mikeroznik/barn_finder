import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ListEditor, type EditableItem } from "./ListEditor";

export const metadata: Metadata = { title: "Lists" };

export default async function ListsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const load = (table: string) => supabase.from(table).select("*").order("sort_order").order("name");
  const [seating, parking, amenities, ratings, placeCats] = await Promise.all([
    load("seating_types"),
    load("parking_types"),
    supabase.from("amenities").select("*").neq("status", "pending").order("sort_order").order("name"),
    load("rating_categories"),
    supabase.from("place_categories").select("*").neq("status", "pending").order("sort_order").order("name"),
  ]);
  const items = (r: { data: unknown }) => (r.data ?? []) as EditableItem[];

  return (
    <div className="space-y-4">
      <h1 className="h1">Lists</h1>
      <p className="text-sm text-muted">
        Deactivating or hiding keeps existing data intact. Delete only works for unused entries. Pending user suggestions are on
        the Suggestions tab.
      </p>
      <ListEditor title="Seating types" table="seating_types" items={items(seating)} help="Shown as checkboxes on the rink form." />
      <ListEditor title="Parking types" table="parking_types" items={items(parking)} help="Shown as checkboxes on the rink form." />
      <ListEditor title="Amenities" table="amenities" items={items(amenities)} help="Every rink shows each visible amenity as checked or unchecked." />
      <ListEditor title="Review rating categories" table="rating_categories" items={items(ratings)} help="Each is an optional 1–5 star rating on reviews." />
      <ListEditor title="Nearby place categories" table="place_categories" items={items(placeCats)} help="Required category for places of interest." />
    </div>
  );
}
