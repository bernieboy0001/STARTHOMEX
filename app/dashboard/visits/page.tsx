import { createVisit } from "../actions";
import { formatDate, loadDashboard } from "../data";
import { SaveStatusNotice } from "@/components/save-status-notice";

export default async function VisitsPage({ searchParams }: { searchParams?: Promise<{ save?: "database-not-connected" | "error" | "saved" }> }) {
  const query = await searchParams;
  const data = await loadDashboard();
  const { visits, recipient } = data;
  const careRecipientId = recipient.id;

  return (
    <main className="main app-main">
      <header className="page-head"><div><p className="eyebrow">Appointments</p><h2>Visits and follow-ups</h2><p className="muted">Clinic visits, therapy sessions, calls, and home aide visits.</p></div></header>
      <SaveStatusNotice status={query?.save} />
      <section className="grid-2">
        <article className="panel"><div className="panel-head"><h3>Upcoming</h3></div><div className="rows">
          {visits.length === 0 && <div className="row"><strong>No appointments yet</strong><span>Add clinic visits, therapy sessions, calls, and home aide visits.</span></div>}
          {visits.map(visit => <div className="row" key={visit.id}><strong>{visit.title}</strong><span>{formatDate(visit.starts_at)} / {visit.location || "Location TBD"}</span><span>{visit.provider_name || "No provider"} / {visit.preparation_notes || "No prep notes"}</span></div>)}
        </div></article>
        <article className="panel"><div className="panel-head"><h3>Add appointment</h3></div><form className="form" action={createVisit}>
          <input type="hidden" name="careRecipientId" value={careRecipientId} /><label>Appointment <input name="title" placeholder="e.g. Physical therapy" required /></label><label>Date and time <input name="startsAt" type="datetime-local" /></label><label>Location <input name="location" placeholder="Clinic, home, or phone" /></label><label>Provider or contact <input name="providerName" placeholder="Name or practice" /></label><label>Preparation notes <textarea name="preparationNotes" placeholder="What to bring or discuss" /></label><button className="button" type="submit">Add appointment</button>
        </form></article>
      </section>
    </main>
  );
}
