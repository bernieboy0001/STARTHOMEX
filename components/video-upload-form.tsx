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
            const response = await fetch("/api/care-videos/upload", {
              method: "POST",
              body: formData
            });
            const payload = await response.json().catch(() => ({}));

            if (!response.ok) {
              setMessage(payload.error || "Video upload could not finish. Please try again.");
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
