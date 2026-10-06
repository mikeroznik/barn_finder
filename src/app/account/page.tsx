import type { Metadata } from "next";
import Link from "next/link";
import { DisplayNameForm } from "@/app/(auth)/AuthForms";
import { logOut } from "@/app/(auth)/actions";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Your account" };

export default async function AccountPage(props: PageProps<"/account">) {
  const { welcome } = await props.searchParams;
  const user = await requireUser("/account");
  const supabase = await createClient();
  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, rink_id, updated_at, rinks(name)")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  return (
    <div className="mx-auto max-w-lg space-y-4">
      {welcome && (
        <p role="status" className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
          Your email is verified. Welcome to Barn Finder!
        </p>
      )}
      <h1 className="h1">Your account</h1>
      <section className="card space-y-4">
        <p className="text-sm">
          <span className="text-muted">Email:</span> {user.email}
          {user.isAdmin && <span className="badge ml-2">Admin</span>}
        </p>
        <DisplayNameForm current={user.displayName} />
      </section>

      <section className="card space-y-2">
        <h2 className="h2">Your reviews</h2>
        {reviews?.length ? (
          <ul className="divide-y divide-border text-sm">
            {reviews.map((r) => {
              const rink = r.rinks as unknown as { name: string } | null;
              return (
                <li key={r.id} className="flex justify-between gap-2 py-2">
                  <Link href={`/rinks/${r.rink_id}`} className="link">
                    {rink?.name ?? "Rink"}
                  </Link>
                  <span className="text-muted">{formatDate(r.updated_at)}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted">You haven&apos;t reviewed any rinks yet.</p>
        )}
      </section>

      <section className="card flex flex-wrap gap-2">
        <Link href="/account/password" className="btn-secondary btn-sm">
          Change password
        </Link>
        <form action={logOut}>
          <button className="btn-danger btn-sm">Log out</button>
        </form>
      </section>
    </div>
  );
}
