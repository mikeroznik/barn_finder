import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { setAdmin } from "../actions";
import { ActionButton } from "../ActionButton";

export const metadata: Metadata = { title: "Users" };

interface AdminUserRow {
  id: string;
  display_name: string;
  email: string;
  is_admin: boolean;
  created_at: string;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
}

export default async function UsersPage() {
  const me = await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_list_users");
  const users = (data ?? []) as AdminUserRow[];

  return (
    <div className="space-y-4">
      <h1 className="h1">Users ({users.length})</h1>
      {error && (
        <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          Couldn&apos;t load users: {error.message}. Did you run migration 20261006000002_admin_users.sql?
        </p>
      )}
      <ul className="space-y-2">
        {users.map((u) => (
          <li key={u.id} className="card flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium">
                {u.display_name} {u.is_admin && <span className="badge ml-1">Admin</span>}
                {!u.email_confirmed_at && <span className="badge ml-1">Unverified</span>}
              </p>
              <p className="truncate text-xs text-muted">
                {u.email} · joined {new Date(u.created_at).toLocaleDateString("en-US")}
                {u.last_sign_in_at && <> · last login {new Date(u.last_sign_in_at).toLocaleDateString("en-US")}</>}
              </p>
            </div>
            {u.id !== me.id &&
              (u.is_admin ? (
                <ActionButton action={setAdmin.bind(null, u.id, false)} confirmText={`Remove admin access from ${u.display_name}?`} className="btn-danger btn-sm">
                  Remove admin
                </ActionButton>
              ) : (
                <ActionButton
                  action={setAdmin.bind(null, u.id, true)}
                  confirmText={`Make ${u.display_name} an admin? They'll be able to edit and revert everything.`}
                >
                  Make admin
                </ActionButton>
              ))}
          </li>
        ))}
      </ul>
    </div>
  );
}
