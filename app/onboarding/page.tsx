import { createCareCircle } from "./actions";

export default function OnboardingPage() {
  return (
    <main className="main">
      <section className="panel" style={{ maxWidth: 820, margin: "4vh auto" }}>
        <p className="eyebrow">Create care circle</p>
        <h2>Set up the first home recovery plan.</h2>
        <p className="muted">
          This creates the family organization, care recipient, family lead membership, and first discharge plan.
        </p>
        <form className="form" action={createCareCircle}>
          <input name="organizationName" placeholder="Carter family care circle" required />
          <input name="recipientName" placeholder="Evelyn Carter" required />
          <input name="primaryCondition" placeholder="Hip fracture repair" required />
          <input name="recoveryStatus" placeholder="Day 6 after hospital discharge" required />
          <select name="fallRisk" defaultValue="moderate">
            <option value="low">Low fall risk</option>
            <option value="moderate">Moderate fall risk</option>
            <option value="high">High fall risk</option>
          </select>
          <textarea name="emergencySummary" placeholder="Emergency summary families and aides should know" required />
          <input name="diagnosis" placeholder="Discharge diagnosis" required />
          <textarea name="redFlags" placeholder="Red flags, one per line" required />
          <textarea name="restrictions" placeholder="Restrictions, one per line" required />
          <button className="button" type="submit">Create care circle</button>
        </form>
      </section>
    </main>
  );
}
