import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, ClipboardList, FileText, FileVideo, HeartPulse, Pill, ShieldCheck, UsersRound } from "lucide-react";
import { VideoUploadForm } from "@/components/video-upload-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { TaskCompletionRow } from "@/components/task-completion-row";
import { createContact, createDocument, createMedication, createNote, createTask, createVideo, createVisit } from "./actions";
import { createInviteLink } from "./invite-actions";
import { inviteUrl } from "@/lib/invites";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
import type { AuditEvent, CareDocument, CareMembership, CareNote, CareRecipient, CareVideo, Contact, Medication, Task, Visit } from "@/lib/types";

type Invite = {
  token: string;
  role: string;
  invited_email: string | null;
  accepted_at: string | null;
  revoked_at: string | null;
};

async function loadDashboard() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return {
      recipient: demoRecipient,
      tasks: demoTasks,
      notes: demoNotes,
      videos: demoVideos,
      invites: [] as Invite[],
      medications: demoMedications,
      visits: demoVisits,
      contacts: demoContacts,
      documents: demoDocuments,
      memberships: demoMemberships,
      activity: demoAuditEvents,
      inviteError: null as string | null,
      productError: null as string | null,
      userEmail: null as string | null,
      demo: true
    };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/sign-in");

  const { data: recipients } = await supabase.from("care_recipients").select("*").limit(1);
  const recipient = recipients?.[0] as CareRecipient | undefined;
  if (!recipient) redirect("/onboarding");

  const [
    { data: tasks },
    { data: notes },
    { data: videos },
    invitesResult,
    medicationsResult,
    visitsResult,
    contactsResult,
    documentsResult
  ] = await Promise.all([
    supabase.from("tasks").select("*").eq("care_recipient_id", recipient.id).order("created_at", { ascending: false }),
    supabase.from("care_notes").select("*").eq("care_recipient_id", recipient.id).order("created_at", { ascending: false }).limit(8),
    supabase.from("caregiver_videos").select("*").eq("care_recipient_id", recipient.id).order("created_at", { ascending: false }),
    supabase.from("care_circle_invites").select("token, role, invited_email, accepted_at, revoked_at, expires_at, created_at").eq("care_recipient_id", recipient.id).order("created_at", { ascending: false }).limit(5),
    supabase.from("medications").select("*").eq("care_recipient_id", recipient.id).eq("active", true).order("name"),
    supabase.from("visits").select("*").eq("care_recipient_id", recipient.id).order("starts_at", { ascending: true }).limit(8),
    supabase.from("contacts").select("*").eq("care_recipient_id", recipient.id).order("role"),
    supabase.from("documents").select("id, title, category, external_url, notes, created_at").eq("care_recipient_id", recipient.id).order("created_at", { ascending: false }).limit(8)
  ]);

  const admin = createAdminClient();
  const [{ data: memberships }, { data: activity }] = await Promise.all([
    admin.from("care_memberships").select("id, user_id, role, created_at").eq("care_recipient_id", recipient.id).order("created_at", { ascending: false }),
    admin.from("audit_events").select("id, actor_name, action, entity, summary, created_at").eq("care_recipient_id", recipient.id).order("created_at", { ascending: false }).limit(10)
  ]);

  const videosWithPlayback = await Promise.all(
    ((videos || []) as CareVideo[]).map(async video => {
      if (!video.storage_path) return video;
      const { data } = await supabase.storage.from("care-files").createSignedUrl(video.storage_path, 60 * 20);
      return { ...video, playback_url: data?.signedUrl || null };
    })
  );

  const productError = [medicationsResult, visitsResult, contactsResult, documentsResult]
    .map(result => result.error?.message)
    .find(Boolean) || null;

  return {
    recipient,
    tasks: (tasks || []) as Task[],
    notes: (notes || []) as CareNote[],
    videos: videosWithPlayback,
    invites: (invitesResult.error ? [] : invitesResult.data || []) as Invite[],
    medications: (medicationsResult.error ? [] : medicationsResult.data || []) as Medication[],
    visits: (visitsResult.error ? [] : visitsResult.data || []) as Visit[],
    contacts: (contactsResult.error ? [] : contactsResult.data || []) as Contact[],
    documents: (documentsResult.error ? [] : documentsResult.data || []) as CareDocument[],
    memberships: (memberships || []) as CareMembership[],
    activity: (activity || []) as AuditEvent[],
    inviteError: invitesResult.error?.message || null,
    productError,
    userEmail: userData.user.email || null,
    demo: false
  };
}

