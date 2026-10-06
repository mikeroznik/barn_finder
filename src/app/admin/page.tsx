import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAdminCounts } from "./counts";

function daysAgoIso(days: number) {
  return new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
}

export default async function AdminHome() {
  await requireAdmin();
  const supabase = await createClient();
  const since = daysAgoIso(7);
  const [counts, changes, rinks, hidden] = await Promise.all([
    getAdminCounts(),
    supabase.from("change_log").select("id", { count: "exact", head: true }).gte("changed_at", since),
    supabase.from("rinks").select("id", { count: "exact", head: true }),
    supabase.from("rinks").select("id", { count: "exact", head: true }).eq("status", "disapproved"),
  ]);

  const tiles = [
    { label: "Open reports", value: counts.reports, href: "/admin/reports" },
    { label: "Pending suggestions", value: counts.suggestions, href: "/admin/suggestions" },
    { label: "Changes in last 7 days", value: changes.count ?? 0, href: "/admin/changes" },
    { label: "Rinks (disapproved)", value: `${rinks.count ?? 0} (${hidden.count ?? 0})`, href: "/admin/changes?table=rinks" },
  ];

  return (
    <div className="space-y-4">
      <h1 className="h1">Admin</h1>
      <ul className="grid gap-3 sm:grid-cols-2">
        {tiles.map((t) => (
          <li key={t.label}>
            <Link href={t.href} className="card block hover:border-primary">
              <p className="text-3xl font-bold">{t.value}</p>
              <p className="text-sm text-muted">{t.label}</p>
            </Link>
          </li>
        ))}
      </ul>
      <div className="card space-y-1 text-sm text-muted">
        <p>
          Everything users submit goes live immediately. Use <strong>Changes</strong> to review edits and revert them, and
          the Disapprove/Restore buttons on rink, place, review, comment and photo pages to hide content.
        </p>
      </div>
    </div>
  );
}
