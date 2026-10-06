"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser, safeNext } from "@/lib/auth";
import { text } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/lib/types";

async function siteOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function signUp(formData: FormData): Promise<FormState> {
  const displayName = text(formData, "display_name", 60);
  const email = text(formData, "email", 254);
  const password = text(formData, "password", 200);
  if (!displayName) return { error: "Please enter your name." };
  if (!email) return { error: "Please enter your email." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: `${await siteOrigin()}/auth/callback?next=/account`,
    },
  });
  if (error) return { error: error.message };
  redirect(`/check-email?email=${encodeURIComponent(email)}`);
}

export async function logIn(formData: FormData): Promise<FormState> {
  const email = text(formData, "email", 254);
  const password = text(formData, "password", 200);
  const next = safeNext(text(formData, "next"));
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.code === "email_not_confirmed") {
      return { error: "Please confirm your email first. Check your inbox for the verification link." };
    }
    return { error: "Email or password is incorrect." };
  }
  revalidatePath("/", "layout");
  redirect(next);
}

export async function logOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function requestPasswordReset(formData: FormData): Promise<FormState> {
  const email = text(formData, "email", 254);
  if (!email) return { error: "Please enter your email." };
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await siteOrigin()}/auth/callback?next=/account/password`,
  });
  if (error) return { error: error.message };
  return { message: "If that email has an account, a reset link is on its way." };
}

export async function updatePassword(formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Your reset link has expired. Request a new one." };
  const password = text(formData, "password", 200);
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== text(formData, "confirm", 200)) return { error: "Passwords don't match." };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  return { message: "Password updated." };
}

export async function updateDisplayName(formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please log in." };
  const displayName = text(formData, "display_name", 60);
  if (!displayName) return { error: "Name can't be empty." };
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ display_name: displayName }).eq("id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { message: "Name updated." };
}
