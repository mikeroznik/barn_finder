import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_KEY, SUPABASE_URL, assertSupabaseEnv } from "./env";

/** Supabase client for Client Components (photo uploads). */
export function createClient() {
  assertSupabaseEnv();
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
}
