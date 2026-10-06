import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PinMap, type Pin } from "@/components/map";
import { ModerationControls, StatusBadge } from "@/components/ModerationControls";
import { PhotoGallery } from "@/components/PhotoGallery";
import { PhotoUploader } from "@/components/PhotoUploader";
import { ReportButton } from "@/components/ReportButton";
import { Distance } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { formatDate, getDisplayNames } from "@/lib/data";
import { distanceKm, formatAddress, googleMapsUrl, pointOf } from "@/lib/geo";
import { isUuid } from "@/lib/ids";
import { createClient } from "@/lib/supabase/server";
import type { Photo, Place, PlaceComment, Rink } from "@/lib/types";
import { CommentForm } from "./CommentForm";

async function loadPlace(id: string) {
  if (!isUuid(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("places").select("*").eq("id", id).maybeSingle();
  return data as Place | null;
}

export async function generateMetadata(props: PageProps<"/places/[id]">): Promise<Metadata> {
  const place = await loadPlace((await props.params).id);
  return { title: place?.name ?? "Place not found" };
}

export default async function PlacePage(props: PageProps<"/places/[id]">) {
  const { id } = await props.params;
  const place = await loadPlace(id);
  if (!place) notFound();

  const path = `/places/${id}`;
  const supabase = await createClient();
  const user = await getCurrentUser();
  const isAdmin = !!user?.isAdmin;

  const [{ data: rinkData }, { data: category }, { data: photoData }, { data: commentData }] = await Promise.all([
    supabase.from("rinks").select("*").eq("id", place.rink_id).maybeSingle(),
    supabase.from("place_categories").select("name").eq("id", place.category_id).maybeSingle(),
    supabase.from("photos").select("*").eq("place_id", id).order("created_at"),
    supabase.from("place_comments").select("*").eq("place_id", id).order("updated_at", { ascending: false }),
  ]);
  const rink = rinkData as Rink | null;
  const photos = (photoData ?? []) as Photo[];
  const comments = (commentData ?? []) as PlaceComment[];
  const names = await getDisplayNames([place.updated_by, ...photos.map((p) => p.uploaded_by), ...comments.map((c) => c.user_id)]);

  const placePoint = pointOf(place);
  const rinkPoint = rink ? pointOf(rink) : null;
  const pins: Pin[] = [];
  if (placePoint) pins.push({ id: place.id, ...placePoint, title: place.name, kind: "place" });
  if (rink && rinkPoint) pins.push({ id: rink.id, ...rinkPoint, title: rink.name, href: `/rinks/${rink.id}`, kind: "rink" });

  const myComment = user ? comments.find((c) => c.user_id === user.id) : undefined;
  const myPhoto = user ? photos.find((p) => p.uploaded_by === user.id) : undefined;

  return (
    <article className="space-y-6">
      {rink && (
        <p>
          <Link href={`/rinks/${rink.id}`} className="link text-sm">
            ← {rink.name}
          </Link>
        </p>
      )}
      <header className="space-y-2">
        <StatusBadge status={place.status} />
        <span className="badge">{category?.name ?? "Place"}</span>
        <h1 className="h1">{place.name}</h1>
        <a href={googleMapsUrl(place.name, place)} target="_blank" rel="noreferrer" className="link block">
          {formatAddress(place)} ↗
        </a>
        {placePoint && rinkPoint && rink && (
          <p className="text-sm text-muted">
            <Distance km={distanceKm(placePoint, rinkPoint)} /> from {rink.name}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Link href={`${path}/edit`} className="btn-secondary btn-sm">
            Edit place info
          </Link>
          {isAdmin && <ModerationControls table="places" id={place.id} status={place.status} path={path} />}
          <ReportButton targetType="place" targetId={place.id} signedIn={!!user} />
        </div>
      </header>

      {pins.length > 0 && <PinMap pins={pins} className="h-56" maxZoom={15} />}

      <section className="card space-y-2">
        <h2 className="h2">About</h2>
        {place.description ? (
          <p className="whitespace-pre-line text-sm">{place.description}</p>
        ) : (
          <p className="text-sm text-muted">
            No write-up yet.{" "}
            <Link href={`${path}/edit`} className="link">
              Add one
            </Link>
            .
          </p>
        )}
      </section>

      <section className="card space-y-3">
        <h2 className="h2">Photos</h2>
        {photos.length === 0 && <p className="text-sm text-muted">No photos yet.</p>}
        <PhotoGallery
          photos={photos.map((p) => ({ ...p, uploaderName: names.get(p.uploaded_by) }))}
          currentUserId={user?.id ?? null}
          isAdmin={isAdmin}
          path={path}
        />
        {user && !myPhoto && <PhotoUploader userId={user.id} target={{ placeId: place.id }} path={path} />}
      </section>

      <section className="card space-y-4">
        <h2 className="h2">Comments ({comments.filter((c) => c.status === "live").length})</h2>
        {user ? (
          <CommentForm key={myComment?.updated_at ?? "new"} placeId={place.id} comment={myComment} />
        ) : (
          <p className="text-sm text-muted">
            <Link href={`/login?next=${encodeURIComponent(path)}`} className="link">
              Log in
            </Link>{" "}
            to comment or add a photo.
          </p>
        )}
        <ul className="space-y-4">
          {comments
            .filter((c) => c.user_id !== user?.id)
            .map((c) => (
              <li key={c.id} className={`space-y-1 border-t border-border pt-3 ${c.status !== "live" ? "opacity-60" : ""}`}>
                <StatusBadge status={c.status} />
                <p className="text-sm">
                  <span className="font-semibold">{names.get(c.user_id) ?? "Former user"}</span>{" "}
                  <span className="text-muted">· {formatDate(c.updated_at)}</span>
                </p>
                <p className="whitespace-pre-line text-sm">{c.body}</p>
                <div className="flex flex-wrap items-center gap-2">
                  {isAdmin && (
                    <>
                      <Link href={`/admin/comments/${c.id}`} className="btn-secondary btn-sm">
                        Edit (admin)
                      </Link>
                      <ModerationControls table="place_comments" id={c.id} status={c.status} path={path} allowDelete />
                    </>
                  )}
                  <ReportButton targetType="place_comment" targetId={c.id} signedIn={!!user} />
                </div>
              </li>
            ))}
        </ul>
      </section>

      <p className="text-xs text-muted">
        Last updated {place.updated_by ? <>by {names.get(place.updated_by) ?? "a former user"} </> : null}on{" "}
        {formatDate(place.updated_at)}.
      </p>
    </article>
  );
}
