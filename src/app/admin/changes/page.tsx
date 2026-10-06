import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getDisplayNames, getLists } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { ChangeLogEntry } from "@/lib/types";
import { revertChange } from "../actions";
import { ActionButton } from "../ActionButton";
import { resolveLinks } from "../links";

export const metadata: Metadata = { title: "Changes" };

const PAGE_SIZE = 50;
const TABLES = ["rinks", "places", "reviews", "review_ratings", "place_comments", "photos"];
const TABLE_LABEL: Record<string, string> = {
  rinks: "Rink",
  places: "Place",
  reviews: "Review",
  review_ratings: "Rating",
  place_comments: "Comment",
  photos: "Photo",
};
const IGNORED = new Set(["id", "created_at", "updated_at", "created_by", "updated_by", "search_text"]);
const ACTION_LABEL = { INSERT: "Added", UPDATE: "Edited", DELETE: "Deleted" } as const;

function titleOf(e: ChangeLogEntry): string {
  const d = (e.new_data ?? e.old_data ?? {}) as Record<string, unknown>;
  const v = d.name ?? d.body ?? d.storage_path ?? d.other_label ?? (d.rating ? `${d.rating} stars` : "");
  const s = String(v ?? "");
  return s.length > 80 ? `${s.slice(0, 80)}…` : s;
}

export default async function ChangesPage(props: PageProps<"/admin/changes">) {
  await requireAdmin();
  const sp = await props.searchParams;
  const table = typeof sp.table === "string" && TABLES.includes(sp.table) ? sp.table : "";
  const page = Math.max(1, Number(sp.page) || 1);

  const supabase = await createClient();
  let query = supabase
    .from("change_log")
    .select("*", { count: "exact" })
    .order("changed_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (table) query = query.eq("table_name", table);
  const { data, count, error } = await query;
  if (error) throw new Error(error.message);
  const entries = (data ?? []) as ChangeLogEntry[];

  const [names, lists, links] = await Promise.all([
    getDisplayNames(entries.flatMap((e) => [e.changed_by, e.reverted_by])),
    getLists(),
    resolveLinks(entries.map((e) => ({ table: e.table_name, id: e.record_id, data: e.new_data ?? e.old_data }))),
  ]);
  const idNames = new Map<string, string>(
    [...lists.seating, ...lists.parking, ...lists.amenities, ...lists.placeCategories, ...lists.ratingCategories].map((i) => [i.id, i.name]),
  );
  const fmt = (v: unknown): string => {
    if (v == null || v === "") return "—";
    if (Array.isArray(v)) return v.length ? v.map((x) => idNames.get(String(x)) ?? String(x)).join(", ") : "—";
    if (typeof v === "string" && idNames.has(v)) return idNames.get(v)!;
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return s.length > 160 ? `${s.slice(0, 160)}…` : s;
  };
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const qs = (p: number) => `?${new URLSearchParams({ ...(table ? { table } : {}), page: String(p) })}`;

  return (
    <div className="space-y-4">
      <h1 className="h1">Change history</h1>
      <nav aria-label="Filter by type" className="flex flex-wrap gap-2">
        <Link href="/admin/changes" className={`badge ${!table ? "bg-primary text-on-primary" : ""}`}>
          All
        </Link>
        {TABLES.map((t) => (
          <Link key={t} href={`/admin/changes?table=${t}`} className={`badge ${table === t ? "bg-primary text-on-primary" : ""}`}>
            {TABLE_LABEL[t]}s
          </Link>
        ))}
      </nav>

      {entries.length === 0 && <p className="text-sm text-muted">No changes yet.</p>}
      <ul className="space-y-3">
        {entries.map((e) => {
          const href = links.get(`${e.table_name}:${e.record_id}`);
          const changed =
            e.action === "UPDATE" && e.old_data && e.new_data
              ? Object.keys(e.new_data).filter(
                  (k) => !IGNORED.has(k) && JSON.stringify(e.old_data![k]) !== JSON.stringify(e.new_data![k]),
                )
              : [];
          return (
            <li key={e.id} className={`card space-y-2 ${e.reverted_at ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm">
                  <span className="badge mr-1">{TABLE_LABEL[e.table_name] ?? e.table_name}</span>
                  <strong>{ACTION_LABEL[e.action]}</strong>{" "}
                  {href ? (
                    <Link href={href} className="link">
                      {titleOf(e) || "view"}
                    </Link>
                  ) : (
                    titleOf(e)
                  )}
                </p>
                <p className="text-xs text-muted">
                  {e.changed_by ? names.get(e.changed_by) ?? "former user" : "system"} ·{" "}
                  {new Date(e.changed_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
              {changed.length > 0 && (
                <dl className="space-y-1 text-sm">
                  {changed.map((k) => (
                    <div key={k} className="grid gap-1 sm:grid-cols-[10rem_1fr]">
                      <dt className="font-medium text-muted">{k.replace(/_/g, " ")}</dt>
                      <dd className="break-words">
                        <del className="text-danger">{fmt(e.old_data![k])}</del> → <ins className="text-success no-underline">{fmt(e.new_data![k])}</ins>
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
              {e.reverted_at ? (
                <p className="text-xs text-muted">
                  Reverted by {e.reverted_by ? names.get(e.reverted_by) ?? "an admin" : "an admin"} on{" "}
                  {new Date(e.reverted_at).toLocaleDateString("en-US")}
                </p>
              ) : (
                <ActionButton
                  action={revertChange.bind(null, e.id)}
                  confirmText={
                    e.action === "INSERT"
                      ? "Reverting an addition deletes the record (and anything attached to it). Continue?"
                      : e.action === "DELETE"
                        ? "Restore the deleted record?"
                        : "Restore the values from before this edit?"
                  }
                >
                  {e.action === "INSERT" ? "Revert (delete)" : e.action === "DELETE" ? "Revert (restore)" : "Revert this edit"}
                </ActionButton>
              )}
            </li>
          );
        })}
      </ul>

      {pages > 1 && (
        <nav aria-label="Pages" className="flex items-center justify-between">
          {page > 1 ? (
            <Link href={qs(page - 1)} className="btn-secondary btn-sm">
              ← Newer
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm text-muted">
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link href={qs(page + 1)} className="btn-secondary btn-sm">
              Older →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
