"use client";

import { useState } from "react";

export function TaskCreateForm({ careRecipientId }: { careRecipientId: string }) {
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        careRecipientId,
        title: form.get("title"),
        ownerName: form.get("ownerName"),
        dueAt: form.get("dueAt") || undefined,
        priority: form.get("priority")
      })
    }).catch(() => null);
    const payload = response ? await response.json().catch(() => ({})) : {};
    setSaving(false);
    if (!response?.ok) return setMessage(payload.error || "Task could not be saved. Please try again.");
    window.location.assign("/dashboard/tasks?save=saved");
  }

  return <form className="form" onSubmit={submit}>
    <input name="title" placeholder="Call pharmacy about refill" required disabled={saving} />
    <input name="ownerName" placeholder="Owner name" required disabled={saving} />
    <input name="dueAt" type="datetime-local" disabled={saving} />
    <select name="priority" defaultValue="medium" disabled={saving}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select>
    <button className="button" type="submit" disabled={saving}>{saving ? "Saving..." : "Create task"}</button>
    {message && <p className="muted">{message}</p>}
  </form>;
}
