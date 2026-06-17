"use client";

import { useRef, useState } from "react";

export function VoiceNoteRecorder({ careRecipientId, disabled }: { careRecipientId: string; disabled?: boolean }) {
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const [status, setStatus] = useState("Ready");

  async function start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    chunks.current = [];
    recorder.current = new MediaRecorder(stream);
    recorder.current.ondataavailable = event => chunks.current.push(event.data);
    recorder.current.onstop = async () => {
      const blob = new Blob(chunks.current, { type: "audio/webm" });
      const formData = new FormData();
      formData.set("careRecipientId", careRecipientId);
      formData.set("file", blob, `voice-note-${Date.now()}.webm`);
      setStatus("Uploading...");
      const response = await fetch("/api/voice-notes/upload", { method: "POST", body: formData });
      setStatus(response.ok ? "Voice note saved." : "Upload failed.");
      if (response.ok) window.location.reload();
    };
    recorder.current.start();
    setStatus("Recording...");
  }

  function stop() {
    recorder.current?.stop();
    recorder.current?.stream.getTracks().forEach(track => track.stop());
  }

  return (
    <div className="stack gap-sm">
      <p className="muted">{status}</p>
      <div className="button-row">
        <button className="button" type="button" onClick={start} disabled={disabled}>Record</button>
        <button className="button secondary" type="button" onClick={stop} disabled={disabled}>Stop and save</button>
      </div>
    </div>
  );
}
