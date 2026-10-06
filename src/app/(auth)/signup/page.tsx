import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SignUpForm } from "../AuthForms";

export const metadata: Metadata = { title: "Create an account" };

export default async function SignUpPage() {
  if (await getCurrentUser()) redirect("/account");
  return (
    <div className="mx-auto max-w-sm space-y-4">
      <h1 className="h1">Create an account</h1>
      <p className="text-sm text-muted">You only need an account to submit info, reviews and photos.</p>
      <SignUpForm />
    </div>
  );
}
