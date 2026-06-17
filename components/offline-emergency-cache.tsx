"use client";

import { useEffect } from "react";
import type { CareRecipient, Contact, Medication, Visit } from "@/lib/types";

export function OfflineEmergencyCache({
  recipient,
  contacts,
  medications,
  visits
}: {
  recipient: CareRecipient;
  contacts: Contact[];
  medications: Medication[];
  visits: Visit[];
}) {
  useEffect(() => {
    const payload = {
      savedAt: new Date().toISOString(),
      recipient,
      contacts: contacts.slice(0, 5),
      medications: medications.slice(0, 12),
      visits: visits.slice(0, 5)
    };

    window.localStorage.setItem("homex-offline-emergency", JSON.stringify(payload));
  }, [recipient, contacts, medications, visits]);

  return null;
}
