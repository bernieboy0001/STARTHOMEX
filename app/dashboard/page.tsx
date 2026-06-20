import Link from "next/link";
import { CalendarDays, ClipboardList, FileText, FileVideo, HeartPulse, Pill, UsersRound } from "lucide-react";
import { DashboardAuthRequired } from "./auth-required";
import { formatDate, loadDashboard } from "./data";

export default async function DashboardPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  const query = await searchParams;
  const data = await loadDashboard();
  if (!data) return <DashboardAuthRequired />;
  const { recipient, tasks, medications, visits, reminders, contacts, documents, notes, activity, videos, inviteError, productError, userEmail } = data;
  const openTasks = tasks.filter(task => !task.completed_at);

  return (
    <main className="main app-main">
      <header className="page-head">
        <div>
          <p className="eyebrow">Care circle</p>
          <h2>{recipient.full_name}</h2>
          <p className="muted">{recipient.recovery_status}</p>
        </div>
        <div className="actions compact-actions">
          <Link className="button" href="/dashboard/family">Invite family</Link>
          <Link className="ghost" href="/sign-out">Sign out</Link>
        </div>
      </header>

      {query?.error && <p className="notice"><strong>Dashboard error</strong><span>{query.error}</span></p>}
      {inviteError && <p className="notice"><strong>Invite setup needed</strong><span>Run the invite SQL upgrade in Supabase.</span></p>}
      {productError && <p className="notice"><strong>Product setup needed</strong><span>Run the product-core SQL upgrade in Supabase.</span></p>}

      <section className="grid-4">
        <Link className="metric" href="/dashboard/tasks"><ClipboardList size={20} /><span>Open tasks</span><strong>{openTasks.length}</strong></Link>
        <Link className="metric" href="/dashboard/medications"><Pill size={20} /><span>Medications</span><strong>{medications.length}</strong></Link>
        <Link className="metric" href="/dashboard/visits"><CalendarDays size={20} /><span>Appointments</span><strong>{visits.length}</strong></Link>
        <Link className="metric" href="/dashboard/reminders"><FileVideo size={20} /><span>Reminders</span><strong>{reminders.length}</strong></Link>
      </section>

      <section className="grid-2 app-section">
        <article className="panel">
          <div className="panel-head"><div><p className="eyebrow">Daily brief</p><h3>What matters right now</h3></div></div>
          <div className="rows">
            <div className="row"><strong>{openTasks[0]?.title || "No urgent open task"}</strong><span>{openTasks[0] ? `Owner: ${openTasks[0].owner_name || "Unassigned"}` : "Keep monitoring notes, medications, visits, and red flags."}</span></div>
            <div className="row"><strong>Next visit</strong><span>{visits[0] ? `${visits[0].title} / ${formatDate(visits[0].starts_at)}` : "No appointment scheduled."}</span></div>
            {userEmail && <div className="row"><strong>Signed in</strong><span>{userEmail}</span></div>}
          </div>
        </article>

        <article className="panel">
          <div className="panel-head"><HeartPulse size={22} /><h3>Emergency card</h3></div>
          <div className="rows">
            <div className="row"><strong>Care focus</strong><span>{recipient.primary_condition || "General home care"}</span></div>
            <div className="row"><strong>Fall risk</strong><span>{recipient.fall_risk || "Unknown"}</span></div>
            <div className="row"><strong>Summary</strong><span>{recipient.emergency_summary || "No emergency summary yet."}</span></div>
            <div className="row"><strong>Important contacts</strong><span>{contacts.slice(0, 2).map(contact => `${contact.name} (${contact.role})`).join(" / ") || "Add contacts in Family."}</span></div>
          </div>
        </article>
      </section>

      <section className="quick-grid">
        <Link className="card" href="/dashboard/family"><UsersRound size={20} /><strong>Family & team</strong><span>Invite trusted people and manage access.</span></Link>
        <Link className="card" href="/dashboard/documents"><FileText size={20} /><strong>Documents</strong><span>Store important care links and notes.</span></Link>
        <Link className="card" href="/dashboard/notes"><HeartPulse size={20} /><strong>Care notes</strong><span>Log what changed today.</span></Link>
        <Link className="card" href="/dashboard/reminders"><CalendarDays size={20} /><strong>Reminders</strong><span>Set follow-ups and device alerts.</span></Link>
        <Link className="card" href="/dashboard/videos"><FileVideo size={20} /><strong>Care videos</strong><span>Keep walkthroughs and training clips in one place.</span></Link>
      </section>
    </main>
  );
}
