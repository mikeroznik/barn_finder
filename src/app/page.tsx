import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { RinkSummary } from "@/lib/types";
import { RinkBrowser } from "./RinkBrowser";

export default async function Home(props: PageProps<"/">) {
  const params = await props.searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const view = params.view === "map" ? "map" : "list";

  // Production hides thrown error messages, so setup problems are rendered instead.
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return (
      <SetupProblem title="Supabase isn't configured">
        The environment variables <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>{" "}
        were not set when this deployment was built. Add them in Vercel → Settings → Environment Variables, then redeploy
        (Deployments → ⋯ → Redeploy).
      </SetupProblem>
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rinks")
    .select("id, name, street, city, region, postal_code, country_code, latitude, longitude, sheet_count")
    .eq("status", "live")
    .order("name");

  if (error) {
    console.error("Loading rinks failed:", error);
    return (
      <SetupProblem title="Couldn't load rinks">
        The database answered: “{error.message}”. If this mentions a missing table or schema, run the SQL files in the
        Supabase SQL Editor (see SETUP.md). If it mentions an API key or JWT, check the Supabase URL and publishable key in
        Vercel and redeploy.
      </SetupProblem>
    );
  }

  return <RinkBrowser rinks={(data ?? []) as RinkSummary[]} initialQuery={q} initialView={view} />;
}

function SetupProblem({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card mx-auto max-w-xl space-y-2 border-danger/40">
      <h1 className="h2 text-danger">{title}</h1>
      <p className="text-sm">{children}</p>
    </div>
  );
}
