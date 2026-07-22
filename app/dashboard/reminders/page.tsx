import { BellRing } from "lucide-react";
import { createReminder } from "../actions";
import { formatDate, loadDashboard } from "../data";
import { SaveStatusNotice } from "@/components/save-status-notice";

export default async function RemindersPage({ searchParams }: { searchParams?: Promise<{ save?: "database-not-connected" | "error" | "saved" }> }) {
  const query = await searchParams;
  const data = await loadDashboard();
  const { reminders, recipient } = data;
  const careRecipientId = recipient.id;

  return (
    <main className="main app-main">
      <header className="page-head">
        <div>
          <p className="eyebrow">Reminders</p>
          <h2>Push alerts and care follow-ups</h2>
          <p className="muted">Create reminders for medication refills, appointments, checks, and family follow-ups.</p>
        </div>
      </header>
      <SaveStatusNotice status={query?.save} />
      <section className="grid-2">
        <article className="panel">
          <div className="panel-head"><h3>Upcoming reminders</h3><BellRing size={20} /></div>
          <div className="rows">
            {reminders.length === 0 && <div className="row"><strong>No reminders yet</strong><span>Add the next thing the circle should not forget.</span></div>}
            {reminders.map(reminder => (
              <div className="row" key={reminder.id}>
                <strong>{reminder.title}</strong>
                <span>{formatDate(reminder.remind_at)} / {reminder.channel}</span>
              </div>
            ))}
          </div>
        </article>
        <article className="panel">
          <div className="panel-head"><h3>Add reminder</h3></div>
          <form className="form" action={createReminder}>
            <input type="hidden" name="careRecipientId" value={careRecipientId} />
            <label>Reminder <input name="title" placeholder="e.g. Check medication refill" required /></label>
            <label>When <input name="remindAt" type="datetime-local" required /></label>
            <label>Send through <select name="channel" defaultValue="app">
              <option value="app">App push</option>
              <option value="email">Email follow-up</option>
              <option value="sms">SMS later</option>
            </select></label>
            <button className="button" type="submit">Add reminder</button>
          </form>
        </article>
      </section>
    </main>
  );
}
