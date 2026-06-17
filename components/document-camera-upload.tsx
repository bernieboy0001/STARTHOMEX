"use client";

import { useState } from "react";

export function DocumentCameraUpload({ careRecipientId, disabled }: { careRecipientId: string; disabled?: boolean }) {
  const [status, setStatus] = useState("");

  async function upload(formData: FormData) {
    setStatus("Uploading...");
    const response = await fetch("/api/documents/upload", { method: "POST", body: formData });
    setStatus(response.ok ? "Uploaded. Refreshing..." : "Upload failed. Check your Supabase storage bucket.");
    if (response.ok) window.location.reload();
  }

  return (
    <form className="form" action={upload}>
      <input type="hidden" name="careRecipientId" value={careRecipientId} />
      <input name="title" placeholder="Document title" required disabled={disabled} />
      <input name="category" placeholder="Category" defaultValue="Scanned document" required disabled={disabled} />
      <input name="file" type="file" accept="image/*,.pdf" capture="environment" required disabled={disabled} />
      <button className="button" type="submit" disabled={disabled}>Scan or upload</button>
      {status && <p className="muted">{status}</p>}
    </form>
  );
}
