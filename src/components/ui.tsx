"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useUnits } from "./UnitsProvider";
import { formatDistance } from "@/lib/geo";
import type { FormState } from "@/lib/types";

/**
 * Submits a form to a Server Action without React's automatic form reset,
 * so the user's input survives a validation error.
 */
export function useFormAction(action: (formData: FormData) => Promise<FormState | void>) {
  const [state, setState] = useState<FormState>();
  const [pending, startTransition] = useTransition();
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await action(formData);
      setState(result ?? undefined);
    });
  }
  return { state, pending, onSubmit };
}

export function SubmitButton({
  children,
  pending,
  pendingText = "Saving…",
  className = "btn-primary",
}: {
  children: React.ReactNode;
  pending: boolean;
  pendingText?: string;
  className?: string;
}) {
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? pendingText : children}
    </button>
  );
}

export function FormMessage({ state }: { state: FormState | undefined }) {
  if (!state?.error && !state?.message) return null;
  return (
    <p
      role={state.error ? "alert" : "status"}
      className={`rounded-lg px-3 py-2 text-sm ${state.error ? "bg-danger/10 text-danger" : "bg-success/10 text-success"}`}
    >
      {state.error ?? state.message}
    </p>
  );
}

export function Distance({ km }: { km: number }) {
  const { units } = useUnits();
  return <>{formatDistance(km, units)}</>;
}

export function Field({
  label,
  name,
  hint,
  required,
  ...props
}: { label: string; name: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={name} className="label">
        {label}
        {required && <span className="text-danger"> *</span>}
      </label>
      <input id={name} name={name} className="input" required={required} {...props} />
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}

export function TextArea({
  label,
  name,
  hint,
  required,
  ...props
}: { label: string; name: string; hint?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <label htmlFor={name} className="label">
        {label}
        {required && <span className="text-danger"> *</span>}
      </label>
      <textarea id={name} name={name} className="input" rows={3} required={required} {...props} />
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}

export function CheckboxGroup({
  legend,
  name,
  options,
  selected,
}: {
  legend: string;
  name: string;
  options: { id: string; name: string }[];
  selected: string[];
}) {
  return (
    <fieldset>
      <legend className="label">{legend}</legend>
      <div className="grid gap-1 sm:grid-cols-2">
        {options.map((o) => (
          <label key={o.id} className="flex min-h-11 items-center gap-3 rounded-lg px-2 hover:bg-surface-2">
            <input type="checkbox" name={name} value={o.id} defaultChecked={selected.includes(o.id)} className="h-5 w-5 accent-[var(--primary)]" />
            <span>{o.name}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
