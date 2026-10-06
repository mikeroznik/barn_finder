import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getLists } from "@/lib/data";
import { isUuid } from "@/lib/ids";
import { createClient } from "@/lib/supabase/server";
import type { Rink } from "@/lib/types";
import { RinkForm } from "../../RinkForm";

export const metadata: Metadata = { title: "Edit rink" };

export default async function EditRinkPage(props: PageProps<"/rinks/[id]/edit">) {
  const { id } = await props.params;
  await requireUser(`/rinks/${id}/edit`);
  if (!isUuid(id)) notFound();

  const supabase = await createClient();
  const [{ data: rink }, lists] = await Promise.all([
    supabase.from("rinks").select("*").eq("id", id).maybeSingle(),
    getLists(),
  ]);
  if (!rink) notFound();

  return (
    <div className="space-y-4">
      <h1 className="h1">Edit {rink.name}</h1>
      <RinkForm rink={rink as Rink} lists={lists} />
    </div>
  );
}
