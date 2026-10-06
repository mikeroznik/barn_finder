import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SuggestForm } from "./SuggestForm";

export const metadata: Metadata = { title: "Suggest an amenity or category" };

export default async function SuggestPage() {
  const user = await requireUser("/suggest");
  const supabase = await createClient();
  const [{ data: amenities }, { data: categories }] = await Promise.all([
    supabase.from("amenities").select("name, status, created_at").eq("suggested_by", user.id),
    supabase.from("place_categories").select("name, status, created_at").eq("suggested_by", user.id),
  ]);
  const mine = [
    ...(amenities ?? []).map((a) => ({ ...a, kind: "Amenity" })),
    ...(categories ?? []).map((c) => ({ ...c, kind: "Place category" })),
  ].sort((a, b) => b.created_at.localeCompare(a.created_at));

  return (
    <div className="space-y-4">
      <h1 className="h1">Suggest something new</h1>
      <p className="text-sm text-muted">
        Suggest a rink amenity (like skate sharpening) or a category of nearby place (like hotels). Admins approve suggestions
        before they appear. New amenities start unchecked for every rink.
      </p>
      <SuggestForm />
      {mine.length > 0 && (
        <section className="card space-y-2">
          <h2 className="h2">Your suggestions</h2>
          <ul className="divide-y divide-border text-sm">
            {mine.map((s) => (
              <li key={`${s.kind}-${s.name}`} className="flex justify-between gap-2 py-2">
                <span>
                  {s.name} <span className="text-muted">· {s.kind}</span>
                </span>
                <span className="badge capitalize">{s.status}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
