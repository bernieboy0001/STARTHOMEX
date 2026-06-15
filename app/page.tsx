import Link from "next/link";

export default function HomePage() {
  return (
    <main className="hero">
      <section className="hero-content">
        <p className="eyebrow">Home recovery coordination</p>
        <h1>Bring your loved one home with everyone on the same page.</h1>
        <p>
          HOMEX keeps discharge instructions, family tasks, medication schedules, aide notes,
          documents, visits, and caregiver videos organized in one secure place.
        </p>
        <div className="actions">
          <Link className="button" href="/dashboard">View care dashboard</Link>
          <Link className="ghost" href="/sign-in">Sign in</Link>
        </div>
      </section>
    </main>
  );
}
