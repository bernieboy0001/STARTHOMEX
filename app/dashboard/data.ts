import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  demoAuditEvents,
  demoContacts,
  demoDocuments,
  demoMedications,
  demoMemberships,
  demoNotes,
  demoRecipient,
  demoTasks,
  demoVideos,
  demoVisits
} from "@/lib/demo-data";
import type { AuditEvent, CareDocument, CareMembership, CareNote, CareRecipient, CareVideo, Contact, Medication, Reminder, Task, Visit } from "@/lib/types";

export type Invite = {
  token: string;
  role: string;
  invited_email: string | null;
  accepted_at: string | null;
  revoked_at: string | null;
};

export type DashboardData = {
  recipients: CareRecipient[];
  recipient: CareRecipient;
  tasks: Task[];
  notes: CareNote[];
  videos: CareVideo[];
  invites: Invite[];
  medications: Medication[];
  visits: Visit[];
  reminders: Reminder[];
  contacts: Contact[];
  documents: CareDocument[];
  memberships: CareMembership[];
  activity: AuditEvent[];
  inviteError: string | null;
  productError: string | null;
  userEmail: string | null;
  demo: boolean;
};

export function formatDate(value: string | null) {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

export async function loadDashboard(): Promise<DashboardData> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return {
      recipients: [demoRecipient],
      recipient: demoRecipient,
      tasks: demoTasks,
      notes: demoNotes,
      videos: demoVideos,
      invites: [],
      medications: demoMedications,
      visits: demoVisits,
      reminders: [],
      contacts: demoContacts,
      documents: demoDocuments,
      memberships: demoMemberships,
      activity: demoAuditEvents,
      inviteError: null,
      productError: null,
      userEmail: null,
      demo: true
    };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/sign-in");

  const cookieStore = await cookies();
  const selectedRecipientId = cookieStore.get("homex-care-recipient-id")?.value;
  const { data: recipientsData } = await supabase.from("care_recipients").select("*").order("created_at", { ascending: false });
  const recipients = (recipientsData || []) as CareRecipient[];
  const recipient = recipients.find(item => item.id === selectedRecipientId) || recipients[0];
  if (!recipient) redirect("/onboarding");

  const [
    { data: tasks },
    { data: notes },
    { data: videos },
    invitesResult,
    medicationsResult,
    visitsResult,
    remindersResult,
    contactsResult,
    documentsResult
  ] = await Promise.all([
    supabase.from("tasks").select("*").eq("care_recipient_id", recipient.id).order("created_at", { ascending: false }),
    supabase.from("care_notes").select("*").eq("care_recipient_id", recipient.id).order("created_at", { ascending: false }).limit(8),
    supabase.from("caregiver_videos").select("*").eq("care_recipient_id", recipient.id).order("created_at", { ascending: false }),
    supabase.from("care_circle_invites").select("token, role, invited_email, accepted_at, revoked_at, expires_at, created_at").eq("care_recipient_id", recipient.id).order("created_at", { ascending: false }).limit(5),
    supabase.from("medications").select("*").eq("care_recipient_id", recipient.id).eq("active", true).order("name"),
    supabase.from("visits").select("*").eq("care_recipient_id", recipient.id).order("starts_at", { ascending: true }).limit(8),
    supabase.from("reminders").select("*").eq("care_recipient_id", recipient.id).is("completed_at", null).order("remind_at", { ascending: true }).limit(12),
    supabase.from("contacts").select("*").eq("care_recipient_id", recipient.id).order("role"),
    supabase.from("documents").select("id, title, category, external_url, notes, created_at").eq("care_recipient_id", recipient.id).order("created_at", { ascending: false }).limit(8)
  ]);

  const admin = createAdminClient();
  const [{ data: memberships }, { data: activity }, authUsersResult] = await Promise.all([
    admin.from("care_memberships").select("id, user_id, role, created_at").eq("care_recipient_id", recipient.id).order("created_at", { ascending: false }),
    admin.from("audit_events").select("id, actor_name, action, entity, summary, created_at").eq("care_recipient_id", recipient.id).order("created_at", { ascending: false }).limit(10),
    admin.auth.admin.listUsers({ page: 1, perPage: 200 })
  ]);

  const usersById = new Map((authUsersResult.data?.users || []).map(user => [
    user.id,
    {
      email: user.email || null,
      full_name: (user.user_metadata?.full_name as string | undefined) || null
    }
  ]));
  const membershipsWithUsers = (memberships || []).map(member => ({
    ...member,
    email: usersById.get(member.user_id)?.email || null,
    full_name: usersById.get(member.user_id)?.full_name || null
  }));

  const videosWithPlayback = await Promise.all(
    ((videos || []) as CareVideo[]).map(async video => {
      if (!video.storage_path) return video;
      const { data } = await supabase.storage.from("care-files").createSignedUrl(video.storage_path, 60 * 20);
      return { ...video, playback_url: data?.signedUrl || null };
    })
  );

  const productError = [medicationsResult, visitsResult, remindersResult, contactsResult, documentsResult]
    .map(result => result.error?.message)
    .find(Boolean) || null;

  return {
    recipients,
    recipient,
    tasks: (tasks || []) as Task[],
    notes: (notes || []) as CareNote[],
    videos: videosWithPlayback,
    invites: (invitesResult.error ? [] : invitesResult.data || []) as Invite[],
    medications: (medicationsResult.error ? [] : medicationsResult.data || []) as Medication[],
    visits: (visitsResult.error ? [] : visitsResult.data || []) as Visit[],
    reminders: (remindersResult.error ? [] : remindersResult.data || []) as Reminder[],
    contacts: (contactsResult.error ? [] : contactsResult.data || []) as Contact[],
    documents: (documentsResult.error ? [] : documentsResult.data || []) as CareDocument[],
    memberships: membershipsWithUsers as CareMembership[],
    activity: (activity || []) as AuditEvent[],
    inviteError: invitesResult.error?.message || null,
    productError,
    userEmail: userData.user.email || null,
    demo: false
  };
}