function formatDate(value: string | null) {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function videoFrame(video: CareVideo) {
  if (video.embed_url) return <iframe src={video.embed_url} title={video.title} allowFullScreen loading="lazy" />;
  if (video.playback_url) return <video src={video.playback_url} controls preload="metadata" />;
  return null;
}

export default async function DashboardPage({ searchParams }: { searchParams?: Promise<{ error?: string; invite?: string }> }) {
  const query = await searchParams;
  const data = await loadDashboard();
  const { recipient, tasks, notes, videos, invites, medications, visits, contacts, documents, memberships, activity, inviteError, productError, userEmail, demo } = data;
  const openTasks = tasks.filter(task => !task.completed_at);
  const careRecipientId = demo ? "00000000-0000-0000-0000-000000000000" : recipient.id;
  const latestInviteUrl = query?.invite ? inviteUrl(query.invite) : null;

  return (
    <div className="shell">
      <aside className="rail">
        <Link href="/" className="brand">
          <img className="brand-logo" src="/homex-logo.png" alt="HOMEX" />
          <span><strong>HOMEX</strong><span>Care at home</span></span>
        </Link>
        <ThemeToggle />
        <nav className="nav">
          <a href="#overview">Overview</a>
          <a href="#tasks">Tasks</a>
          <a href="#meds">Meds</a>
          <a href="#visits">Visits</a>
          <a href="#emergency">Emergency</a>
          <a href="#invite">Family</a>
          <a href="#documents">Docs</a>
          <a href="#activity">Activity</a>
        </nav>
      </aside>

      <main className="main">
        <header className="page-head" id="overview">
          <div>
            <p className="eyebrow">Recovery dashboard</p>
            <h2>{recipient.full_name}</h2>
            <p className="muted">{recipient.recovery_status}</p>
          </div>
          <a className="button" href="#invite">Invite family</a>
        </header>

        {query?.error && <p className="notice"><strong>Dashboard error</strong><span>{query.error}</span></p>}
        {inviteError && <p className="notice"><strong>Invite setup needed</strong><span>Run supabase/upgrade-auth-admin-invites.sql to enable family invite links.</span></p>}
        {productError && <p className="notice"><strong>Product setup needed</strong><span>Run supabase/upgrade-product-core.sql if activity or product sections are unavailable.</span></p>}
        {demo && <p className="notice"><strong>Demo preview</strong><span>Connect Supabase in Vercel to enable sign in, saving, invite links, uploads, and live activity.</span></p>}

        <section className="grid-4">
          <article className="metric"><ClipboardList size={20} /><span>Open tasks</span><strong>{openTasks.length}</strong></article>
          <article className="metric"><Pill size={20} /><span>Medications</span><strong>{medications.length}</strong></article>
          <article className="metric"><CalendarDays size={20} /><span>Appointments</span><strong>{visits.length}</strong></article>
          <article className="metric"><FileVideo size={20} /><span>Care videos</span><strong>{videos.length}</strong></article>
        </section>

        <section className="grid-2" style={{ marginTop: 16 }}>
          <article className="panel">
            <div className="panel-head"><div><p className="eyebrow">Daily brief</p><h3>What matters right now</h3></div></div>
            <div className="rows">
              <div className="row"><strong>{openTasks[0]?.title || "No urgent open task"}</strong><span>{openTasks[0] ? `Owner: ${openTasks[0].owner_name || "Unassigned"}` : "Keep monitoring notes, medications, visits, and red flags."}</span></div>
              <div className="row"><strong>Emergency summary</strong><span>{recipient.emergency_summary}</span></div>
              {userEmail && <div className="row"><strong>Signed in</strong><span>{userEmail}</span></div>}
            </div>
          </article>
          <article className="panel" id="emergency">
            <div className="panel-head"><HeartPulse size={22} /><h3>Emergency card</h3></div>
            <div className="rows">
              <div className="row"><strong>Care focus</strong><span>{recipient.primary_condition || "General home care"}</span></div>
              <div className="row"><strong>Fall risk</strong><span>{recipient.fall_risk || "Unknown"}</span></div>
              <div className="row"><strong>Important contacts</strong><span>{contacts.slice(0, 2).map(contact => `${contact.name} (${contact.role})`).join(" / ") || "Add contacts below."}</span></div>
            </div>
          </article>
        </section>

        <section className="grid-2" style={{ marginTop: 16 }} id="tasks">
          <article className="panel">
            <div className="panel-head"><h3>Care tasks</h3></div>
            <div className="rows">{tasks.map(task => <TaskCompletionRow task={task} careRecipientId={careRecipientId} disabled={demo} key={task.id} />)}</div>
          </article>
          <article className="panel">
            <div className="panel-head"><h3>Create task</h3></div>
            <form className="form" action={createTask}>
              <input type="hidden" name="careRecipientId" value={careRecipientId} />
              <input name="title" placeholder="Call pharmacy about refill" required disabled={demo} />
              <input name="ownerName" placeholder="Owner name" required disabled={demo} />
              <input name="dueAt" type="datetime-local" disabled={demo} />
              <select name="priority" defaultValue="medium" disabled={demo}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select>
              <button className="button" type="submit" disabled={demo}>Create task</button>
            </form>
          </article>
        </section>

        <section className="grid-2" style={{ marginTop: 16 }} id="meds">
          <article className="panel"><div className="panel-head"><Pill size={22} /><h3>Medications</h3></div><div className="rows">
            {medications.length === 0 && <div className="row"><strong>No medications yet</strong><span>Add medications, schedules, refill dates, and instructions.</span></div>}
            {medications.map(med => <div className="row" key={med.id}><strong>{med.name} {med.dosage || ""}</strong><span>{med.schedule}</span><span>{med.instructions || "No instructions"} / Refill: {med.refill_due_at ? formatDate(med.refill_due_at) : "Not set"}</span></div>)}
          </div></article>
          <article className="panel"><div className="panel-head"><h3>Add medication</h3></div><form className="form" action={createMedication}>
            <input type="hidden" name="careRecipientId" value={careRecipientId} /><input name="name" placeholder="Medication name" required disabled={demo} /><input name="dosage" placeholder="Dosage" disabled={demo} /><input name="schedule" placeholder="Schedule" required disabled={demo} /><input name="prescribedBy" placeholder="Prescribed by" disabled={demo} /><input name="refillDueAt" type="date" disabled={demo} /><textarea name="instructions" placeholder="Instructions" disabled={demo} /><button className="button" type="submit" disabled={demo}>Add medication</button>
          </form></article>
        </section>

        <section className="grid-2" style={{ marginTop: 16 }} id="visits">
          <article className="panel"><div className="panel-head"><CalendarDays size={22} /><h3>Appointments</h3></div><div className="rows">
            {visits.length === 0 && <div className="row"><strong>No appointments yet</strong><span>Add clinic visits, therapy sessions, calls, and home aide visits.</span></div>}
            {visits.map(visit => <div className="row" key={visit.id}><strong>{visit.title}</strong><span>{formatDate(visit.starts_at)} / {visit.location || "Location TBD"}</span><span>{visit.provider_name || "No provider"} / {visit.preparation_notes || "No prep notes"}</span></div>)}
          </div></article>
          <article className="panel"><div className="panel-head"><h3>Add appointment</h3></div><form className="form" action={createVisit}>
            <input type="hidden" name="careRecipientId" value={careRecipientId} /><input name="title" placeholder="Appointment title" required disabled={demo} /><input name="startsAt" type="datetime-local" disabled={demo} /><input name="location" placeholder="Location" disabled={demo} /><input name="providerName" placeholder="Provider or contact" disabled={demo} /><textarea name="preparationNotes" placeholder="Preparation notes" disabled={demo} /><button className="button" type="submit" disabled={demo}>Add appointment</button>
          </form></article>
        </section>

        <section className="grid-2" style={{ marginTop: 16 }} id="invite">
          <article className="panel"><div className="panel-head"><div><p className="eyebrow">Circle invites</p><h3>Bring trusted family into this circle</h3></div></div>
            <form className="form" action={createInviteLink}><input type="hidden" name="careRecipientId" value={careRecipientId} /><input name="invitedEmail" type="email" placeholder="Optional: family@example.com" disabled={demo} /><select name="role" defaultValue="family_member" disabled={demo}><option value="family_member">Family member</option><option value="home_aide">Home aide</option><option value="agency_coordinator">Agency coordinator</option><option value="clinician">Clinician</option></select><button className="button" type="submit" disabled={demo}>Generate invite link</button></form>
            {latestInviteUrl && <div className="row copy-row"><strong>Share this link</strong><span>{latestInviteUrl}</span></div>}
          </article>
          <article className="panel"><div className="panel-head"><UsersRound size={22} /><h3>Members and invites</h3></div><div className="rows">
            {memberships.map(member => <div className="row" key={member.id}><strong>{member.role.replace("_", " ")}</strong><span>{member.user_id} / Joined {formatDate(member.created_at)}</span></div>)}
            {invites.map(invite => <div className="row" key={invite.token}><strong>{invite.invited_email || "Open invite"} / {invite.role.replace("_", " ")}</strong><span>{invite.accepted_at ? "Accepted" : invite.revoked_at ? "Revoked" : inviteUrl(invite.token)}</span></div>)}
          </div></article>
        </section>

        <section className="grid-2" style={{ marginTop: 16 }} id="documents">
          <article className="panel"><div className="panel-head"><FileText size={22} /><h3>Documents</h3></div><div className="rows">
            {documents.length === 0 && <div className="row"><strong>No documents yet</strong><span>Add discharge papers, medication lists, insurance notes, or shared links.</span></div>}
            {documents.map(doc => <div className="row" key={doc.id}><strong>{doc.external_url ? <a href={doc.external_url} target="_blank" rel="noreferrer">{doc.title}</a> : doc.title}</strong><span>{doc.category} / {doc.notes || "No notes"}</span></div>)}
          </div></article>
          <article className="panel"><div className="panel-head"><h3>Add document link</h3></div><form className="form" action={createDocument}>
            <input type="hidden" name="careRecipientId" value={careRecipientId} /><input name="title" placeholder="Document title" required disabled={demo} /><input name="category" placeholder="Category" required disabled={demo} /><input name="externalUrl" type="url" placeholder="Optional secure link" disabled={demo} /><textarea name="notes" placeholder="Notes" disabled={demo} /><button className="button" type="submit" disabled={demo}>Add document</button>
          </form></article>
        </section>

        <section className="grid-2" style={{ marginTop: 16 }} id="notes">
          <article className="panel"><div className="panel-head"><h3>Recent notes</h3></div><div className="rows">{notes.map(note => <div className="row" key={note.id}><strong>{note.author_name}</strong><span>{note.body}</span></div>)}</div></article>
          <article className="panel"><div className="panel-head"><h3>Add care note</h3></div><form className="form" action={createNote}><input type="hidden" name="careRecipientId" value={careRecipientId} /><input name="authorName" placeholder="Author" required disabled={demo} /><textarea name="body" placeholder="What changed today?" required disabled={demo} /><button className="button" type="submit" disabled={demo}>Add note</button></form></article>
        </section>

        <section className="grid-2" style={{ marginTop: 16 }}>
          <article className="panel"><div className="panel-head"><UsersRound size={22} /><h3>Contacts</h3></div><div className="rows">{contacts.map(contact => <div className="row" key={contact.id}><strong>{contact.name} / {contact.role}</strong><span>{contact.phone || "No phone"} / {contact.email || "No email"}</span><span>{contact.notes}</span></div>)}</div></article>
          <article className="panel"><div className="panel-head"><h3>Add contact</h3></div><form className="form" action={createContact}><input type="hidden" name="careRecipientId" value={careRecipientId} /><input name="name" placeholder="Name" required disabled={demo} /><input name="role" placeholder="Role" required disabled={demo} /><input name="phone" placeholder="Phone" disabled={demo} /><input name="email" type="email" placeholder="Email" disabled={demo} /><textarea name="notes" placeholder="Notes" disabled={demo} /><button className="button" type="submit" disabled={demo}>Add contact</button></form></article>
        </section>

        <section className="grid-2" style={{ marginTop: 16 }} id="activity">
          <article className="panel"><div className="panel-head"><h3>Activity log</h3></div><div className="rows">{activity.length === 0 && <div className="row"><strong>No activity yet</strong><span>Tasks, notes, medications, documents, and appointments will appear here.</span></div>}{activity.map(event => <div className="row" key={event.id}><strong>{event.actor_name || "Care circle"} / {event.action} {event.entity}</strong><span>{event.summary || "No summary"} / {formatDate(event.created_at)}</span></div>)}</div></article>
          <article className="panel" id="videos"><div className="panel-head"><div><p className="eyebrow">Caregiver video hub</p><h3>Training attached to the care plan</h3></div></div><div className="video-grid">{videos.map(video => <article className="video-card" key={video.id}><div className="video-frame">{videoFrame(video)}</div><div className="video-body"><strong>{video.title}</strong><span>{video.category}</span><span>{video.description}</span></div></article>)}</div><form className="form" action={createVideo} style={{ marginTop: 16 }}><input type="hidden" name="careRecipientId" value={careRecipientId} /><input name="title" placeholder="Safe transfer walkthrough" required disabled={demo} /><input name="category" placeholder="Mobility" required disabled={demo} /><input name="embedUrl" placeholder="YouTube/Vimeo embed URL" disabled={demo} /><textarea name="description" placeholder="When should the family or aide watch this?" disabled={demo} /><button className="button" type="submit" disabled={demo}>Add care video</button></form><div style={{ marginTop: 16 }}><p className="eyebrow">Upload caretaker video</p><VideoUploadForm careRecipientId={careRecipientId} disabled={demo} /></div></article>
        </section>

        <section className="panel" style={{ marginTop: 16 }} id="security">
          <div className="panel-head"><ShieldCheck size={22} /><h3>Security model</h3></div>
          <div className="rows"><div className="row"><strong>Private care circles</strong><span>Every care record is protected by Supabase RLS.</span></div><div className="row"><strong>Role-based access</strong><span>Family leads, aides, agencies, and clinicians get scoped permissions.</span></div><div className="row"><strong>Installable app path</strong><span>PWA support makes HOMEX installable now; push notifications, offline data sync, and native store wrappers come next.</span></div></div>
        </section>
      </main>
    </div>
  );
}
