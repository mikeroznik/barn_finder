"use client";

import Link from "next/link";
import { AddressFields } from "@/components/AddressFields";
import { Field, FormMessage, SubmitButton, TextArea, useFormAction } from "@/components/ui";
import type { Address, Place, SuggestableItem } from "@/lib/types";
import { savePlace } from "./actions";

export function PlaceForm({
  rinkId,
  place,
  categories,
  addressHint,
}: {
  rinkId: string;
  place?: Place;
  categories: SuggestableItem[];
  /** Pre-fills city/state/country from the rink for new places. */
  addressHint?: Partial<Address>;
}) {
  const { state, pending, onSubmit } = useFormAction(savePlace);

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <input type="hidden" name="rink_id" value={rinkId} />
      {place && <input type="hidden" name="id" value={place.id} />}

      <section className="card space-y-4">
        <Field label="Name" name="name" required maxLength={150} defaultValue={place?.name} />
        <div>
          <label htmlFor="category_id" className="label">
            Category<span className="text-danger"> *</span>
          </label>
          <select id="category_id" name="category_id" className="input" required defaultValue={place?.category_id ?? ""}>
            <option value="" disabled>
              Choose…
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <p className="hint">
            Not listed?{" "}
            <Link href="/suggest" className="link">
              Suggest a category
            </Link>
          </p>
        </div>
        <AddressFields initial={place ?? addressHint} />
      </section>

      <section className="card">
        <TextArea
          label="Write-up (optional)"
          name="description"
          rows={5}
          maxLength={5000}
          defaultValue={place?.description ?? ""}
          hint="A shared description anyone can improve. Personal opinions fit better in a comment."
        />
      </section>

      <FormMessage state={state} />
      <div className="flex gap-2">
        <SubmitButton pending={pending}>{place ? "Save changes" : "Add place"}</SubmitButton>
        <Link href={place ? `/places/${place.id}` : `/rinks/${rinkId}`} className="btn-secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}
