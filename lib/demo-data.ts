import type { CareNote, CareRecipient, CareVideo, Task } from "./types";

export const demoRecipient: CareRecipient = {
  id: "demo-recipient",
  full_name: "Evelyn Carter",
  recovery_status: "Day 6 after hip surgery discharge",
  fall_risk: "Moderate",
  primary_condition: "Hip fracture repair",
  emergency_summary: "Use walker for every transfer. Escalate for chest pain, new confusion, fever, fall, or severe wound pain."
};

export const demoTasks: Task[] = [
  { id: "t1", title: "Call insurance about home PT authorization", owner_name: "Maya", due_at: new Date().toISOString(), priority: "high", completed_at: null },
  { id: "t2", title: "Pick up Lisinopril refill", owner_name: "Andre", due_at: new Date(Date.now() + 86400000).toISOString(), priority: "medium", completed_at: null },
  { id: "t3", title: "Upload discharge instructions", owner_name: "Maya", due_at: null, priority: "low", completed_at: new Date().toISOString() }
];

export const demoNotes: CareNote[] = [
  { id: "n1", author_name: "Home aide", body: "Ate breakfast and walked to the kitchen with walker. Mild dizziness after standing.", note_type: "shift", created_at: new Date().toISOString() },
  { id: "n2", author_name: "Andre", body: "Will pick up refill tomorrow morning and bring low-sodium soup.", note_type: "family", created_at: new Date(Date.now() - 86400000).toISOString() }
];

export const demoVideos: CareVideo[] = [
  {
    id: "v1",
    title: "Safe chair-to-walker transfer",
    category: "Mobility",
    description: "Required watch before family-assisted transfers.",
    embed_url: "https://www.youtube-nocookie.com/embed/OH7Vb5q2A3c",
    storage_path: null
  },
  {
    id: "v2",
    title: "Medication routine checklist",
    category: "Medication",
    description: "Agency-owned slot for a custom caregiver instruction video.",
    embed_url: null,
    storage_path: null
  }
];
