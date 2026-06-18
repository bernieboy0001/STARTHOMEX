import { createNote } from "../actions";
import Link from "next/link";
import { VoiceNoteRecorder } from "@/components/voice-note-recorder";
import { loadDashboard } from "../data";

export default async function NotesPage() {
  const { notes, recipient, demo } = await loadDashboard();
  const careRecipientId = demo ? "00000000-0000-0000-0000-000000000000" : recipient.id;

  return (
    <main className="main app-main">
      <header className="page-head"><div><p className="eyebrow">Care notes</p><h2>Daily updates</h2><p className="muted">Log changes, handoffs, family updates, aide notes, and red flags.</p></div></header>
      <section className="grid-2">
        <article className="panel"><div className="panel-head"><h3>Recent notes</h3></div><div className="rows">{notes.map(note => <div className="row" key={note.id}><strong>{note.author_name}</strong><span>{note.body}</span></div>)}</div></article>
        <article className="panel"><div className="panel-head"><h3>Add care note</h3></div><form className="form" action={createNote}><input type="hidden" name="careRecipientId" value={careRecipientId} /><input name="authorName" placeholder="Author" required /><textarea name="body" placeholder="What changed today?" required />{demo ? <Link className="button" href="/sign-in">Sign in to save</Link> : <button className="button" type="submit">Add note</button>}</form></article>
        <article className="panel"><div className="panel-head"><h3>Voice note</h3></div><VoiceNoteRecorder careRecipientId={careRecipientId} disabled={demo} /></article>
      </section>
    </main>
  );
}
