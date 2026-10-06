import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PinMap, type Pin } from "@/components/map";
import { ModerationControls, StatusBadge } from "@/components/ModerationControls";
import { PhotoGallery } from "@/components/PhotoGallery";
import { PhotoUploader } from "@/components/PhotoUploader";
import { ReportButton } from "@/components/ReportButton";
import { Stars } from "@/components/Stars";
import { Distance } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { formatDate, getDisplayNames, getLists } from "@/lib/data";
import { distanceKm, formatAddress, googleMapsUrl, pointOf } from "@/lib/geo";
import { isUuid } from "@/lib/ids";
import { createClient } from "@/lib/supabase/server";
import type { Photo, Place, Review, ReviewRating, Rink } from "@/lib/types";

type ReviewWithRatings = Review & { review_ratings: ReviewRating[] };

async function loadRink(id: string) {
  if (!isUuid(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("rinks").select("*").eq("id", id).maybeSingle();
  return data as Rink | null;
}

export async function generateMetadata(props: PageProps<"/rinks/[id]">): Promise<Metadata> {
  const rink = await loadRink((await props.params).id);
  return { title: rink?.name ?? "Rink not found" };
}

export default async function RinkPage(props: PageProps<"/rinks/[id]">) {
  const { id } = await props.params;
  const rink = await loadRink(id);
  if (!rink) notFound();

  const path = `/rinks/${id}`;
  const supabase = await createClient();
  const user = await getCurrentUser();
  const isAdmin = !!user?.isAdmin;

  const [lists, photosRes, reviewsRes, summaryRes, placesRes] = await Promise.all([
    getLists(),
    supabase.from("photos").select("*").eq("rink_id", id).order("created_at"),
    supabase.from("reviews").select("*, review_ratings(*)").eq("rink_id", id).order("updated_at", { ascending: false }),
    supabase.from("rink_rating_summary").select("*").eq("rink_id", id),
    supabase.from("places").select("*").eq("rink_id", id).order("name"),
  ]);
  const photos = (photosRes.data ?? []) as Photo[];
  const reviews = (reviewsRes.data ?? []) as ReviewWithRatings[];
  const summary = (summaryRes.data ?? []) as { category_id: string; avg_rating: number; rating_count: number }[];
  const places = (placesRes.data ?? []) as Place[];

  const ratingIds = reviews.flatMap((r) => r.review_ratings.map((rr) => rr.id));
  const reviewPhotos = ratingIds.length
    ? (((await supabase.from("photos").select("*").in("review_rating_id", ratingIds)).data ?? []) as Photo[])
    : [];

  const names = await getDisplayNames([
    rink.updated_by,
    ...reviews.map((r) => r.user_id),
    ...photos.map((p) => p.uploaded_by),
  ]);

  const seating = lists.seating.filter((s) => rink.seating_type_ids.includes(s.id));
  const parking = lists.parking.filter((p) => rink.parking_type_ids.includes(p.id));
  const categoryName = new Map(lists.ratingCategories.map((c) => [c.id, c]));
  const placeCategory = new Map(lists.placeCategories.map((c) => [c.id, c.name]));
  const myReview = user ? reviews.find((r) => r.user_id === user.id) : undefined;
  const myGeneralPhoto = user ? photos.find((p) => p.uploaded_by === user.id) : undefined;

  const rinkPoint = pointOf(rink);
  const pins: Pin[] = [];
  if (rinkPoint) pins.push({ id: rink.id, ...rinkPoint, title: rink.name, subtitle: formatAddress(rink), kind: "rink" });
  for (const p of places) {
    const pt = pointOf(p);
    if (pt) pins.push({ id: p.id, ...pt, title: p.name, subtitle: placeCategory.get(p.category_id), href: `/places/${p.id}`, kind: "place" });
  }

  return (
    <article className="space-y-6">
      <header className="space-y-2">
        <StatusBadge status={rink.status} />
        <h1 className="h1">{rink.name}</h1>
        <a href={googleMapsUrl(rink.name, rink)} target="_blank" rel="noreferrer" className="link block">
          {formatAddress(rink)} ↗
        </a>
        <div className="flex flex-wrap gap-2 pt-1">
          <span className="badge">
            {rink.sheet_count == null
              ? "Sheets of ice: unknown"
              : `${rink.sheet_count} ${rink.sheet_count === 1 ? "sheet" : "sheets"} of ice`}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Link href={`${path}/edit`} className="btn-secondary btn-sm">
            Edit rink info
          </Link>
          <Link href={`${path}/review`} className="btn-primary btn-sm">
            {myReview ? "Edit your review" : "Write a review"}
          </Link>
          {isAdmin && <ModerationControls table="rinks" id={rink.id} status={rink.status} path={path} />}
          <ReportButton targetType="rink" targetId={rink.id} signedIn={!!user} />
        </div>
      </header>

      {pins.length > 0 && <PinMap pins={pins} className="h-56 sm:h-72" maxZoom={15} />}

      <section className="card space-y-3" aria-labelledby="photos-h">
        <h2 id="photos-h" className="h2">
          Photos
        </h2>
        {photos.length === 0 && <p className="text-sm text-muted">No photos yet.</p>}
        <PhotoGallery
          photos={photos.map((p) => ({ ...p, uploaderName: names.get(p.uploaded_by) }))}
          currentUserId={user?.id ?? null}
          isAdmin={isAdmin}
          path={path}
        />
        {user ? (
          myGeneralPhoto ? (
            <p className="text-xs text-muted">You&apos;ve added your photo of this rink. Delete it to upload a different one.</p>
          ) : (
            <PhotoUploader userId={user.id} target={{ rinkId: rink.id }} path={path} />
          )
        ) : (
          <p className="text-sm text-muted">
            <Link href={`/login?next=${encodeURIComponent(path)}`} className="link">
              Log in
            </Link>{" "}
            to add a photo.
          </p>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="card space-y-2">
          <h2 className="h2">Seating</h2>
          <ChipList items={seating.map((s) => s.name)} empty="Not listed yet" />
          {rink.seating_notes && <p className="whitespace-pre-line text-sm">{rink.seating_notes}</p>}
        </div>
        <div className="card space-y-2">
          <h2 className="h2">Parking</h2>
          <ChipList items={parking.map((p) => p.name)} empty="Not listed yet" />
          {rink.parking_notes && <p className="whitespace-pre-line text-sm">{rink.parking_notes}</p>}
        </div>
      </section>

      <section className="card space-y-2" aria-labelledby="amenities-h">
        <h2 id="amenities-h" className="h2">
          Amenities
        </h2>
        <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
          {lists.amenities.map((a) => {
            const has = rink.amenity_ids.includes(a.id);
            return (
              <li key={a.id} className="flex items-center gap-2 text-sm">
                <span
                  aria-hidden
                  className={`grid h-5 w-5 place-items-center rounded text-xs font-bold ${
                    has ? "bg-success text-white" : "bg-surface-2 text-muted"
                  }`}
                >
                  {has ? "✓" : "–"}
                </span>
                <span className={has ? "" : "text-muted"}>
                  {a.name}
                  <span className="sr-only">{has ? ": yes" : ": no"}</span>
                </span>
              </li>
            );
          })}
        </ul>
        <p className="hint">
          Missing an amenity?{" "}
          <Link href="/suggest" className="link">
            Suggest one
          </Link>
          .
        </p>
      </section>

      <section className="card space-y-4" aria-labelledby="reviews-h">
        <div className="flex items-center justify-between gap-2">
          <h2 id="reviews-h" className="h2">
            Reviews ({reviews.filter((r) => r.status === "live").length})
          </h2>
          <Link href={`${path}/review`} className="btn-secondary btn-sm">
            {myReview ? "Edit yours" : "Write one"}
          </Link>
        </div>

        {summary.length > 0 && (
          <dl className="grid gap-2 sm:grid-cols-2">
            {lists.ratingCategories
              .map((c) => ({ c, s: summary.find((s) => s.category_id === c.id) }))
              .filter(({ s }) => s)
              .map(({ c, s }) => (
                <div key={c.id} className="flex items-center justify-between gap-2 rounded-lg bg-surface-2 px-3 py-2">
                  <dt className="text-sm font-medium">{c.is_other ? "Other (various)" : c.name}</dt>
                  <dd className="flex items-center gap-2 text-sm">
                    <Stars value={Number(s!.avg_rating)} />
                    <span className="text-muted">
                      {Number(s!.avg_rating).toFixed(1)} ({s!.rating_count})
                    </span>
                  </dd>
                </div>
              ))}
          </dl>
        )}

        {reviews.length === 0 && <p className="text-sm text-muted">No reviews yet. Be the first!</p>}
        <ul className="space-y-4">
          {reviews.map((r) => (
            <li key={r.id} className={`space-y-2 border-t border-border pt-4 ${r.status !== "live" ? "opacity-60" : ""}`}>
              <StatusBadge status={r.status} />
              <p className="text-sm">
                <span className="font-semibold">{names.get(r.user_id) ?? "Former user"}</span>{" "}
                <span className="text-muted">· {formatDate(r.updated_at)}</span>
              </p>
              {r.review_ratings.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  {r.review_ratings.map((rr) => {
                    const c = categoryName.get(rr.category_id);
                    return (
                      <li key={rr.id} className="badge gap-1">
                        {c?.is_other ? rr.other_label : c?.name} <Stars value={rr.rating} size="text-xs" />
                      </li>
                    );
                  })}
                </ul>
              )}
              <p className="whitespace-pre-line text-sm">{r.body}</p>
              <PhotoGallery
                photos={reviewPhotos
                  .filter((p) => r.review_ratings.some((rr) => rr.id === p.review_rating_id))
                  .map((p) => {
                    const rr = r.review_ratings.find((x) => x.id === p.review_rating_id)!;
                    const c = categoryName.get(rr.category_id);
                    return { ...p, caption: p.caption ?? (c?.is_other ? rr.other_label : c?.name) ?? null };
                  })}
                currentUserId={user?.id ?? null}
                isAdmin={isAdmin}
                path={path}
              />
              <div className="flex flex-wrap items-center gap-2">
                {isAdmin && (
                  <>
                    <Link href={`/admin/reviews/${r.id}`} className="btn-secondary btn-sm">
                      Edit (admin)
                    </Link>
                    <ModerationControls table="reviews" id={r.id} status={r.status} path={path} allowDelete />
                  </>
                )}
                {r.user_id !== user?.id && <ReportButton targetType="review" targetId={r.id} signedIn={!!user} />}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="card space-y-3" aria-labelledby="places-h">
        <div className="flex items-center justify-between gap-2">
          <h2 id="places-h" className="h2">
            Nearby places
          </h2>
          <Link href={`${path}/places/new`} className="btn-secondary btn-sm">
            Add a place
          </Link>
        </div>
        {places.length === 0 ? (
          <p className="text-sm text-muted">No places added yet: hotels, coffee, hockey stores, food…</p>
        ) : (
          <ul className="divide-y divide-border">
            {places.map((p) => {
              const pt = pointOf(p);
              return (
                <li key={p.id} className={p.status !== "live" ? "opacity-60" : ""}>
                  <Link href={`/places/${p.id}`} className="flex items-start justify-between gap-3 py-3 hover:text-primary">
                    <span>
                      <span className="block font-medium">{p.name}</span>
                      <span className="block text-xs text-muted">
                        {placeCategory.get(p.category_id) ?? "Place"} · {formatAddress(p)}
                      </span>
                    </span>
                    {rinkPoint && pt && (
                      <span className="badge shrink-0">
                        <Distance km={distanceKm(rinkPoint, pt)} />
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="text-xs text-muted">
        Last updated {rink.updated_by ? <>by {names.get(rink.updated_by) ?? "a former user"} </> : null}on{" "}
        {formatDate(rink.updated_at)}.
      </p>
    </article>
  );
}

function ChipList({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) return <p className="text-sm text-muted">{empty}</p>;
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((i) => (
        <li key={i} className="badge text-sm text-text">
          {i}
        </li>
      ))}
    </ul>
  );
}
