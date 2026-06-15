import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardList, FileVideo, HeartPulse, ShieldCheck, UsersRound } from "lucide-react";
import { VideoUploadForm } from "@/components/video-upload-form";
import { createNote, createTask, createVideo } from "./actions";
import { createInviteLink } from "./invite-actions";
import { inviteUrl } from "@/lib/invites";
import { createClient } from "@/lib/supabase/server";
import { demoNotes, demoRecipient, demoTasks, demoVideos } from "@/lib/demo-data";
import type { CareNote, CareRecipient, CareVideo, Task } from "@/lib/types";

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
      userEmail: null as string | null,
      demo: true
    };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/sign-in");

  const { data: recipients } = await supabase
    .from("care_recipients")
    .select("*")
    .limit(1);

  const recipient = recipients?.[0] as CareRecipient | undefined;
  if (!recipient) {
    redirect("/onboarding");
  }

  const [{ data: tasks }, { data: notes }, { data: videos }, { data: invites }] = await Promise.all([
    supabase.from("tasks").select("*").eq("care_recipient_id", recipient.id).order("created_at", { ascending: false }),
    supabase.from("care_notes").select("*").eq("care_recipient_id", recipient.id).order("created_at", { ascending: false }).limit(8),
    supabase.from("caregiver_videos").select("*").eq("care_recipient_id", recipient.id).order("created_at", { ascending: false }),
    supabase
      .from("care_circle_invites")
      .select("token, role, invited_email, accepted_at, revoked_at, expires_at, created_at")
      .eq("care_recipient_id", recipient.id)
      .order("created_at", { ascending: false })
      .limit(5)
  ]);

  const videosWithPlayback = await Promise.all(
    ((videos || []) as CareVideo[]).map(async video => {
      if (!video.storage_path) return video;
      const { data } = await supabase.storage.from("care-files").createSignedUrl(video.storage_path, 60 * 20);
      return { ...video, playback_url: data?.signedUrl || null };
    })
  );

  return {
    recipient,
    tasks: (tasks || []) as Task[],
    notes: (notes || []) as CareNote[],
    videos: videosWithPlayback,
    invites: (invites || []) as Invite[],
    userEmail: userData.user.email || null,
    demo: false
  };
}

