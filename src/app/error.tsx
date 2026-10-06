"use client";

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="mx-auto max-w-md space-y-3 py-10 text-center">
      <h1 className="h1">Something went wrong</h1>
      <p className="text-sm text-muted">{error.message || "An unexpected error occurred."}</p>
      <button type="button" className="btn-primary" onClick={() => retry()}>
        Try again
      </button>
    </div>
  );
}
