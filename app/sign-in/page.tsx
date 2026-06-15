import { sendMagicLink } from "./actions";

export default async function SignInPage({ searchParams }: { searchParams?: Promise<{ sent?: string }> }) {
  const params = await searchParams;

  return (
    <main className="main">
      <section className="panel" style={{ maxWidth: 520, margin: "10vh auto" }}>
        <p className="eyebrow">Secure access</p>
        <h2>Sign in</h2>
        <p className="muted">
          Use a magic link to enter your private care circle. The dashboard is protected by
          Supabase row-level security after login.
        </p>
        {params?.sent === "1" && <p className="row">Check your email for the sign-in link.</p>}
        <form className="form" action={sendMagicLink}>
          <input name="email" type="email" placeholder="you@example.com" required />
          <button className="button" type="submit">Send magic link</button>
        </form>
      </section>
    </main>
  );
}
