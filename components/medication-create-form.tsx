"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function MedicationCreateForm({ careRecipientId }: { careRecipientId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/medications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        careRecipientId,
        name: form.get("name"), dosage: form.get("dosage") || undefined,
        schedule: form.get("schedule"), instructions: form.get("instructions") || undefined,
        prescribedBy: form.get("prescribedBy") || undefined, refillDueAt: form.get("refillDueAt") || undefined
      })
    }).catch(() => null);
    const payload = response ? await response.json().catch(() => ({})) : {};
    setSaving(false);
    if (!response?.ok) return setMessage(payload.error || "Medication could not be saved. Please try again.");
    event.currentTarget.reset();
    setMessage("Medication saved.");
    router.refresh();
  }

  return <form className="form" onSubmit={submit}>
    <input name="name" placeholder="Medication name" required disabled={saving} />
    <input name="dosage" placeholder="Dosage" disabled={saving} />
    <input name="schedule" placeholder="Schedule" required disabled={saving} />
    <input name="prescribedBy" placeholder="Prescribed by" disabled={saving} />
    <input name="refillDueAt" type="date" disabled={saving} />
    <textarea name="instructions" placeholder="Instructions" disabled={saving} />
    <button className="button" type="submit" disabled={saving}>{saving ? "Saving..." : "Add medication"}</button>
    {message && <p className="muted">{message}</p>}
  </form>;
}
