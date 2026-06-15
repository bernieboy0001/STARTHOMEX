import Link from "next/link";
import { sendMagicLink, signInWithPassword, signUpWithPassword } from "./actions";

export default async function SignInPage({ searchParams }: { searchParams?: Promise<{ error?: string; sent?: string }> }) {
  const params = await searchParams;
  const demo = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return (
    <main className="main">
      <section className="auth-grid">
        <article className="panel">
          <p className="eyebrow">Create account</p>
          <h2>Start a care circle</h2>
          <p className="muted">The first user creates the circle, then invites trusted family members from the dashboard.</p>
          {demo && <p className="notice"><strong>Supabase is not connected yet.</strong><span>Add the environment variables in Vercel, then redeploy.</span></p>}
          {params?.error && <p className="notice"><strong>Auth error</strong><span>{params.error}</span></p>}
          {params?.sent === "signup" && <p className="row">Account created. If email confirmation is on, check your inbox before signing in.</p>}
          <form className="form" action={signUpWithPassword}>
            <input name="fullName" placeholder="Full name" required disabled={demo} />
            <input name="email" type="email" placeholder="you@example.com" required disabled={demo} />
            <input name="password" type="password" placeholder="Password, 8+ characters" minLength={8} required disabled={demo} />
            <button className="button" type="submit" disabled={demo}>Create account</button>
          </form>
        </article>

        <article className="panel">
          <p className="eyebrow">Secure access</p>
          <h2>Sign in</h2>
          <p className="muted">Use your password, or request a Supabase magic link if you prefer email-only access.</p>
          {params?.sent === "1" && <p className="row">Check your email for the sign-in link.</p>}
          <form className="form" action={signInWithPassword}>
            <input name="email" type="email" placeholder="you@example.com" required disabled={demo} />
            <input name="password" type="password" placeholder="Password" required disabled={demo} />
            <button className="button" type="submit" disabled={demo}>Sign in</button>
          </form>
          <form className="form compact-form" action={sendMagicLink}>
            <input name="email" type="email" placeholder="you@example.com" required disabled={demo} />
            <button className="ghost" type="submit" disabled={demo}>Email me a magic link</button>
          </form>
          <p className="muted small-copy">Joining a family circle? Open the invite link your family lead shared.</p>
          <Link className="ghost" href="/">Back home</Link>
        </article>
      </section>
    </main>
  );
}
