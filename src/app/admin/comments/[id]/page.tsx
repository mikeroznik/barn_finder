import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CommentForm } from "@/app/places/[id]/CommentForm";
import { requireAdmin } from "@/lib/auth";
import { getDisplayNames } from "@/lib/data";
import { isUuid } from "@/lib/ids";
import { createClient } from "@/lib/supabase/server";
import type { PlaceComment } from "@/lib/types";

export const metadata: Metadata = { title: "Edit comment" };

export default async function AdminEditCommentPage(props: PageProps<"/admin/comments/[id]">) {
  await requireAdmin();
  const { id } = await props.params;
  if (!isUuid(id)) notFound();

  const supabase = await createClient();
  const { data } = await supabase.from("place_comments").select("*, places(name)").eq("id", id).maybeSingle();
  if (!data) notFound();
  const comment = data as PlaceComment & { places: { name: string } | null };
  const names = await getDisplayNames([comment.user_id]);

  return (
    <div className="space-y-4">
      <p>
        <Link href={`/places/${comment.place_id}`} className="link text-sm">
          ← {comment.places?.name ?? "Place"}
        </Link>
      </p>
      <h1 className="h1">Edit comment</h1>
      <p className="text-sm text-muted">By {names.get(comment.user_id) ?? "former user"}.</p>
      <div className="card">
        <CommentForm placeId={comment.place_id} comment={comment} />
      </div>
    </div>
  );
}
