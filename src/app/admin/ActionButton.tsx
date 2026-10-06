"use client";

import { useTransition } from "react";

/** Button that runs a (bound) Server Action, with optional confirm and error alert. */
export function ActionButton({
  action,
  children,
  confirmText,
  className = "btn-secondary btn-sm",
}: {
  action: () => Promise<void>;
  children: React.ReactNode;
  confirmText?: string;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      className={className}
      disabled={pending}
      onClick={() => {
        if (confirmText && !confirm(confirmText)) return;
        startTransition(async () => {
          try {
            await action();
          } catch (e) {
            alert(e instanceof Error ? e.message : "Something went wrong.");
          }
        });
      }}
    >
      {pending ? "Working…" : children}
    </button>
  );
}