function formatDate(value: string | null) {
  if (!value) return "No due date";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function videoFrame(video: CareVideo) {
  if (video.embed_url) {
    return <iframe src={video.embed_url} title={video.title} allowFullScreen loading="lazy" />;
  }
  if (video.playback_url) {
    return <video src={video.playback_url} controls preload="metadata" />;
  }
  return null;
}

export default async function DashboardPage({ searchParams }: { searchParams?: Promise<{ error?: string; invite?: string }> }) {
  const query = await searchParams;
  const { recipient, tasks, notes, videos, invites, userEmail, demo } = await loadDashboard();
  const openTasks = tasks.filter(task => !task.completed_at);
  const careRecipientId = demo ? "00000000-0000-0000-0000-000000000000" : recipient.id;
  const latestInviteUrl = query?.invite ? inviteUrl(query.invite) : null;

  return (
    <div className="shell">
      <aside className="rail">
        <Link href="/" className="brand">
          <span className="mark">HX</span>
          <span><strong>HOMEX</strong><span>Care at home</span></span>
        </Link>
        <nav className="nav">
          <a href="#overview">Overview</a>
          <a href="#invite">Invite family</a>
          <a href="#tasks">Tasks</a>
          <a href="#videos">Videos</a>
          <a href="#notes">Notes</a>
          <a href="#security">Security</a>
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
        {demo && (
          <p className="notice">
            <strong>Demo preview</strong>
            <span>Connect Supabase in Vercel to enable sign in, saving notes, creating tasks, invite links, and video uploads.</span>
          </p>
        )}

        <section className="grid-4">
          <article className="metric"><ClipboardList size={20} /><span>Open tasks</span><strong>{openTasks.length}</strong></article>
          <article className="metric"><HeartPulse size={20} /><span>Condition</span><strong>{recipient.primary_condition || "Active recovery"}</strong></article>
          <article className="metric"><UsersRound size={20} /><span>Fall risk</span><strong>{recipient.fall_risk || "Unknown"}</strong></article>
          <article className="metric"><FileVideo size={20} /><span>Care videos</span><strong>{videos.length}</strong></article>
        </section>

        <section className="grid-2" style={{ marginTop: 16 }}>
          <article className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Daily brief</p>
                <h3>What matters right now</h3>
              </div>
            </div>
            <div className="rows">
              <div className="row"><strong>{openTasks[0]?.title || "No urgent open task"}</strong><span>{openTasks[0] ? `Owner: ${openTasks[0].owner_name || "Unassigned"}` : "Keep monitoring notes and red flags."}</span></div>
              <div className="row"><strong>Emergency summary</strong><span>{recipient.emergency_summary}</span></div>
              {userEmail && <div className="row"><strong>Signed in</strong><span>{userEmail}</span></div>}
            </div>
          </article>

          <article className="panel" id="notes">
            <div className="panel-head"><h3>Add care note</h3></div>
            <form className="form" action={createNote}>
              <input type="hidden" name="careRecipientId" value={careRecipientId} />
              <input name="authorName" placeholder="Author" required disabled={demo} />
              <textarea name="body" placeholder="What changed today?" required disabled={demo} />
              <button className="button" type="submit" disabled={demo}>{demo ? "Connect Supabase to add notes" : "Add note"}</button>
            </form>
          </article>
        </section>

        <section className="grid-2" style={{ marginTop: 16 }} id="invite">
          <article className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Circle invites</p>
                <h3>Bring trusted family into this circle</h3>
              </div>
            </div>
            <form className="form" action={createInviteLink}>
              <input type="hidden" name="careRecipientId" value={careRecipientId} />
              <input name="invitedEmail" type="email" placeholder="Optional: family@example.com" disabled={demo} />
              <select name="role" defaultValue="family_member" disabled={demo}>
                <option value="family_member">Family member</option>
                <option value="home_aide">Home aide</option>
                <option value="agency_coordinator">Agency coordinator</option>
                <option value="clinician">Clinician</option>
              </select>
              <button className="button" type="submit" disabled={demo}>{demo ? "Connect Supabase to create invites" : "Generate invite link"}</button>
            </form>
            {latestInviteUrl && (
              <div className="row copy-row">
                <strong>Share this link</strong>
                <span>{latestInviteUrl}</span>
              </div>
            )}
          </article>
          <article className="panel">
            <div className="panel-head"><h3>Recent invite links</h3></div>
            <div className="rows">
              {invites.length === 0 && <div className="row"><strong>No invites yet</strong><span>Generate a link when you are ready to add trusted family.</span></div>}
              {invites.map(invite => (
                <div className="row" key={invite.token}>
                  <strong>{invite.invited_email || "Open invite"} / {invite.role.replace("_", " ")}</strong>
                  <span>{invite.accepted_at ? "Accepted" : invite.revoked_at ? "Revoked" : inviteUrl(invite.token)}</span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="grid-2" style={{ marginTop: 16 }} id="tasks">
          <article className="panel">
            <div className="panel-head"><h3>Care tasks</h3></div>
            <div className="rows">
              {tasks.map(task => (
                <div className="row" key={task.id}>
                  <strong>{task.title}</strong>
                  <span>{task.owner_name || "Unassigned"} / {formatDate(task.due_at)} / {task.priority}</span>
                </div>
              ))}
            </div>
          </article>
          <article className="panel">
            <div className="panel-head"><h3>Create task</h3></div>
            <form className="form" action={createTask}>
              <input type="hidden" name="careRecipientId" value={careRecipientId} />
              <input name="title" placeholder="Call insurance about home PT" required disabled={demo} />
              <input name="ownerName" placeholder="Owner name" required disabled={demo} />
              <input name="dueAt" type="datetime-local" disabled={demo} />
              <select name="priority" defaultValue="medium" disabled={demo}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <button className="button" type="submit" disabled={demo}>{demo ? "Connect Supabase to create tasks" : "Create task"}</button>
            </form>
          </article>
        </section>

        <section className="panel" style={{ marginTop: 16 }} id="videos">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Caregiver video hub</p>
              <h3>Training attached to the care plan</h3>
            </div>
          </div>
          <div className="video-grid">
            {videos.map(video => (
              <article className="video-card" key={video.id}>
                <div className="video-frame">{videoFrame(video)}</div>
                <div className="video-body">
                  <strong>{video.title}</strong>
                  <span>{video.category}</span>
                  <span>{video.description}</span>
                </div>
              </article>
            ))}
          </div>
          <form className="form" action={createVideo} style={{ marginTop: 16 }}>
            <input type="hidden" name="careRecipientId" value={careRecipientId} />
            <input name="title" placeholder="Safe transfer walkthrough" required disabled={demo} />
            <input name="category" placeholder="Mobility" required disabled={demo} />
            <input name="embedUrl" placeholder="YouTube/Vimeo embed URL or leave blank for uploaded video" disabled={demo} />
            <textarea name="description" placeholder="When should the family or aide watch this?" disabled={demo} />
            <button className="button" type="submit" disabled={demo}>{demo ? "Connect Supabase to add videos" : "Add care video"}</button>
          </form>
          <div style={{ marginTop: 16 }}>
            <p className="eyebrow">Upload caretaker video</p>
            <VideoUploadForm careRecipientId={careRecipientId} disabled={demo} />
          </div>
        </section>

        <section className="grid-2" style={{ marginTop: 16 }} id="security">
          <article className="panel">
            <div className="panel-head"><ShieldCheck size={22} /><h3>Security model</h3></div>
            <div className="rows">
              <div className="row"><strong>Private care circles</strong><span>Every care record is protected by Supabase RLS.</span></div>
              <div className="row"><strong>Role-based access</strong><span>Family leads, aides, agencies, and clinicians get scoped permissions.</span></div>
              <div className="row"><strong>Invite-only growth</strong><span>Family members join through links generated by the circle lead.</span></div>
            </div>
          </article>
          <article className="panel">
            <div className="panel-head"><h3>Recent notes</h3></div>
            <div className="rows">
              {notes.map(note => (
                <div className="row" key={note.id}>
                  <strong>{note.author_name}</strong>
                  <span>{note.body}</span>
                </div>
              ))}
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
