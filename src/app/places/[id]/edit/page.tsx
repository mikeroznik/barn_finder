import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getLists } from "@/lib/data";
import { isUuid } from "@/lib/ids";
import { createClient } from "@/lib/supabase/server";
import type { Place } from "@/lib/types";
import { PlaceForm } from "../../PlaceForm";

export const metadata: Metadata = { title: "Edit place" };

export default async function EditPlacePage(props: PageProps<"/places/[id]/edit">) {
  const { id } = await props.params;
  await requireUser(`/places/${id}/edit`);
  if (!isUuid(id)) notFound();

  const supabase = await createClient();
  const [{ data: place }, lists] = await Promise.all([supabase.from("places").select("*").eq("id", id).maybeSingle(), getLists()]);
  if (!place) notFound();

  return (
    <div className="space-y-4">
      <h1 className="h1">Edit {place.name}</h1>
      <PlaceForm rinkId={place.rink_id} place={place as Place} categories={lists.placeCategories} />
    </div>
  );
}
