export type Role = "family_lead" | "family_member" | "home_aide" | "agency_coordinator" | "clinician";

export type CareRecipient = {
  id: string;
  full_name: string;
  recovery_status: string | null;
  fall_risk: string | null;
  primary_condition: string | null;
  emergency_summary: string | null;
};

export type Task = {
  id: string;
  title: string;
  owner_name: string | null;
  due_at: string | null;
  priority: "low" | "medium" | "high";
  completed_at: string | null;
  completed_by: string | null;
  completed_by_name: string | null;
};

export type CareNote = {
  id: string;
  author_name: string;
  body: string;
  note_type: string;
  created_at: string;
};

export type CareVideo = {
  id: string;
  title: string;
  category: string;
  description: string | null;
  embed_url: string | null;
  storage_path: string | null;
  playback_url?: string | null;
};

export type Medication = {
  id: string;
  name: string;
  dosage: string | null;
  schedule: string;
  instructions: string | null;
  prescribed_by: string | null;
  refill_due_at: string | null;
  active: boolean;
};

export type Visit = {
  id: string;
  title: string;
  starts_at: string | null;
  location: string | null;
  provider_name: string | null;
  preparation_notes: string | null;
};

export type Contact = {
  id: string;
  name: string;
  role: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
};

export type CareDocument = {
  id: string;
  title: string;
  category: string;
  external_url: string | null;
  notes: string | null;
  created_at: string;
};

export type CareMembership = {
  id: string;
  user_id: string;
  role: Role;
  created_at: string;
  email?: string | null;
  full_name?: string | null;
};

export type AuditEvent = {
  id: string;
  actor_name: string | null;
  action: string;
  entity: string;
  summary: string | null;
  created_at: string;
};
