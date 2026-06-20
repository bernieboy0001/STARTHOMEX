import Link from "next/link";

export function DashboardAuthRequired() {
  return (
    <main className="main app-main">
      <section className="panel">
        <div className="panel-head">
          <h3>Session not detected</h3>
        </div>
        <div className="rows">
          <div className="row">
            <strong>HOMEX could not see a signed-in session for this page.</strong>
            <span>Use the sign-in page once, then return to the dashboard. The sidebar will stay here instead of bouncing every click.</span>
          </div>
          <div className="actions">
            <Link className="button" href="/sign-in">Sign in</Link>
            <Link className="ghost" href="/">Home</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
