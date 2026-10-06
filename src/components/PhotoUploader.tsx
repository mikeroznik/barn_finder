"use client";

import { useRef, useState } from "react";
import { addPhoto, type PhotoTarget } from "@/app/actions/photos";
import { PHOTO_BUCKET, resizeImage } from "@/lib/photos";
import { createClient } from "@/lib/supabase/client";

/** Pick a photo → resize in the browser → upload to storage → record it. */
export function PhotoUploader({
  userId,
  target,
  path,
  label = "Add a photo",
}: {
  userId: string;
  target: PhotoTarget;
  path: string;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload() {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const blob = await resizeImage(file);
      const storagePath = `${userId}/${crypto.randomUUID()}.jpg`;
      const supabase = createClient();
      const { error: upErr } = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(storagePath, blob, { contentType: "image/jpeg", upsert: false });
      if (upErr) throw new Error(upErr.message);
      const result = await addPhoto(storagePath, target, caption, path);
      if (result.error) throw new Error(result.error);
      setFile(null);
      setCaption("");
      if (inputRef.current) inputRef.current.value = "";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="btn-secondary btn-sm cursor-pointer">
        {file ? "Change photo" : label}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </label>
      {file && (
        <div className="space-y-2">
          <p className="text-xs text-muted">{file.name}</p>
          <input
            className="input"
            placeholder="Caption (optional)"
            maxLength={200}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
          <button type="button" className="btn-primary btn-sm" onClick={upload} disabled={busy}>
            {busy ? "Uploading…" : "Upload photo"}
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
