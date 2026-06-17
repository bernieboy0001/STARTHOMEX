import { BellRing } from "lucide-react";
import { NotificationControls } from "@/components/notification-controls";
import { createReminder } from "../actions";
import { formatDate, loadDashboard } from "../data";

export default async function RemindersPage() {
  const { reminders, recipient, demo } = await loadDashboard();
  const careRecipientId = demo ? "00000000-0000-0000-0000-000000000000" : recipient.id;

  return (
    <main className="main app-main">
      <header className="page-head">
        <div>
          <p className="eyebrow">Reminders</p>
          <h2>Push alerts and care follow-ups</h2>
          <p className="muted">Create reminders for medication refills, appointments, checks, and family follow-ups.</p>
        </div>
      </header>
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
            <input name="title" placeholder="Reminder title" required disabled={demo} />
            <input name="remindAt" type="datetime-local" required disabled={demo} />
            <select name="channel" defaultValue="app" disabled={demo}>
              <option value="app">App push</option>
              <option value="email">Email follow-up</option>
              <option value="sms">SMS later</option>
            </select>
            <button className="button" type="submit" disabled={demo}>Add reminder</button>
          </form>
        </article>
        <article className="panel">
          <div className="panel-head"><h3>This device</h3></div>
          <NotificationControls publicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY} />
        </article>
      </section>
    </main>
  );
}
