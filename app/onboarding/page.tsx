import { createCareCircle } from "./actions";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function OnboardingPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  const query = await searchParams;

  return (
    <main className="main">
      <div className="top-tools">
        <ThemeToggle />
      </div>
      <section className="panel" style={{ maxWidth: 820, margin: "4vh auto" }}>
        <p className="eyebrow">Create care circle</p>
        <h2>Set up the first care plan.</h2>
        <p className="muted">
          Start with what you know. You can use this for post-discharge recovery, dementia support,
          medication coordination, mobility help, chronic illness care, or general elder care at home.
        </p>
        {query?.error && <p className="notice"><strong>Setup error</strong><span>{query.error}</span></p>}
        <form className="form" action={createCareCircle}>
          <p className="form-intro">Start with the essentials. You can add or change detail later.</p>
          <label>Household or care team name <input name="organizationName" placeholder="e.g. Carter family" required /></label>
          <label>Person receiving care <input name="recipientName" placeholder="Full name" required /></label>
          <label>Care focus <select name="primaryCondition" defaultValue="">
            <option value="">Choose care focus or leave general</option>
            <option value="General elder care">General elder care</option>
            <option value="Post-hospital recovery">Post-hospital recovery</option>
            <option value="Dementia or memory support">Dementia or memory support</option>
            <option value="Stroke recovery">Stroke recovery</option>
            <option value="Medication coordination">Medication coordination</option>
            <option value="Mobility and fall prevention">Mobility and fall prevention</option>
            <option value="Chronic illness support">Chronic illness support</option>
            <option value="Home aide coordination">Home aide coordination</option>
          </select></label>
          <label>Current situation <input name="recoveryStatus" placeholder="e.g. needs daily check-ins" required /></label>
          <label>Fall risk <select name="fallRisk" defaultValue="moderate">
            <option value="unknown">Fall risk unknown</option>
            <option value="low">Low fall risk</option>
            <option value="moderate">Moderate fall risk</option>
            <option value="high">High fall risk</option>
          </select></label>
          <label>Emergency information <textarea name="emergencySummary" placeholder="Allergies, urgent contacts, or risks" /></label>
          <label>Diagnosis or care reason <input name="diagnosis" placeholder="Optional" /></label>
          <label>Care goals <textarea name="goals" placeholder="One per line or comma-separated" /></label>
          <label>Warning signs <textarea name="redFlags" placeholder="One per line or comma-separated" /></label>
          <label>Restrictions or instructions <textarea name="restrictions" placeholder="One per line or comma-separated" /></label>
          <button className="button" type="submit">Create care circle</button>
        </form>
      </section>
    </main>
  );
}
