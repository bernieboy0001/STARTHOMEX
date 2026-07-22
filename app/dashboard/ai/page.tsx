import { WandSparkles } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { createCareExtraction } from "./actions";
import { loadDashboard } from "../data";
import { SaveStatusNotice } from "@/components/save-status-notice";

export default async function AiPage({ searchParams }: { searchParams?: Promise<{ save?: "database-not-connected" | "error" | "saved" }> }) {
  const query = await searchParams;
  const data = await loadDashboard();
  const { recipient } = data;
  const aiConfigured = Boolean(process.env.GEMINI_API_KEY);
  const careRecipientId = recipient.id;
  let extractions: { id: string; summary: string; suggested_tasks: string[] | null }[] = [];
  try {
    const admin = createAdminClient();
    const { data: extractionRows } = await admin.from("care_extractions").select("*").eq("care_recipient_id", recipient.id).order("created_at", { ascending: false }).limit(5);
    extractions = extractionRows || [];
  } catch (error) {
    console.error("AI extraction load failed", error);
  }

  return (
    <main className="main app-main">
      <header className="page-head">
        <div>
          <p className="eyebrow">Smart extraction</p>
          <h2>Turn care text into a clearer plan</h2>
          <p className="muted">Paste discharge instructions, aide notes, or appointment summaries and HOMEX will pull out a summary, action items, and red flags.</p>
        </div>
      </header>
      <SaveStatusNotice status={query?.save} />
      {!aiConfigured && <p className="notice"><strong>AI is not connected yet.</strong><span>HOMEX can still organize key sentences, but add a server-side Gemini key to generate AI summaries.</span></p>}
      <section className="grid-2">
        <article className="panel">
          <div className="panel-head"><h3>Extract from text</h3><WandSparkles size={20} /></div>
          <form className="form" action={createCareExtraction}>
            <input type="hidden" name="careRecipientId" value={careRecipientId} />
            <label>Care text <textarea name="sourceText" placeholder="Paste discharge note, medication instruction, or home-care update..." required rows={10} /></label>
            <button className="button" type="submit">{aiConfigured ? "Generate care summary" : "Organize care text"}</button>
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
