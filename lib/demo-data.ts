import type { AuditEvent, CareDocument, CareMembership, CareNote, CareRecipient, CareVideo, Contact, Medication, Task, Visit } from "./types";

export const demoRecipient: CareRecipient = {
  id: "demo-recipient",
  full_name: "HOMEX Demo Care Circle",
  recovery_status: "Sample data shown because Supabase is not connected in this deployment",
  fall_risk: "Moderate",
  primary_condition: "General elder care",
  emergency_summary: "Escalate for chest pain, new confusion, fever, fall, missed medication, or sudden weakness."
};

export const demoTasks: Task[] = [
  { id: "t1", title: "Connect Supabase environment variables in Vercel", owner_name: "Project owner", due_at: new Date().toISOString(), priority: "high", completed_at: null, completed_by: null, completed_by_name: null },
  { id: "t2", title: "Run the HOMEX SQL upgrade files in Supabase", owner_name: "Project owner", due_at: new Date(Date.now() + 86400000).toISOString(), priority: "medium", completed_at: null, completed_by: null, completed_by_name: null },
  { id: "t3", title: "Redeploy after environment variables are saved", owner_name: "Project owner", due_at: null, priority: "low", completed_at: new Date().toISOString(), completed_by: "demo-user", completed_by_name: "Project owner" }
];

export const demoNotes: CareNote[] = [
  { id: "n1", author_name: "HOMEX", body: "This is sample data. Add Supabase variables in Vercel to show your real care circles.", note_type: "system", created_at: new Date().toISOString() },
  { id: "n2", author_name: "HOMEX", body: "After saving the variables, redeploy the Vercel project.", note_type: "system", created_at: new Date(Date.now() - 86400000).toISOString() }
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

export const demoMedications: Medication[] = [
  { id: "m1", name: "Lisinopril", dosage: "10mg", schedule: "Every morning", instructions: "Take after breakfast.", prescribed_by: "Dr. Cole", refill_due_at: new Date(Date.now() + 604800000).toISOString(), active: true },
  { id: "m2", name: "Vitamin D", dosage: "1000 IU", schedule: "Monday, Wednesday, Friday", instructions: "Take with food.", prescribed_by: null, refill_due_at: null, active: true }
];

export const demoVisits: Visit[] = [
  { id: "vst1", title: "Primary care follow-up", starts_at: new Date(Date.now() + 172800000).toISOString(), location: "City Clinic", provider_name: "Dr. Cole", preparation_notes: "Bring medication list and recent BP readings." }
];

export const demoContacts: Contact[] = [
  { id: "c1", name: "Project owner", role: "Setup lead", phone: null, email: "your-email@example.com", notes: "Replace demo mode by connecting Supabase." },
  { id: "c2", name: "Supabase project", role: "Database", phone: null, email: null, notes: "Use the project URL and anon key from Supabase settings." }
];

export const demoDocuments: CareDocument[] = [
  { id: "d1", title: "Medication list", category: "Medication", external_url: null, notes: "Updated this week.", created_at: new Date().toISOString() },
  { id: "d2", title: "Emergency care preferences", category: "Emergency", external_url: null, notes: "Keep visible for caregivers.", created_at: new Date().toISOString() }
];

export const demoMemberships: CareMembership[] = [
  { id: "cm1", user_id: "demo-user", role: "family_lead", created_at: new Date().toISOString() },
  { id: "cm2", user_id: "demo-aide", role: "agency_coordinator", created_at: new Date().toISOString() }
];

export const demoAuditEvents: AuditEvent[] = [
  { id: "a1", actor_name: "HOMEX", action: "created", entity: "demo", summary: "Loaded HOMEX demo data because Supabase variables are missing.", created_at: new Date().toISOString() },
  { id: "a2", actor_name: "HOMEX", action: "created", entity: "setup", summary: "Connect Supabase in Vercel and redeploy to see real data.", created_at: new Date(Date.now() - 3600000).toISOString() }
];
