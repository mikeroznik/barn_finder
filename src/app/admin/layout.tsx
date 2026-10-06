import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "./AdminNav";
import { getAdminCounts } from "./counts";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin · Barn Finder" } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  const counts = await getAdminCounts();
  return (
    <div className="space-y-5">
      <AdminNav counts={counts} />
      {children}
    </div>
  );
}
