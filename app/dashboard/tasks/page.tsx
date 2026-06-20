import { TaskCompletionRow } from "@/components/task-completion-row";
import { DashboardAuthRequired } from "../auth-required";
import { createTask } from "../actions";
import { loadDashboard } from "../data";

export default async function TasksPage() {
  const data = await loadDashboard();
  if (!data) return <DashboardAuthRequired />;
  const { tasks, recipient } = data;
  const careRecipientId = recipient.id;

  return (
    <main className="main app-main">
      <header className="page-head"><div><p className="eyebrow">Tasks</p><h2>Care checklist</h2><p className="muted">Check items off and see who completed them.</p></div></header>
      <section className="grid-2">
        <article className="panel"><div className="panel-head"><h3>Open and completed tasks</h3></div><div className="rows">{tasks.map(task => <TaskCompletionRow task={task} careRecipientId={careRecipientId} key={task.id} />)}</div></article>
        <article className="panel"><div className="panel-head"><h3>Create task</h3></div><form className="form" action={createTask}>
          <input type="hidden" name="careRecipientId" value={careRecipientId} />
          <input name="title" placeholder="Call pharmacy about refill" required />
          <input name="ownerName" placeholder="Owner name" required />
          <input name="dueAt" type="datetime-local" />
          <select name="priority" defaultValue="medium"><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select>
          <button className="button" type="submit">Create task</button>
        </form></article>
      </section>
    </main>
  );
}
