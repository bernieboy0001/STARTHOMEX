import { createNote } from "../actions";
import { VoiceNoteRecorder } from "@/components/voice-note-recorder";
import { loadDashboard } from "../data";
import { SaveStatusNotice } from "@/components/save-status-notice";

export default async function NotesPage({ searchParams }: { searchParams?: Promise<{ save?: "database-not-connected" | "error" | "saved" }> }) {
  const query = await searchParams;
  const data = await loadDashboard();
  const { notes, recipient, voiceNotes } = data;
  const careRecipientId = recipient.id;

  return (
    <main className="main app-main">
      <header className="page-head"><div><p className="eyebrow">Care notes</p><h2>Daily updates</h2><p className="muted">Log changes, handoffs, family updates, aide notes, and red flags.</p></div></header>
      <SaveStatusNotice status={query?.save} />
      <section className="grid-2">
        <article className="panel"><div className="panel-head"><h3>Recent notes</h3></div><div className="rows">{notes.map(note => <div className="row" key={note.id}><strong>{note.author_name}</strong><span>{note.body}</span></div>)}</div></article>
        <article className="panel"><div className="panel-head"><h3>Share an update</h3></div><form className="form" action={createNote}><input type="hidden" name="careRecipientId" value={careRecipientId} /><label>Your name <input name="authorName" placeholder="Who is sharing this update?" required /></label><label>Update <textarea name="body" placeholder="What changed today?" required /></label><button className="button" type="submit">Share update</button></form></article>
        <article className="panel"><div className="panel-head"><h3>Voice note</h3></div><VoiceNoteRecorder careRecipientId={careRecipientId} /></article>
        <article className="panel"><div className="panel-head"><h3>Recorded voice notes</h3></div><div className="rows">{voiceNotes.length === 0 && <div className="row"><strong>No voice notes yet</strong><span>Recorded updates will be playable here.</span></div>}{voiceNotes.map(note => <div className="row" key={note.id}><strong>{note.title}</strong><audio controls preload="metadata" src={note.download_url || undefined} /></div>)}</div></article>
      </section>
    </main>
  );
}
