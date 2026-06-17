"use client";

import { useEffect } from "react";
import type { AuditEvent, CareDocument, CareNote, Contact, Medication, Reminder, Task, Visit } from "@/lib/types";

type Snapshot = {
  recipient: { full_name: string; emergency_summary: string | null };
  tasks: Task[];
  medications: Medication[];
  visits: Visit[];
  reminders: Reminder[];
  contacts: Contact[];
  documents: CareDocument[];
  notes: CareNote[];
  activity: AuditEvent[];
};

export function OfflineDashboardCache({ snapshot }: { snapshot: Snapshot }) {
  useEffect(() => {
    try {
      localStorage.setItem("homex-offline-dashboard", JSON.stringify({ ...snapshot, savedAt: new Date().toISOString() }));
    } catch {}
  }, [snapshot]);

  return null;
}
