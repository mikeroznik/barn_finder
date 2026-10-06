import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { SUPABASE_KEY, SUPABASE_URL } from "./supabase/env";
import { createClient } from "./supabase/server";

export interface CurrentUser {
  id: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
}

/** The signed-in (and therefore email-verified) user, or null. Deduped per request. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  await connection(); // always per-request, even when built without Supabase env vars
  if (!SUPABASE_URL || !SUPABASE_KEY) return null; // not configured yet (e.g. build without .env)
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, is_admin")
    .eq("id", claims.sub)
    .single();
  if (!profile) return null;

  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : "",
    displayName: profile.display_name,
    isAdmin: profile.is_admin,
  };
});

/** Redirects to login (returning to `nextPath` afterwards) when nobody is signed in. */
export async function requireUser(nextPath: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return user;
}

/** Admin pages 404 for everyone else. */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user?.isAdmin) notFound();
  return user;
}

/** Only allow same-site relative redirects. */
export function safeNext(next: string | null | undefined, fallback = "/"): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}
