"use client";

import { useTransition } from "react";
import { deletePhoto } from "@/app/actions/photos";
import { photoUrl } from "@/lib/photos";
import type { ModerationStatus } from "@/lib/types";
import { ModerationControls } from "./ModerationControls";
import { ReportButton } from "./ReportButton";

export interface GalleryPhoto {
  id: string;
  storage_path: string;
  caption: string | null;
  uploaded_by: string;
  uploaderName?: string;
  status: ModerationStatus;
}

export function PhotoGallery({
  photos,
  currentUserId,
  isAdmin,
  path,
}: {
  photos: GalleryPhoto[];
  currentUserId: string | null;
  isAdmin: boolean;
  path: string;
}) {
  const [pending, startTransition] = useTransition();
  if (photos.length === 0) return null;

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {photos.map((p) => (
        <li key={p.id} className={`space-y-1 ${p.status !== "live" ? "opacity-60" : ""}`}>
          <a href={photoUrl(p.storage_path)} target="_blank" rel="noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element -- photos are already resized; served from Supabase storage */}
            <img
              src={photoUrl(p.storage_path)}
              alt={p.caption ?? "Rink photo"}
              loading="lazy"
              className="aspect-[4/3] w-full rounded-lg border border-border object-cover"
            />
          </a>
          {(p.caption || p.uploaderName) && (
            <p className="text-xs text-muted">
              {p.caption}
              {p.caption && p.uploaderName ? " · " : ""}
              {p.uploaderName && <>by {p.uploaderName}</>}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {(p.uploaded_by === currentUserId || isAdmin) && (
              <button
                type="button"
                className="text-xs font-medium text-danger hover:underline"
                disabled={pending}
                onClick={() => {
                  if (confirm("Delete this photo?")) startTransition(() => deletePhoto(p.id, path));
                }}
              >
                Delete
              </button>
            )}
            {isAdmin && <ModerationControls table="photos" id={p.id} status={p.status} path={path} />}
            {p.uploaded_by !== currentUserId && <ReportButton targetType="photo" targetId={p.id} signedIn={!!currentUserId} />}
          </div>
        </li>
      ))}
    </ul>
  );
}
