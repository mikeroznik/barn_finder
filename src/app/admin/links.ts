import { createClient } from "@/lib/supabase/server";

export interface TargetRef {
  table: string; // rinks | places | reviews | review_ratings | place_comments | photos
  id: string;
  data?: Record<string, unknown> | null;
}

/**
 * Works out a public URL for records of any moderated table. Uses the row
 * snapshot when given (change log) and looks up anything missing.
 */
export async function resolveLinks(refs: TargetRef[]): Promise<Map<string, string>> {
  const supabase = await createClient();
  const links = new Map<string, string>();
  const key = (r: TargetRef) => `${r.table}:${r.id}`;
  const str = (v: unknown) => (typeof v === "string" ? v : undefined);

  // Load rows we don't have snapshots for.
  const need = (table: string) => refs.filter((r) => r.table === table && !r.data).map((r) => r.id);
  const [reviews, comments, photos] = await Promise.all([
    need("reviews").length ? supabase.from("reviews").select("id, rink_id").in("id", need("reviews")) : { data: [] },
    need("place_comments").length ? supabase.from("place_comments").select("id, place_id").in("id", need("place_comments")) : { data: [] },
    need("photos").length
      ? supabase.from("photos").select("id, rink_id, place_id, review_rating_id").in("id", need("photos"))
      : { data: [] },
  ]);
  const rows = new Map<string, Record<string, unknown>>();
  for (const r of reviews.data ?? []) rows.set(`reviews:${r.id}`, r);
  for (const r of comments.data ?? []) rows.set(`place_comments:${r.id}`, r);
  for (const r of photos.data ?? []) rows.set(`photos:${r.id}`, r);
  const dataOf = (r: TargetRef) => r.data ?? rows.get(key(r)) ?? {};

  // review_ratings → review → rink
  const ratingIds = new Set<string>();
  for (const r of refs) {
    if (r.table === "review_ratings") ratingIds.add(r.id);
    const rr = str(dataOf(r).review_rating_id);
    if (r.table === "photos" && rr) ratingIds.add(rr);
  }
  const ratingToRink = new Map<string, string>();
  if (ratingIds.size) {
    const { data } = await supabase.from("review_ratings").select("id, reviews(rink_id)").in("id", [...ratingIds]);
    for (const r of data ?? []) {
      const review = r.reviews as unknown as { rink_id: string } | null;
      if (review) ratingToRink.set(r.id, review.rink_id);
    }
  }
  // review_ratings snapshots carry review_id; look up those reviews too.
  const reviewIds = refs.filter((r) => r.table === "review_ratings").map((r) => str(dataOf(r).review_id)).filter(Boolean) as string[];
  const reviewToRink = new Map<string, string>();
  if (reviewIds.length) {
    const { data } = await supabase.from("reviews").select("id, rink_id").in("id", reviewIds);
    for (const r of data ?? []) reviewToRink.set(r.id, r.rink_id);
  }

  for (const r of refs) {
    const d = dataOf(r);
    let href: string | undefined;
    switch (r.table) {
      case "rinks":
        href = `/rinks/${r.id}`;
        break;
      case "places":
        href = `/places/${r.id}`;
        break;
      case "reviews":
        href = str(d.rink_id) && `/rinks/${str(d.rink_id)}`;
        break;
      case "review_ratings": {
        const rink = ratingToRink.get(r.id) ?? reviewToRink.get(str(d.review_id) ?? "");
        href = rink && `/rinks/${rink}`;
        break;
      }
      case "place_comments":
        href = str(d.place_id) && `/places/${str(d.place_id)}`;
        break;
      case "photos": {
        const rink = str(d.rink_id) ?? ratingToRink.get(str(d.review_rating_id) ?? "");
        href = rink ? `/rinks/${rink}` : str(d.place_id) && `/places/${str(d.place_id)}`;
        break;
      }
    }
    if (href) links.set(key(r), href);
  }
  return links;
}
