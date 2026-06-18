import { createMedication } from "../actions";
import { formatDate, loadDashboard } from "../data";

export default async function MedicationsPage() {
  const { medications, recipient } = await loadDashboard();
  const careRecipientId = recipient.id;

  return (
    <main className="main app-main">
      <header className="page-head"><div><p className="eyebrow">Medications</p><h2>Medication schedule</h2><p className="muted">Track dosage, instructions, and refill dates.</p></div></header>
      <section className="grid-2">
        <article className="panel"><div className="panel-head"><h3>Active medications</h3></div><div className="rows">
          {medications.length === 0 && <div className="row"><strong>No medications yet</strong><span>Add medications, schedules, refill dates, and instructions.</span></div>}
          {medications.map(med => <div className="row" key={med.id}><strong>{med.name} {med.dosage || ""}</strong><span>{med.schedule}</span><span>{med.instructions || "No instructions"} / Refill: {med.refill_due_at ? formatDate(med.refill_due_at) : "Not set"}</span></div>)}
        </div></article>
        <article className="panel"><div className="panel-head"><h3>Add medication</h3></div><form className="form" action={createMedication}>
          <input type="hidden" name="careRecipientId" value={careRecipientId} /><input name="name" placeholder="Medication name" required /><input name="dosage" placeholder="Dosage" /><input name="schedule" placeholder="Schedule" required /><input name="prescribedBy" placeholder="Prescribed by" /><input name="refillDueAt" type="date" /><textarea name="instructions" placeholder="Instructions" /><button className="button" type="submit">Add medication</button>
        </form></article>
      </section>
    </main>
  );
}
