"use client";

import { Field, FormMessage, SubmitButton, useFormAction } from "@/components/ui";
import { suggest } from "./actions";

export function SuggestForm() {
  const { state, pending, onSubmit } = useFormAction(suggest);
  return (
    <form onSubmit={onSubmit} className="card space-y-4">
      <fieldset>
        <legend className="label">I&apos;m suggesting a new…</legend>
        <div className="flex flex-wrap gap-4">
          <label className="flex min-h-11 items-center gap-2">
            <input type="radio" name="kind" value="amenity" defaultChecked className="h-5 w-5" /> Rink amenity
          </label>
          <label className="flex min-h-11 items-center gap-2">
            <input type="radio" name="kind" value="place_category" className="h-5 w-5" /> Nearby place category
          </label>
        </div>
      </fieldset>
      <Field label="Name" name="name" required maxLength={60} placeholder="e.g. Heated viewing area, Gas station" />
      <FormMessage state={state} />
      <SubmitButton pending={pending} pendingText="Sending…">
        Send suggestion
      </SubmitButton>
    </form>
  );
}
