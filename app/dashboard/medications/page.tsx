import { formatDate, loadDashboard } from "../data";
import { SaveStatusNotice } from "@/components/save-status-notice";
import { MedicationCreateForm } from "@/components/medication-create-form";

export default async function MedicationsPage({ searchParams }: { searchParams?: Promise<{ save?: "database-not-connected" | "error" | "saved" }> }) {
  const query = await searchParams;
  const data = await loadDashboard();
  const { medications, recipient, canManageMedications } = data;
  const careRecipientId = recipient.id;

  return (
    <main className="main app-main">
      <header className="page-head"><div><p className="eyebrow">Medications</p><h2>Medication schedule</h2><p className="muted">Track dosage, instructions, and refill dates.</p></div></header>
      <SaveStatusNotice status={query?.save} />
      <section className="grid-2">
        <article className="panel"><div className="panel-head"><h3>Active medications</h3></div><div className="rows">
          {medications.length === 0 && <div className="row"><strong>No medications yet</strong><span>Add medications, schedules, refill dates, and instructions.</span></div>}
          {medications.map(med => <div className="row" key={med.id}><strong>{med.name} {med.dosage || ""}</strong><span>{med.schedule}</span><span>{med.instructions || "No instructions"} / Refill: {med.refill_due_at ? formatDate(med.refill_due_at) : "Not set"}</span></div>)}
        </div></article>
        <article className="panel"><div className="panel-head"><h3>Add medication</h3></div>{canManageMedications ? <MedicationCreateForm careRecipientId={careRecipientId} /> : <p className="muted">Only the family lead or an invited clinician can add medications.</p>}</article>
      </section>
    </main>
  );
}
