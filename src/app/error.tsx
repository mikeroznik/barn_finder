"use client";

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  // In production, server error messages are replaced with a generic one; the
  // digest matches the full error in the server (Vercel) logs.
  const hidden = !!error.digest;
  return (
    <div className="mx-auto max-w-md space-y-3 py-10 text-center">
      <h1 className="h1">Something went wrong</h1>
      <p className="text-sm text-muted">
        {hidden ? "The server hit an error while loading this page." : error.message || "An unexpected error occurred."}
      </p>
      {error.digest && (
        <p className="text-xs text-muted">
          Error ID: <code className="select-all">{error.digest}</code>
          <br />
          Site admins: search for this ID in the Vercel project&apos;s Logs.
        </p>
      )}
      <button type="button" className="btn-primary" onClick={() => retry()}>
        Try again
      </button>
    </div>
  );
}
