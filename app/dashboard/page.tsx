import Link from "next/link";
import { ArrowUpRight, CalendarDays, CheckCircle2, ClipboardPlus, FileText, HeartPulse, NotebookPen, Pill, UsersRound } from "lucide-react";
import { formatDate, loadDashboard } from "./data";

export default async function DashboardPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  const query = await searchParams;
  const data = await loadDashboard();
  const { recipient, tasks, medications, visits, contacts } = data;
  const openTasks = tasks.filter(task => !task.completed_at);
  const priorityTask = openTasks[0];
  const nextVisit = visits[0];

  return (
    <main className="main app-main dashboard-home">
      <header className="dashboard-welcome">
        <div>
          <p className="eyebrow">Today&apos;s care plan</p>
          <h1>Care for {recipient.full_name}</h1>
          <p>{recipient.recovery_status || "Keep the circle aligned on the next helpful step."}</p>
        </div>
        <Link className="ghost dashboard-circle-link" href="/dashboard/family"><UsersRound size={17} />Care circle</Link>
      </header>

      {query?.error && <p className="notice"><strong>We could not load part of the care plan.</strong><span>{query.error}</span></p>}

      <section className="dashboard-focus" aria-label="Care priorities">
        <Link className="focus-card focus-primary" href="/dashboard/tasks">
          <span className="focus-icon"><ClipboardPlus size={20} /></span>
          <div><p className="eyebrow">Focus now</p><h2>{priorityTask?.title || "Nothing is waiting right now"}</h2><p>{priorityTask ? `Assigned to ${priorityTask.owner_name || "the care circle"}` : "Review the care plan or record an update when something changes."}</p></div>
          <ArrowUpRight className="focus-arrow" size={21} />
        </Link>
        <Link className="focus-card" href="/dashboard/visits">
          <span className="focus-icon"><CalendarDays size={20} /></span>
          <div><p className="eyebrow">Next appointment</p><h2>{nextVisit?.title || "Nothing scheduled"}</h2><p>{nextVisit ? formatDate(nextVisit.starts_at) : "Add the next visit when you know it."}</p></div>
          <ArrowUpRight className="focus-arrow" size={21} />
        </Link>
      </section>

      <section className="dashboard-actions" aria-labelledby="quick-actions-heading">
        <div className="section-heading"><div><p className="eyebrow">Do one thing</p><h2 id="quick-actions-heading">Quick actions</h2></div><span>Keep the plan moving</span></div>
        <div className="action-list">
          <Link href="/dashboard/tasks"><ClipboardPlus size={19} /><span>Add a task</span><ArrowUpRight size={17} /></Link>
          <Link href="/dashboard/notes"><NotebookPen size={19} /><span>Share an update</span><ArrowUpRight size={17} /></Link>
          <Link href="/dashboard/medications"><Pill size={19} /><span>Review medication</span><ArrowUpRight size={17} /></Link>
        </div>
      </section>

      <section className="care-pulse" aria-labelledby="care-pulse-heading">
        <div className="section-heading"><div><p className="eyebrow">At a glance</p><h2 id="care-pulse-heading">Care pulse</h2></div><Link href="/dashboard/activity">View activity <ArrowUpRight size={15} /></Link></div>
        <div className="pulse-items">
          <div><CheckCircle2 size={18} /><span><strong>{openTasks.length} open task{openTasks.length === 1 ? "" : "s"}</strong><small>Ready for the circle</small></span></div>
          <div><HeartPulse size={18} /><span><strong>{recipient.primary_condition || "General home care"}</strong><small>Current care focus</small></span></div>
          <div><FileText size={18} /><span><strong>{contacts.length ? `${contacts.length} care contact${contacts.length === 1 ? "" : "s"}` : "No contacts saved"}</strong><small>Emergency support</small></span></div>
        </div>
      </section>
    </main>
  );
}
