import { TaskCompletionRow } from "@/components/task-completion-row";
import { loadDashboard } from "../data";
import { SaveStatusNotice } from "@/components/save-status-notice";
import { TaskCreateForm } from "@/components/task-create-form";

export default async function TasksPage({ searchParams }: { searchParams?: Promise<{ save?: "database-not-connected" | "error" | "saved" }> }) {
  const query = await searchParams;
  const data = await loadDashboard();
  const { tasks, recipient } = data;
  const careRecipientId = recipient.id;

  return (
    <main className="main app-main">
      <header className="page-head"><div><p className="eyebrow">Tasks</p><h2>Care checklist</h2><p className="muted">Check items off and see who completed them.</p></div></header>
      <SaveStatusNotice status={query?.save} />
      <section className="grid-2">
        <article className="panel"><div className="panel-head"><h3>Open and completed tasks</h3></div><div className="rows">{tasks.map(task => <TaskCompletionRow task={task} careRecipientId={careRecipientId} key={task.id} />)}</div></article>
        <article className="panel"><div className="panel-head"><h3>Create task</h3></div><TaskCreateForm careRecipientId={careRecipientId} /></article>
      </section>
    </main>
  );
}
