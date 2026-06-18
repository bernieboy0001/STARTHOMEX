import { createDocument } from "../actions";
import { DocumentCameraUpload } from "@/components/document-camera-upload";
import { loadDashboard } from "../data";

export default async function DocumentsPage() {
  const { documents, recipient } = await loadDashboard();
  const careRecipientId = recipient.id;

  return (
    <main className="main app-main">
      <header className="page-head"><div><p className="eyebrow">Documents</p><h2>Care document vault</h2><p className="muted">Keep care links, discharge papers, insurance notes, and important files easy to find.</p></div></header>
      <section className="grid-2">
        <article className="panel"><div className="panel-head"><h3>Saved documents</h3></div><div className="rows">
          {documents.length === 0 && <div className="row"><strong>No documents yet</strong><span>Add discharge papers, medication lists, insurance notes, or shared links.</span></div>}
          {documents.map(doc => <div className="row" key={doc.id}><strong>{doc.external_url ? <a href={doc.external_url} target="_blank" rel="noreferrer">{doc.title}</a> : doc.title}</strong><span>{doc.category} / {doc.notes || "No notes"}</span></div>)}
        </div></article>
        <article className="panel"><div className="panel-head"><h3>Add document link</h3></div><form className="form" action={createDocument}>
          <input type="hidden" name="careRecipientId" value={careRecipientId} /><input name="title" placeholder="Document title" required /><input name="category" placeholder="Category" required /><input name="externalUrl" type="url" placeholder="Optional secure link" /><textarea name="notes" placeholder="Notes" /><button className="button" type="submit">Add document</button>
        </form></article>
        <article className="panel"><div className="panel-head"><h3>Camera scan</h3></div><DocumentCameraUpload careRecipientId={careRecipientId} /></article>
      </section>
    </main>
  );
}
