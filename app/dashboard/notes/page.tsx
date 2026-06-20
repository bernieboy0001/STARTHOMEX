import { DashboardAuthRequired } from "../auth-required";
import { createNote } from "../actions";
import { VoiceNoteRecorder } from "@/components/voice-note-recorder";
import { loadDashboard } from "../data";

export default async function NotesPage() {
  const data = await loadDashboard();
  if (!data) return <DashboardAuthRequired />;
  const { notes, recipient } = data;
  const careRecipientId = recipient.id;

  return (
    <main className="main app-main">
      <header className="page-head"><div><p className="eyebrow">Care notes</p><h2>Daily updates</h2><p className="muted">Log changes, handoffs, family updates, aide notes, and red flags.</p></div></header>
      <section className="grid-2">
        <article className="panel"><div className="panel-head"><h3>Recent notes</h3></div><div className="rows">{notes.map(note => <div className="row" key={note.id}><strong>{note.author_name}</strong><span>{note.body}</span></div>)}</div></article>
        <article className="panel"><div className="panel-head"><h3>Add care note</h3></div><form className="form" action={createNote}><input type="hidden" name="careRecipientId" value={careRecipientId} /><input name="authorName" placeholder="Author" required /><textarea name="body" placeholder="What changed today?" required /><button className="button" type="submit">Add note</button></form></article>
        <article className="panel"><div className="panel-head"><h3>Voice note</h3></div><VoiceNoteRecorder careRecipientId={careRecipientId} /></article>
      </section>
    </main>
  );
}
