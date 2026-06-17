import { WandSparkles } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { createCareExtraction } from "./actions";
import { loadDashboard } from "../data";

export default async function AiPage() {
  const { recipient, demo } = await loadDashboard();
  const careRecipientId = demo ? "00000000-0000-0000-0000-000000000000" : recipient.id;
  const admin = demo ? null : createAdminClient();
  const { data: extractions } = admin
    ? await admin.from("care_extractions").select("*").eq("care_recipient_id", recipient.id).order("created_at", { ascending: false }).limit(5)
    : { data: [] };

  return (
    <main className="main app-main">
      <header className="page-head">
        <div>
          <p className="eyebrow">Smart extraction</p>
          <h2>Turn care text into a clearer plan</h2>
          <p className="muted">Paste discharge instructions, aide notes, or appointment summaries and HOMEX will pull out a summary, action items, and red flags.</p>
        </div>
      </header>
      <section className="grid-2">
        <article className="panel">
          <div className="panel-head"><h3>Extract from text</h3><WandSparkles size={20} /></div>
          <form className="form" action={createCareExtraction}>
            <input type="hidden" name="careRecipientId" value={careRecipientId} />
            <textarea name="sourceText" placeholder="Paste discharge note, medication instruction, or home-care update..." required disabled={demo} rows={10} />
            <button className="button" type="submit" disabled={demo}>Extract care summary</button>
          </form>
        </article>
        <article className="panel">
          <div className="panel-head"><h3>Recent extractions</h3></div>
          <div className="rows">
            {(!extractions || extractions.length === 0) && <div className="row"><strong>No extraction yet</strong><span>Paste text to create the first structured summary.</span></div>}
            {(extractions || []).map(item => (
              <div className="row" key={item.id}>
                <strong>{item.summary}</strong>
                <span>{(item.suggested_tasks || []).slice(0, 3).join(" / ") || "No action items found."}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
