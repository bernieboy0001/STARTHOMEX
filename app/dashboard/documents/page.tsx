import { ExternalLink } from "lucide-react";
import { createDocument } from "../actions";
import { DocumentCameraUpload } from "@/components/document-camera-upload";
import { SaveStatusNotice } from "@/components/save-status-notice";
import { loadDashboard } from "../data";

export default async function DocumentsPage({ searchParams }: { searchParams?: Promise<{ save?: "database-not-connected" | "error" | "saved" }> }) {
  const query = await searchParams;
  const data = await loadDashboard();
  const { documents, recipient } = data;
  const careRecipientId = recipient.id;

  return (
    <main className="main app-main">
      <header className="page-head"><div><p className="eyebrow">Documents</p><h2>Care document vault</h2><p className="muted">Keep care links, discharge papers, insurance notes, and important files easy to find.</p></div></header>
      <SaveStatusNotice status={query?.save} />
      <section className="grid-2">
        <article className="panel"><div className="panel-head"><h3>Saved documents</h3></div><div className="rows">
          {documents.length === 0 && <div className="row"><strong>No documents yet</strong><span>Add discharge papers, medication lists, insurance notes, or shared links.</span></div>}
          {documents.map(doc => <div className="row" key={doc.id}><strong>{doc.title}</strong><span>{doc.category} / {doc.notes || "No notes"}</span>{(doc.external_url || doc.download_url) && <a className="document-open" href={doc.external_url || doc.download_url || undefined} target="_blank" rel="noreferrer"><ExternalLink size={16} />Open document</a>}</div>)}
        </div></article>
        <article className="panel"><div className="panel-head"><h3>Add document link</h3></div><form className="form" action={createDocument}>
          <input type="hidden" name="careRecipientId" value={careRecipientId} /><label>Document name <input name="title" placeholder="e.g. Discharge summary" required /></label><label>Category <input name="category" placeholder="e.g. Medical record" required /></label><label>Secure link <input name="externalUrl" type="url" placeholder="Optional" /></label><label>Notes <textarea name="notes" placeholder="What should the circle know?" /></label><button className="button" type="submit">Add document</button>
        </form></article>
        <article className="panel"><div className="panel-head"><h3>Camera scan</h3></div><DocumentCameraUpload careRecipientId={careRecipientId} /></article>
      </section>
    </main>
  );
}
