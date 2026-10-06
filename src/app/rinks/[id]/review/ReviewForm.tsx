"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { FormMessage, SubmitButton, TextArea, useFormAction } from "@/components/ui";
import type { RatingCategory, Review, ReviewRating } from "@/lib/types";
import { deleteReview, saveReview } from "./actions";

function StarInput({ category, initial }: { category: RatingCategory; initial?: number }) {
  const [value, setValue] = useState(initial ?? 0);
  const name = `rating_${category.id}`;
  return (
    <fieldset className="flex flex-wrap items-center justify-between gap-2">
      <legend className="sr-only">{category.name} rating</legend>
      <span aria-hidden className="text-sm font-medium">
        {category.is_other ? "Rating" : category.name}
      </span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="cursor-pointer">
            <input type="radio" name={name} value={n} checked={value === n} onChange={() => setValue(n)} className="peer sr-only" />
            <span
              className={`grid h-10 w-10 place-items-center rounded-lg text-2xl peer-focus-visible:outline peer-focus-visible:outline-2 ${
                n <= value ? "text-accent" : "text-border"
              }`}
            >
              ★<span className="sr-only">{n} stars</span>
            </span>
          </label>
        ))}
        <label className="ml-1 cursor-pointer text-xs font-medium text-muted underline">
          <input type="radio" name={name} value="" checked={value === 0} onChange={() => setValue(0)} className="sr-only" />
          {value === 0 ? "Not rated" : "Clear"}
        </label>
      </div>
    </fieldset>
  );
}

export function ReviewForm({
  rinkId,
  categories,
  review,
  ratings = [],
  returnTo,
}: {
  rinkId: string;
  categories: RatingCategory[];
  review?: Review;
  ratings?: ReviewRating[];
  returnTo?: string;
}) {
  const { state, pending, onSubmit } = useFormAction(saveReview);
  const [deleting, startDelete] = useTransition();
  const other = categories.find((c) => c.is_other);
  const otherRating = other && ratings.find((r) => r.category_id === other.id);
  const visible = categories.filter((c) => !c.is_other && (c.is_active || ratings.some((r) => r.category_id === c.id)));

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <input type="hidden" name="rink_id" value={rinkId} />
      {review && <input type="hidden" name="review_id" value={review.id} />}
      {returnTo && <input type="hidden" name="return_to" value={returnTo} />}

      <section className="card space-y-3">
        <h2 className="h2">Ratings</h2>
        <p className="hint">All optional. Rate only what you can speak to.</p>
        <div className="divide-y divide-border">
          {visible.map((c) => (
            <div key={c.id} className="py-2">
              <StarInput category={c} initial={ratings.find((r) => r.category_id === c.id)?.rating} />
            </div>
          ))}
          {other && (other.is_active || otherRating) && (
            <div className="space-y-2 py-2">
              <label htmlFor="other_label" className="label">
                Other: what are you rating?
              </label>
              <input id="other_label" name="other_label" className="input" maxLength={60} placeholder="e.g. Wi-Fi, heated lobby, pro shop prices" defaultValue={otherRating?.other_label ?? ""} />
              <StarInput category={other} initial={otherRating?.rating} />
            </div>
          )}
        </div>
      </section>

      <section className="card">
        <TextArea label="Your review" name="body" required rows={6} maxLength={5000} defaultValue={review?.body ?? ""} placeholder="Ice, locker rooms, where to sit, where to park, what to eat…" />
      </section>

      <FormMessage state={state} />
      <div className="flex flex-wrap gap-2">
        <SubmitButton pending={pending}>{review ? "Save review" : "Post review"}</SubmitButton>
        <Link href={returnTo ?? `/rinks/${rinkId}`} className="btn-secondary">
          Cancel
        </Link>
        {review && (
          <button
            type="button"
            className="btn-danger ml-auto"
            disabled={deleting}
            onClick={() => {
              if (confirm("Delete this review and its photos?")) startDelete(() => deleteReview(review.id, rinkId));
            }}
          >
            Delete review
          </button>
        )}
      </div>
    </form>
  );
}
