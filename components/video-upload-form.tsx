"use client";

import { useState, useTransition } from "react";

export function VideoUploadForm({ careRecipientId, disabled }: { careRecipientId: string; disabled?: boolean }) {
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="form"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);
        formData.set("careRecipientId", careRecipientId);
        setMessage("");

        startTransition(async () => {
          try {
            const file = formData.get("file");
            if (!(file instanceof File)) {
              setMessage("Choose a video file first.");
              return;
            }

            const preparation = await fetch("/api/care-videos/upload-url", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ careRecipientId, fileName: file.name, contentType: file.type })
            });
            const prepared = await preparation.json().catch(() => ({}));
            if (!preparation.ok) {
              setMessage(prepared.error || "Video upload could not start. Please try again.");
              return;
            }

            const upload = await fetch(prepared.signedUrl, {
              method: "PUT",
              headers: { "Content-Type": file.type || "video/mp4", "x-upsert": "false" },
              body: file
            });
            if (!upload.ok) {
              setMessage("Video upload could not finish. Please try again.");
              return;
            }

            const completion = await fetch("/api/care-videos/complete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                careRecipientId,
                title: formData.get("title"),
                category: formData.get("category"),
                description: formData.get("description") || undefined,
                storagePath: prepared.storagePath
              })
            });
            const completed = await completion.json().catch(() => ({}));
            if (!completion.ok) {
              setMessage(completed.error || "Video uploaded but could not be saved. Please try again.");
              return;
            }

            setMessage("Video uploaded. Refreshing...");
            window.location.reload();
          } catch {
            setMessage("Video upload could not reach the server. Please try again.");
          }
        });
      }}
    >
      <input name="title" placeholder="Safe transfer walkthrough" required disabled={disabled || isPending} />
      <input name="category" placeholder="Mobility" required disabled={disabled || isPending} />
      <textarea name="description" placeholder="When should the family or aide watch this?" disabled={disabled || isPending} />
      <input name="file" type="file" accept="video/*" required disabled={disabled || isPending} />
      <button className="button" type="submit" disabled={disabled || isPending}>
        {isPending ? "Uploading..." : "Upload caregiver video"}
      </button>
      {message && <p className="muted">{message}</p>}
    </form>
  );
}
