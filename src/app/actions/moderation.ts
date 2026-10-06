"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ModerationStatus, ReportTarget } from "@/lib/types";

const MODERATED_TABLES = ["rinks", "places", "reviews", "place_comments", "photos"] as const;
export type ModeratedTable = (typeof MODERATED_TABLES)[number];

async function assertAdmin() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) throw new Error("Only admins can do that.");
}

function checkTable(table: string): asserts table is ModeratedTable {
  if (!(MODERATED_TABLES as readonly string[]).includes(table)) throw new Error("Unknown table.");
}

/** Admin: hide (disapprove) or restore a submission. */
export async function setStatus(table: string, id: string, status: ModerationStatus, path?: string) {
  await assertAdmin();
  checkTable(table);
  const supabase = await createClient();
  const { error } = await supabase.from(table).update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(path ?? "/", path ? "page" : "layout");
}

/** Admin: permanently delete a record (it can still be restored from the change history). */
export async function deleteRecord(table: string, id: string, path?: string) {
  await assertAdmin();
  checkTable(table);
  const supabase = await createClient();
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(path ?? "/", path ? "page" : "layout");
}

/** Any verified user: flag something for admin attention. */
export async function createReport(targetType: ReportTarget, targetId: string, reason: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Please log in to report content." };
  const trimmed = reason.trim();
  if (!trimmed) return { error: "Please describe the problem." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("reports")
    .insert({ target_type: targetType, target_id: targetId, reason: trimmed.slice(0, 1000), reported_by: user.id });
  if (error) return { error: error.message };
  return { message: "Thanks — an admin will take a look." };
}
