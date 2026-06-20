import Link from "next/link";
import { DashboardAuthRequired } from "../auth-required";
import { loadDashboard } from "../data";

export default async function CirclesPage() {
  const data = await loadDashboard();
  if (!data) return <DashboardAuthRequired />;
  const { recipients, recipient } = data;

  return (
    <main className="main app-main">
      <header className="page-head">
        <div>
          <p className="eyebrow">Care circles</p>
          <h2>Switch care circle</h2>
          <p className="muted">Use one account to help with more than one loved one or household.</p>
        </div>
        <Link className="button" href="/onboarding">Create new circle</Link>
      </header>
      <section className="panel">
        <div className="panel-head"><h3>Available circles</h3></div>
        <div className="rows">
          {recipients.map(item => (
            <div className="row split-row" key={item.id}>
              <span>
                <strong>{item.full_name}</strong>
                <span>{item.recovery_status || "No status"} / {item.primary_condition || "General home care"}</span>
              </span>
              {item.id === recipient.id ? <span className="pill">Current</span> : <Link className="ghost" href={`/dashboard/select-circle/${item.id}`}>Open</Link>}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
