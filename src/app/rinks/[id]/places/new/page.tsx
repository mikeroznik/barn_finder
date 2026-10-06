import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PlaceForm } from "@/app/places/PlaceForm";
import { requireUser } from "@/lib/auth";
import { getLists } from "@/lib/data";
import { isUuid } from "@/lib/ids";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Add a nearby place" };

export default async function NewPlacePage(props: PageProps<"/rinks/[id]/places/new">) {
  const { id } = await props.params;
  await requireUser(`/rinks/${id}/places/new`);
  if (!isUuid(id)) notFound();

  const supabase = await createClient();
  const [{ data: rink }, lists] = await Promise.all([
    supabase.from("rinks").select("id, name, city, region, country_code").eq("id", id).maybeSingle(),
    getLists(),
  ]);
  if (!rink) notFound();

  return (
    <div className="space-y-4">
      <p>
        <Link href={`/rinks/${id}`} className="link text-sm">
          ← {rink.name}
        </Link>
      </p>
      <h1 className="h1">Add a place near {rink.name}</h1>
      <PlaceForm
        rinkId={id}
        categories={lists.placeCategories}
        addressHint={{ city: rink.city, region: rink.region, country_code: rink.country_code }}
      />
    </div>
  );
}
