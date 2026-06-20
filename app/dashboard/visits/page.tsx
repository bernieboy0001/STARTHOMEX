import { createVisit } from "../actions";
import { formatDate, loadDashboard } from "../data";

export default async function VisitsPage() {
  const data = await loadDashboard();
  const { visits, recipient } = data;
  const careRecipientId = recipient.id;

  return (
    <main className="main app-main">
      <header className="page-head"><div><p className="eyebrow">Appointments</p><h2>Visits and follow-ups</h2><p className="muted">Clinic visits, therapy sessions, calls, and home aide visits.</p></div></header>
      <section className="grid-2">
        <article className="panel"><div className="panel-head"><h3>Upcoming</h3></div><div className="rows">
          {visits.length === 0 && <div className="row"><strong>No appointments yet</strong><span>Add clinic visits, therapy sessions, calls, and home aide visits.</span></div>}
          {visits.map(visit => <div className="row" key={visit.id}><strong>{visit.title}</strong><span>{formatDate(visit.starts_at)} / {visit.location || "Location TBD"}</span><span>{visit.provider_name || "No provider"} / {visit.preparation_notes || "No prep notes"}</span></div>)}
        </div></article>
        <article className="panel"><div className="panel-head"><h3>Add appointment</h3></div><form className="form" action={createVisit}>
          <input type="hidden" name="careRecipientId" value={careRecipientId} /><input name="title" placeholder="Appointment title" required /><input name="startsAt" type="datetime-local" /><input name="location" placeholder="Location" /><input name="providerName" placeholder="Provider or contact" /><textarea name="preparationNotes" placeholder="Preparation notes" /><button className="button" type="submit">Add appointment</button>
        </form></article>
      </section>
    </main>
  );
}
