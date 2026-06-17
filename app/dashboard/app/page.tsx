import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import Link from "next/link";

export default function AppInstallPage() {
  return (
    <main className="main app-main">
      <header className="page-head"><div><p className="eyebrow">Phone app</p><h2>Install HOMEX on your phone</h2><p className="muted">This is a PWA now. It installs from the browser and opens like an app.</p></div></header>
      <section className="grid-2">
        <article className="panel">
          <div className="panel-head"><h3>Install on Android / Chrome</h3></div>
          <div className="rows">
            <PwaInstallPrompt />
            <div className="row"><strong>If no button appears</strong><span>Open Chrome menu and choose Install app or Add to Home screen.</span></div>
          </div>
        </article>
        <article className="panel">
          <div className="panel-head"><h3>Install on iPhone / Safari</h3></div>
          <div className="rows">
            <div className="row"><strong>Step 1</strong><span>Open HOMEX in Safari, not inside Instagram, WhatsApp, or another in-app browser.</span></div>
            <div className="row"><strong>Step 2</strong><span>Tap the Share button.</span></div>
            <div className="row"><strong>Step 3</strong><span>Choose Add to Home Screen, then tap Add.</span></div>
          </div>
        </article>
      </section>
      <section className="panel app-section">
        <div className="panel-head"><h3>What works now</h3></div>
        <div className="rows">
          <div className="row"><strong>Installable app shell</strong><span>HOMEX can sit on the phone home screen with its logo.</span></div>
          <div className="row"><strong>Offline dashboard snapshot</strong><span>After opening the dashboard, key tasks, medications, visits, reminders, notes, contacts, and emergency details are cached on this device.</span></div>
          <div className="row"><strong>Push reminder setup</strong><span><Link href="/dashboard/reminders">Enable notifications</Link> and create circle reminders.</span></div>
          <div className="row"><strong>Camera document scanning</strong><span><Link href="/dashboard/documents">Open Documents</Link> and use Scan or upload from a phone.</span></div>
          <div className="row"><strong>Voice notes</strong><span><Link href="/dashboard/notes">Open Notes</Link> and record quick spoken updates.</span></div>
          <div className="row"><strong>Native wrapper path</strong><span>The Capacitor config is ready; App Store and Play Store release still need developer accounts and native build tools.</span></div>
        </div>
      </section>
    </main>
  );
}
