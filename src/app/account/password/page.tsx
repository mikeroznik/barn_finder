import type { Metadata } from "next";
import Link from "next/link";
import { NewPasswordForm } from "@/app/(auth)/AuthForms";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Set a new password" };

export default async function PasswordPage() {
  await requireUser("/account/password");
  return (
    <div className="mx-auto max-w-sm space-y-4">
      <p>
        <Link href="/account" className="link text-sm">
          ← Account
        </Link>
      </p>
      <h1 className="h1">Set a new password</h1>
      <NewPasswordForm />
    </div>
  );
}
