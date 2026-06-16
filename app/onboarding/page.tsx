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
          <input name="organizationName" placeholder="Family or household name" required />
          <input name="recipientName" placeholder="Person receiving care" required />
          <select name="primaryCondition" defaultValue="">
            <option value="">Choose care focus or leave general</option>
            <option value="General elder care">General elder care</option>
            <option value="Post-hospital recovery">Post-hospital recovery</option>
            <option value="Dementia or memory support">Dementia or memory support</option>
            <option value="Stroke recovery">Stroke recovery</option>
            <option value="Medication coordination">Medication coordination</option>
            <option value="Mobility and fall prevention">Mobility and fall prevention</option>
            <option value="Chronic illness support">Chronic illness support</option>
            <option value="Home aide coordination">Home aide coordination</option>
          </select>
          <input name="recoveryStatus" placeholder="Current situation, e.g. needs daily check-ins" required />
          <select name="fallRisk" defaultValue="moderate">
            <option value="unknown">Fall risk unknown</option>
            <option value="low">Low fall risk</option>
            <option value="moderate">Moderate fall risk</option>
            <option value="high">High fall risk</option>
          </select>
          <textarea name="emergencySummary" placeholder="Important emergency info, allergies, contacts, or risks" />
          <input name="diagnosis" placeholder="Diagnosis or care reason, if there is one" />
          <textarea name="goals" placeholder="Care goals, one per line or comma-separated" />
          <textarea name="redFlags" placeholder="Warning signs to watch for, one per line or comma-separated" />
          <textarea name="restrictions" placeholder="Restrictions or special instructions, one per line or comma-separated" />
          <button className="button" type="submit">Create care circle</button>
        </form>
      </section>
    </main>
  );
}
