import Link from "next/link";

export function AuthForms({ disabled }: { disabled: boolean }) {
  return (
    <section className="auth-grid">
      <article className="panel">
        <p className="eyebrow">Create account</p>
        <h2>Start a care circle</h2>
        <p className="muted">The first user creates the circle, then invites trusted family members from the dashboard.</p>
        <form className="form" action="/auth/password" method="post">
          <input type="hidden" name="mode" value="sign-up" />
          <input name="fullName" placeholder="Full name" required disabled={disabled} />
          <input name="email" type="email" placeholder="you@example.com" required disabled={disabled} />
          <input name="password" type="password" placeholder="Password, 8+ characters" minLength={8} required disabled={disabled} />
          <button className="button" type="submit" disabled={disabled}>Create account</button>
        </form>
      </article>

      <article className="panel">
        <p className="eyebrow">Secure access</p>
        <h2>Sign in</h2>
        <p className="muted">Use your password, or request a Supabase magic link if you prefer email-only access.</p>
        <form className="form" action="/auth/password" method="post">
          <input type="hidden" name="mode" value="sign-in" />
          <input name="email" type="email" placeholder="you@example.com" required disabled={disabled} />
          <input name="password" type="password" placeholder="Password" minLength={8} required disabled={disabled} />
          <button className="button" type="submit" disabled={disabled}>Sign in</button>
        </form>
        <form className="form compact-form" action="/auth/magic-link" method="post">
          <input type="hidden" name="next" value="/dashboard" />
          <input name="email" type="email" placeholder="you@example.com" required disabled={disabled} />
          <button className="ghost" type="submit" disabled={disabled}>Email me a magic link</button>
        </form>
        <p className="muted small-copy">Joining a family circle? Open the invite link your family lead shared.</p>
        <Link className="ghost" href="/">Back home</Link>
      </article>
    </section>
  );
}
