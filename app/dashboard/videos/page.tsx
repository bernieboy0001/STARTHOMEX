import { VideoUploadForm } from "@/components/video-upload-form";
import { createVideo } from "../actions";
import { loadDashboard } from "../data";
import type { CareVideo } from "@/lib/types";

function videoFrame(video: CareVideo) {
  if (video.embed_url) return <iframe src={video.embed_url} title={video.title} allowFullScreen loading="lazy" />;
  if (video.playback_url) return <video src={video.playback_url} controls preload="metadata" />;
  return null;
}

export default async function VideosPage() {
  const { videos, recipient } = await loadDashboard();
  const careRecipientId = recipient.id;

  return (
    <main className="main app-main">
      <header className="page-head"><div><p className="eyebrow">Care videos</p><h2>Training and walkthroughs</h2><p className="muted">Attach caregiver training and family instructions to the care plan.</p></div></header>
      <section className="grid-2">
        <article className="panel"><div className="panel-head"><h3>Video library</h3></div><div className="video-grid">{videos.map(video => <article className="video-card" key={video.id}><div className="video-frame">{videoFrame(video)}</div><div className="video-body"><strong>{video.title}</strong><span>{video.category}</span><span>{video.description}</span></div></article>)}</div></article>
        <article className="panel"><div className="panel-head"><h3>Add care video</h3></div><form className="form" action={createVideo}><input type="hidden" name="careRecipientId" value={careRecipientId} /><input name="title" placeholder="Safe transfer walkthrough" required /><input name="category" placeholder="Mobility" required /><input name="embedUrl" placeholder="YouTube/Vimeo embed URL" /><textarea name="description" placeholder="When should the family or aide watch this?" /><button className="button" type="submit">Add care video</button></form><div style={{ marginTop: 16 }}><p className="eyebrow">Upload caretaker video</p><VideoUploadForm careRecipientId={careRecipientId} /></div></article>
      </section>
    </main>
  );
}
