import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getLists } from "@/lib/data";
import { RinkForm } from "../RinkForm";

export const metadata: Metadata = { title: "Add a rink" };

export default async function NewRinkPage() {
  await requireUser("/rinks/new");
  const lists = await getLists();
  return (
    <div className="space-y-4">
      <h1 className="h1">Add a rink</h1>
      <p className="text-sm text-muted">Only the name and address are required. Fill in whatever else you know.</p>
      <RinkForm lists={lists} />
    </div>
  );
}
