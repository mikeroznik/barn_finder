import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReviewForm } from "@/app/rinks/[id]/review/ReviewForm";
import { requireAdmin } from "@/lib/auth";
import { getDisplayNames } from "@/lib/data";
import { isUuid } from "@/lib/ids";
import { createClient } from "@/lib/supabase/server";
import type { RatingCategory, Review, ReviewRating } from "@/lib/types";

export const metadata: Metadata = { title: "Edit review" };

export default async function AdminEditReviewPage(props: PageProps<"/admin/reviews/[id]">) {
  await requireAdmin();
  const { id } = await props.params;
  if (!isUuid(id)) notFound();

  const supabase = await createClient();
  const [{ data }, { data: categories }] = await Promise.all([
    supabase.from("reviews").select("*, review_ratings(*), rinks(name)").eq("id", id).maybeSingle(),
    supabase.from("rating_categories").select("*").order("sort_order").order("name"),
  ]);
  if (!data) notFound();
  const review = data as Review & { review_ratings: ReviewRating[]; rinks: { name: string } | null };
  const names = await getDisplayNames([review.user_id]);

  return (
    <div className="space-y-4">
      <h1 className="h1">Edit review</h1>
      <p className="text-sm text-muted">
        By {names.get(review.user_id) ?? "former user"} for {review.rinks?.name ?? "a rink"}. Edits are recorded in the change
        history.
      </p>
      <ReviewForm
        rinkId={review.rink_id}
        categories={(categories ?? []) as RatingCategory[]}
        review={review}
        ratings={review.review_ratings}
        returnTo={`/rinks/${review.rink_id}`}
      />
    </div>
  );
}
