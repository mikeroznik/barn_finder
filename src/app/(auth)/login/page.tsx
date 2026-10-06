import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, safeNext } from "@/lib/auth";
import { LogInForm } from "../AuthForms";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage(props: PageProps<"/login">) {
  const params = await props.searchParams;
  const next = safeNext(typeof params.next === "string" ? params.next : null);
  if (await getCurrentUser()) redirect(next);

  return (
    <div className="mx-auto max-w-sm space-y-4">
      <h1 className="h1">Log in</h1>
      <p className="text-sm text-muted">Browsing is open to everyone. Log in to add rinks, edit info, review and upload photos.</p>
      {params.error === "link" && (
        <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          That link is invalid or has expired. Log in, or request a new link.
        </p>
      )}
      <LogInForm next={next} />
    </div>
  );
}
