import type { Metadata } from "next";
import { ForgotPasswordForm } from "../AuthForms";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-sm space-y-4">
      <h1 className="h1">Reset your password</h1>
      <ForgotPasswordForm />
    </div>
  );
}
