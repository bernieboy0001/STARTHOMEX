"use client";

import { useState } from "react";

export function MedicationCreateForm({ careRecipientId }: { careRecipientId: string }) {
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
    window.location.assign("/dashboard/medications?save=saved");
  }

  return <form className="form" onSubmit={submit}>
    <label>Medication name <input name="name" placeholder="e.g. Lisinopril" required disabled={saving} /></label>
    <label>Dosage <input name="dosage" placeholder="e.g. 10 mg" disabled={saving} /></label>
    <label>Schedule <input name="schedule" placeholder="e.g. Once every morning" required disabled={saving} /></label>
    <label>Prescribed by <input name="prescribedBy" placeholder="Clinician or practice" disabled={saving} /></label>
    <label>Refill due <input name="refillDueAt" type="date" disabled={saving} /></label>
    <label>Instructions <textarea name="instructions" placeholder="Food, timing, or safety notes" disabled={saving} /></label>
    <button className="button" type="submit" disabled={saving}>{saving ? "Saving..." : "Add medication"}</button>
    {message && <p className="muted">{message}</p>}
  </form>;
}
