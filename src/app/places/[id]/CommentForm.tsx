"use client";

import { useTransition } from "react";
import { FormMessage, SubmitButton, useFormAction } from "@/components/ui";
import type { PlaceComment } from "@/lib/types";
import { deleteComment, saveComment } from "../actions";

export function CommentForm({ placeId, comment }: { placeId: string; comment?: PlaceComment }) {
  const { state, pending, onSubmit } = useFormAction(saveComment);
  const [deleting, startDelete] = useTransition();

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <input type="hidden" name="place_id" value={placeId} />
      {comment && <input type="hidden" name="comment_id" value={comment.id} />}
      <label htmlFor="comment-body" className="label">
        {comment ? "Your comment" : "Add your comment"}
      </label>
      <textarea id="comment-body" name="body" className="input" rows={3} maxLength={3000} required defaultValue={comment?.body ?? ""} />
      <FormMessage state={state} />
      <div className="flex gap-2">
        <SubmitButton pending={pending} className="btn-primary btn-sm">
          {comment ? "Update comment" : "Post comment"}
        </SubmitButton>
        {comment && (
          <button
            type="button"
            className="btn-danger btn-sm"
            disabled={deleting}
            onClick={() => {
              if (confirm("Delete your comment?")) startDelete(() => deleteComment(comment.id, placeId));
            }}
          >
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
