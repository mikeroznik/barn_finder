import { createClient } from "@/lib/supabase/server";
import type { RinkSummary } from "@/lib/types";
import { RinkBrowser } from "./RinkBrowser";

export default async function Home(props: PageProps<"/">) {
  const params = await props.searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const view = params.view === "map" ? "map" : "list";

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rinks")
    .select("id, name, street, city, region, postal_code, country_code, latitude, longitude, sheet_count")
    .eq("status", "live")
    .order("name");

  if (error) throw new Error(`Could not load rinks: ${error.message}`);

  return <RinkBrowser rinks={(data ?? []) as RinkSummary[]} initialQuery={q} initialView={view} />;
}
