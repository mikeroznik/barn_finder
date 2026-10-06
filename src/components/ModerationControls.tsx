"use client";

import { useTransition } from "react";
import { deleteRecord, setStatus } from "@/app/actions/moderation";
import type { ModerationStatus } from "@/lib/types";

/** Admin-only disapprove/restore (and optional delete) buttons for one record. */
export function ModerationControls({
  table,
  id,
  status,
  path,
  allowDelete = false,
}: {
  table: "rinks" | "places" | "reviews" | "place_comments" | "photos";
  id: string;
  status: ModerationStatus;
  path?: string;
  allowDelete?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const run = (fn: () => Promise<void>) =>
    startTransition(async () => {
      try {
        await fn();
      } catch (e) {
        alert(e instanceof Error ? e.message : "Something went wrong.");
      }
    });

  return (
    <span className="inline-flex flex-wrap gap-2">
      {status === "live" ? (
        <button type="button" className="btn-danger btn-sm" disabled={pending} onClick={() => run(() => setStatus(table, id, "disapproved", path))}>
          Disapprove
        </button>
      ) : (
        <button type="button" className="btn-secondary btn-sm" disabled={pending} onClick={() => run(() => setStatus(table, id, "live", path))}>
          Restore
        </button>
      )}
      {allowDelete && (
        <button
          type="button"
          className="btn-danger btn-sm"
          disabled={pending}
          onClick={() => {
            if (confirm("Delete permanently? It can be restored from the change history.")) run(() => deleteRecord(table, id, path));
          }}
        >
          Delete
        </button>
      )}
    </span>
  );
}

export function StatusBadge({ status }: { status: ModerationStatus }) {
  if (status === "live") return null;
  return <span className="badge bg-danger/15 text-danger">Disapproved — hidden from public</span>;
}
