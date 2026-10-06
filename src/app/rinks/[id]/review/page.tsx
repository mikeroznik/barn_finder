import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PhotoGallery } from "@/components/PhotoGallery";
import { PhotoUploader } from "@/components/PhotoUploader";
import { requireUser } from "@/lib/auth";
import { isUuid } from "@/lib/ids";
import { createClient } from "@/lib/supabase/server";
import type { Photo, RatingCategory, Review, ReviewRating } from "@/lib/types";
import { ReviewForm } from "./ReviewForm";

export const metadata: Metadata = { title: "Your review" };

export default async function ReviewPage(props: PageProps<"/rinks/[id]/review">) {
  const { id } = await props.params;
  const { saved } = await props.searchParams;
  const path = `/rinks/${id}/review`;
  const user = await requireUser(path);
  if (!isUuid(id)) notFound();

  const supabase = await createClient();
  const [{ data: rink }, { data: categories }, { data: review }] = await Promise.all([
    supabase.from("rinks").select("id, name").eq("id", id).maybeSingle(),
    supabase.from("rating_categories").select("*").order("sort_order").order("name"),
    supabase.from("reviews").select("*, review_ratings(*)").eq("rink_id", id).eq("user_id", user.id).maybeSingle(),
  ]);
  if (!rink) notFound();

  const myReview = review as (Review & { review_ratings: ReviewRating[] }) | null;
  const ratings = myReview?.review_ratings ?? [];
  const cats = (categories ?? []) as RatingCategory[];
  const photos = ratings.length
    ? (((await supabase.from("photos").select("*").in("review_rating_id", ratings.map((r) => r.id))).data ?? []) as Photo[])
    : [];

  return (
    <div className="space-y-4">
      <p>
        <Link href={`/rinks/${id}`} className="link text-sm">
          ← {rink.name}
        </Link>
      </p>
      <h1 className="h1">{myReview ? "Edit your review" : "Write a review"}</h1>
      {saved && (
        <p role="status" className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
          Review saved. You can add a photo for each category you rated below.
        </p>
      )}

      <ReviewForm rinkId={id} categories={cats} review={myReview ?? undefined} ratings={ratings} />

      {ratings.length > 0 && (
        <section className="card space-y-4" aria-labelledby="rating-photos-h">
          <div>
            <h2 id="rating-photos-h" className="h2">
              Photos for your ratings
            </h2>
            <p className="hint">One photo per rated category, e.g. the ice, a locker room or the snack bar.</p>
          </div>
          {ratings.map((r) => {
            const c = cats.find((x) => x.id === r.category_id);
            const photo = photos.find((p) => p.review_rating_id === r.id);
            const label = c?.is_other ? r.other_label : c?.name;
            return (
              <div key={r.id} className="space-y-2 border-t border-border pt-3">
                <p className="text-sm font-medium">{label}</p>
                {photo ? (
                  <PhotoGallery photos={[photo]} currentUserId={user.id} isAdmin={user.isAdmin} path={path} />
                ) : (
                  <PhotoUploader userId={user.id} target={{ reviewRatingId: r.id }} path={path} label={`Add a ${label} photo`} />
                )}
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
