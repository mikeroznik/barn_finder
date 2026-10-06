import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getDisplayNames } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { Report } from "@/lib/types";
import { setReportStatus } from "../actions";
import { ActionButton } from "../ActionButton";
import { resolveLinks } from "../links";

export const metadata: Metadata = { title: "Reports" };

const TARGET_TABLE = { rink: "rinks", place: "places", review: "reviews", place_comment: "place_comments", photo: "photos" } as const;
const TARGET_LABEL = { rink: "Rink", place: "Place", review: "Review", place_comment: "Comment", photo: "Photo" } as const;

export default async function ReportsPage(props: PageProps<"/admin/reports">) {
  await requireAdmin();
  const { show } = await props.searchParams;
  const showAll = show === "all";

  const supabase = await createClient();
  let query = supabase.from("reports").select("*").order("created_at", { ascending: false }).limit(200);
  if (!showAll) query = query.eq("status", "open");
  const { data } = await query;
  const reports = (data ?? []) as Report[];

  const [names, links] = await Promise.all([
    getDisplayNames(reports.flatMap((r) => [r.reported_by, r.resolved_by])),
    resolveLinks(reports.map((r) => ({ table: TARGET_TABLE[r.target_type], id: r.target_id }))),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="h1">Reports</h1>
        <Link href={showAll ? "/admin/reports" : "/admin/reports?show=all"} className="btn-secondary btn-sm">
          {showAll ? "Show open only" : "Show all"}
        </Link>
      </div>
      {reports.length === 0 && <p className="text-sm text-muted">{showAll ? "No reports yet." : "No open reports. 🎉"}</p>}
      <ul className="space-y-3">
        {reports.map((r) => {
          const href = links.get(`${TARGET_TABLE[r.target_type]}:${r.target_id}`);
          return (
            <li key={r.id} className="card space-y-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm">
                  <span className="badge mr-1">{TARGET_LABEL[r.target_type]}</span>
                  {href ? (
                    <Link href={href} className="link">
                      View reported item
                    </Link>
                  ) : (
                    <span className="text-muted">Item no longer exists</span>
                  )}
                </p>
                <p className="text-xs text-muted">
                  {r.reported_by ? names.get(r.reported_by) ?? "former user" : "former user"} ·{" "}
                  {new Date(r.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
              <p className="whitespace-pre-line text-sm">{r.reason}</p>
              {r.status === "open" ? (
                <div className="flex flex-wrap gap-2">
                  <ActionButton action={setReportStatus.bind(null, r.id, "resolved")} className="btn-primary btn-sm">
                    Mark resolved
                  </ActionButton>
                  <ActionButton action={setReportStatus.bind(null, r.id, "dismissed")}>Dismiss</ActionButton>
                </div>
              ) : (
                <p className="flex flex-wrap items-center gap-2 text-xs text-muted">
                  <span className="badge capitalize">{r.status}</span>
                  {r.resolved_by && <>by {names.get(r.resolved_by) ?? "an admin"}</>}
                  <ActionButton action={setReportStatus.bind(null, r.id, "open")}>Reopen</ActionButton>
                </p>
              )}
            </li>
          );
        })}
      </ul>
      <p className="hint">To hide reported content, open the item and use Disapprove. Then mark the report resolved.</p>
    </div>
  );
}
