import { formatDate, loadDashboard } from "../data";

export default async function ActivityPage() {
  const data = await loadDashboard();
  const { activity } = data;

  return (
    <main className="main app-main">
      <header className="page-head"><div><p className="eyebrow">Activity</p><h2>Who did what</h2><p className="muted">A running log of tasks, notes, invites, medications, documents, and appointments.</p></div></header>
      <section className="panel">
        <div className="panel-head"><h3>Activity log</h3></div>
        <div className="rows">{activity.length === 0 && <div className="row"><strong>No activity yet</strong><span>Tasks, notes, medications, documents, and appointments will appear here.</span></div>}{activity.map(event => <div className="row" key={event.id}><strong>{event.actor_name || "Care circle"} / {event.action} {event.entity}</strong><span>{event.summary || "No summary"} / {formatDate(event.created_at)}</span></div>)}</div>
      </section>
    </main>
  );
}
