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
