import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Check your email" };

export default async function CheckEmailPage(props: PageProps<"/check-email">) {
  const { email } = await props.searchParams;
  return (
    <div className="mx-auto max-w-sm space-y-4">
      <h1 className="h1">Check your email</h1>
      <div className="card space-y-3 text-sm">
        <p>
          We sent a verification link to <strong>{typeof email === "string" ? email : "your email"}</strong>. Click it to
          activate your account.
        </p>
        <p className="text-muted">Don&apos;t see it after a few minutes? Check spam, or try signing up again later.</p>
        <Link href="/login" className="btn-secondary w-full">
          Back to log in
        </Link>
      </div>
    </div>
  );
}
