"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ReportStatus, SuggestionStatus } from "@/lib/types";

async function adminClient() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) throw new Error("Only admins can do that.");
  return { user, supabase: await createClient() };
}

function fail(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function revertChange(changeId: number) {
  const { supabase } = await adminClient();
  fail((await supabase.rpc("revert_change", { p_change_id: changeId })).error);
  revalidatePath("/", "layout");
}

export async function setReportStatus(reportId: string, status: ReportStatus) {
  const { supabase, user } = await adminClient();
  const resolved = status === "open" ? { resolved_by: null, resolved_at: null } : { resolved_by: user.id, resolved_at: new Date().toISOString() };
  fail((await supabase.from("reports").update({ status, ...resolved }).eq("id", reportId)).error);
  revalidatePath("/admin", "layout");
}

const SUGGESTABLE = ["amenities", "place_categories"] as const;
const FIXED = ["seating_types", "parking_types", "rating_categories"] as const;
const LIST_TABLES = [...SUGGESTABLE, ...FIXED] as const;
type ListTable = (typeof LIST_TABLES)[number];

function checkList(table: string): asserts table is ListTable {
  if (!(LIST_TABLES as readonly string[]).includes(table)) throw new Error("Unknown list.");
}

export async function setSuggestionStatus(table: string, id: string, status: SuggestionStatus) {
  checkList(table);
  const { supabase } = await adminClient();
  fail((await supabase.from(table).update({ status }).eq("id", id)).error);
  revalidatePath("/", "layout");
}

export async function addListItem(table: string, name: string) {
  checkList(table);
  const trimmed = name.trim().slice(0, 60);
  if (!trimmed) throw new Error("Enter a name.");
  const { supabase } = await adminClient();
  const { data: last } = await supabase.from(table).select("sort_order").order("sort_order", { ascending: false }).limit(1);
  const sort_order = ((last?.[0]?.sort_order as number | undefined) ?? 0) + 1;
  const extra = (SUGGESTABLE as readonly string[]).includes(table) ? { status: "approved" } : {};
  const { error } = await supabase.from(table).insert({ name: trimmed, sort_order, ...extra });
  if (error) throw new Error(error.code === "23505" ? `“${trimmed}” already exists.` : error.message);
  revalidatePath("/", "layout");
}

export async function updateListItem(
  table: string,
  id: string,
  patch: { name?: string; sort_order?: number; is_active?: boolean },
) {
  checkList(table);
  const { supabase } = await adminClient();
  const clean: Record<string, unknown> = {};
  if (patch.name !== undefined) {
    const n = patch.name.trim().slice(0, 60);
    if (!n) throw new Error("Name can't be empty.");
    clean.name = n;
  }
  if (patch.sort_order !== undefined && Number.isFinite(patch.sort_order)) clean.sort_order = Math.round(patch.sort_order);
  if (patch.is_active !== undefined && (FIXED as readonly string[]).includes(table)) clean.is_active = patch.is_active;
  const { error } = await supabase.from(table).update(clean).eq("id", id);
  if (error) throw new Error(error.code === "23505" ? "That name is already used." : error.message);
  revalidatePath("/", "layout");
}

export async function deleteListItem(table: string, id: string) {
  checkList(table);
  const { supabase } = await adminClient();
  // Rinks reference these by id inside array columns (no foreign key), so check usage first.
  const arrayColumn = { seating_types: "seating_type_ids", parking_types: "parking_type_ids", amenities: "amenity_ids" }[
    table as string
  ];
  if (arrayColumn) {
    const { count } = await supabase.from("rinks").select("id", { count: "exact", head: true }).contains(arrayColumn, [id]);
    if (count) throw new Error(`It's used by ${count} rink(s). Deactivate or reject it instead so existing data keeps working.`);
  }
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) {
    throw new Error(
      error.code === "23503" ? "It's still in use. Deactivate or reject it instead so existing data keeps working." : error.message,
    );
  }
  revalidatePath("/", "layout");
}

export async function setAdmin(userId: string, isAdmin: boolean) {
  const { supabase, user } = await adminClient();
  if (userId === user.id && !isAdmin) throw new Error("You can't remove your own admin access.");
  fail((await supabase.from("profiles").update({ is_admin: isAdmin }).eq("id", userId)).error);
  revalidatePath("/admin/users");
}
