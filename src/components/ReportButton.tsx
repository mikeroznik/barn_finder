"use client";

import { useState, useTransition } from "react";
import { createReport } from "@/app/actions/moderation";
import type { FormState, ReportTarget } from "@/lib/types";
import { FormMessage } from "./ui";

/** "Report" link that expands into a short reason form. Hidden for signed-out visitors. */
export function ReportButton({ targetType, targetId, signedIn }: { targetType: ReportTarget; targetId: string; signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [state, setState] = useState<FormState>();
  const [pending, startTransition] = useTransition();

  if (!signedIn) return null;
  if (state?.message) return <FormMessage state={state} />;

  return open ? (
    <form
      className="mt-2 space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => setState(await createReport(targetType, targetId, reason)));
      }}
    >
      <label className="label" htmlFor={`report-${targetId}`}>
        What&apos;s wrong?
      </label>
      <textarea
        id={`report-${targetId}`}
        className="input"
        rows={2}
        maxLength={1000}
        required
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Wrong info, spam, inappropriate photo…"
      />
      <FormMessage state={state} />
      <div className="flex gap-2">
        <button className="btn-primary btn-sm" disabled={pending}>
          {pending ? "Sending…" : "Send report"}
        </button>
        <button type="button" className="btn-secondary btn-sm" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  ) : (
    <button type="button" className="text-xs font-medium text-muted underline-offset-2 hover:underline" onClick={() => setOpen(true)}>
      Report
    </button>
  );
}
