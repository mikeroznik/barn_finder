"use client";

import Link from "next/link";
import { AddressFields } from "@/components/AddressFields";
import { CheckboxGroup, Field, FormMessage, SubmitButton, TextArea, useFormAction } from "@/components/ui";
import type { Lists } from "@/lib/data";
import type { Rink } from "@/lib/types";
import { saveRink } from "./actions";

export function RinkForm({ rink, lists }: { rink?: Rink; lists: Lists }) {
  const { state, pending, onSubmit } = useFormAction(saveRink);
  // Inactive list entries stay visible only if this rink already uses them.
  const seating = lists.seating.filter((s) => s.is_active || rink?.seating_type_ids.includes(s.id));
  const parking = lists.parking.filter((p) => p.is_active || rink?.parking_type_ids.includes(p.id));

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {rink && <input type="hidden" name="id" value={rink.id} />}

      <section className="card space-y-4">
        <Field label="Rink name" name="name" required maxLength={150} defaultValue={rink?.name} />
        <AddressFields initial={rink} />
      </section>

      <section className="card space-y-4">
        <Field
          label="Sheets (pads) of ice"
          name="sheet_count"
          type="number"
          inputMode="numeric"
          min={0}
          max={50}
          defaultValue={rink?.sheet_count ?? ""}
          hint="Leave blank if you're not sure."
        />
      </section>

      <section className="card space-y-4">
        <CheckboxGroup legend="Seating" name="seating" options={seating} selected={rink?.seating_type_ids ?? []} />
        <TextArea label="Seating notes" name="seating_notes" maxLength={2000} defaultValue={rink?.seating_notes ?? ""} placeholder="e.g. Heated viewing area upstairs on Rink B" />
      </section>

      <section className="card space-y-4">
        <CheckboxGroup legend="Parking" name="parking" options={parking} selected={rink?.parking_type_ids ?? []} />
        <TextArea label="Parking notes" name="parking_notes" maxLength={2000} defaultValue={rink?.parking_notes ?? ""} placeholder="e.g. Overflow lot across the street fills up on tournament weekends" />
      </section>

      <section className="card space-y-2">
        <CheckboxGroup legend="Amenities" name="amenities" options={lists.amenities} selected={rink?.amenity_ids ?? []} />
        <p className="hint">
          Unchecked means the rink doesn&apos;t have it (or nobody has said yet).{" "}
          <Link href="/suggest" className="link">
            Suggest a new amenity
          </Link>
        </p>
      </section>

      <FormMessage state={state} />
      <div className="flex gap-2">
        <SubmitButton pending={pending}>{rink ? "Save changes" : "Add rink"}</SubmitButton>
        <Link href={rink ? `/rinks/${rink.id}` : "/"} className="btn-secondary">
          Cancel
        </Link>
      </div>
      <p className="hint">Changes go live right away. Admins review every edit and can undo it.</p>
    </form>
  );
}
