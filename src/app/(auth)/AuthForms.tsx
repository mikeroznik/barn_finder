"use client";

import Link from "next/link";
import { Field, FormMessage, SubmitButton, useFormAction } from "@/components/ui";
import { logIn, requestPasswordReset, signUp, updateDisplayName, updatePassword } from "./actions";

export function SignUpForm() {
  const { state, pending, onSubmit } = useFormAction(signUp);
  return (
    <form onSubmit={onSubmit} className="card space-y-4">
      <Field label="Your name" name="display_name" required maxLength={60} autoComplete="nickname" hint="Shown publicly on your reviews and edits." />
      <Field label="Email" name="email" type="email" required autoComplete="email" hint="Never shown publicly. We'll send a verification link." />
      <Field label="Password" name="password" type="password" required minLength={8} autoComplete="new-password" hint="At least 8 characters." />
      <FormMessage state={state} />
      <SubmitButton pending={pending} pendingText="Creating account…" className="btn-primary w-full">
        Create account
      </SubmitButton>
      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="link">
          Log in
        </Link>
      </p>
    </form>
  );
}

export function LogInForm({ next }: { next: string }) {
  const { state, pending, onSubmit } = useFormAction(logIn);
  return (
    <form onSubmit={onSubmit} className="card space-y-4">
      <input type="hidden" name="next" value={next} />
      <Field label="Email" name="email" type="email" required autoComplete="email" />
      <Field label="Password" name="password" type="password" required autoComplete="current-password" />
      <FormMessage state={state} />
      <SubmitButton pending={pending} pendingText="Logging in…" className="btn-primary w-full">
        Log in
      </SubmitButton>
      <div className="flex justify-between text-sm">
        <Link href="/forgot-password" className="link">
          Forgot password?
        </Link>
        <Link href={`/signup`} className="link">
          Create an account
        </Link>
      </div>
    </form>
  );
}

export function ForgotPasswordForm() {
  const { state, pending, onSubmit } = useFormAction(requestPasswordReset);
  return (
    <form onSubmit={onSubmit} className="card space-y-4">
      <Field label="Email" name="email" type="email" required autoComplete="email" />
      <FormMessage state={state} />
      <SubmitButton pending={pending} pendingText="Sending…" className="btn-primary w-full">
        Email me a reset link
      </SubmitButton>
    </form>
  );
}

export function NewPasswordForm() {
  const { state, pending, onSubmit } = useFormAction(updatePassword);
  return (
    <form onSubmit={onSubmit} className="card space-y-4">
      <Field label="New password" name="password" type="password" required minLength={8} autoComplete="new-password" />
      <Field label="Confirm new password" name="confirm" type="password" required minLength={8} autoComplete="new-password" />
      <FormMessage state={state} />
      <SubmitButton pending={pending} className="btn-primary w-full">
        Set password
      </SubmitButton>
    </form>
  );
}

export function DisplayNameForm({ current }: { current: string }) {
  const { state, pending, onSubmit } = useFormAction(updateDisplayName);
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Field label="Display name" name="display_name" required maxLength={60} defaultValue={current} />
      <FormMessage state={state} />
      <SubmitButton pending={pending} className="btn-secondary btn-sm">
        Save name
      </SubmitButton>
    </form>
  );
}
