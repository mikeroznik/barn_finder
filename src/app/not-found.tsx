import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-sm space-y-3 py-10 text-center">
      <h1 className="h1">Not found</h1>
      <p className="text-muted">That page doesn&apos;t exist, or it&apos;s been removed.</p>
      <Link href="/" className="btn-primary">
        Back to rinks
      </Link>
    </div>
  );
}
