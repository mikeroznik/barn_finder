import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getDisplayNames } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { SuggestableItem } from "@/lib/types";
import { setSuggestionStatus } from "../actions";
import { ActionButton } from "../ActionButton";

export const metadata: Metadata = { title: "Suggestions" };

export default async function SuggestionsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const [{ data: amenities }, { data: categories }] = await Promise.all([
    supabase.from("amenities").select("*").neq("status", "approved").order("created_at", { ascending: false }),
    supabase.from("place_categories").select("*").neq("status", "approved").order("created_at", { ascending: false }),
  ]);
  const groups = [
    { title: "Amenities", table: "amenities", items: (amenities ?? []) as SuggestableItem[] },
    { title: "Nearby place categories", table: "place_categories", items: (categories ?? []) as SuggestableItem[] },
  ];
  const names = await getDisplayNames(groups.flatMap((g) => g.items.map((i) => i.suggested_by)));

  return (
    <div className="space-y-4">
      <h1 className="h1">Suggestions</h1>
      <p className="text-sm text-muted">Approved amenities appear on every rink, unchecked until someone checks them.</p>
      {groups.map((g) => (
        <section key={g.table} className="card space-y-3">
          <h2 className="h2">{g.title}</h2>
          {g.items.length === 0 ? (
            <p className="text-sm text-muted">Nothing waiting.</p>
          ) : (
            <ul className="divide-y divide-border">
              {g.items.map((i) => (
                <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="font-medium">{i.name}</p>
                    <p className="text-xs text-muted">
                      {i.suggested_by ? `by ${names.get(i.suggested_by) ?? "former user"} · ` : ""}
                      {new Date(i.created_at).toLocaleDateString("en-US")}
                      {i.status === "rejected" && <span className="badge ml-2">Rejected</span>}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <ActionButton action={setSuggestionStatus.bind(null, g.table, i.id, "approved")} className="btn-primary btn-sm">
                      Approve
                    </ActionButton>
                    {i.status === "pending" && (
                      <ActionButton action={setSuggestionStatus.bind(null, g.table, i.id, "rejected")} className="btn-danger btn-sm">
                        Reject
                      </ActionButton>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
