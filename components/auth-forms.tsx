"use client";

import { useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

type AuthStatus = {
  type: "idle" | "error" | "success";
  message: string;
};

function supabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export function AuthForms({ disabled }: { disabled: boolean }) {
  const [status, setStatus] = useState<AuthStatus>({ type: "idle", message: "" });
  const [busy, setBusy] = useState(false);

  async function signUp(formData: FormData) {
    setBusy(true);
    setStatus({ type: "idle", message: "" });

    const fullName = String(formData.get("fullName") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const supabase = supabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`
      }
    });

    setBusy(false);
    if (error) {
      setStatus({ type: "error", message: error.message });
      return;
    }

    if (data.session) {
      window.location.assign("/onboarding");
      return;
    }

    setStatus({ type: "success", message: "Account created. Check your email if Supabase asks for confirmation, then sign in." });
  }

  async function signIn(formData: FormData) {
    setBusy(true);
    setStatus({ type: "idle", message: "" });

    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const supabase = supabaseClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setBusy(false);
    if (error) {
      setStatus({ type: "error", message: error.message });
      return;
    }

    window.location.assign("/dashboard");
  }

  async function sendMagicLink(formData: FormData) {
    setBusy(true);
    setStatus({ type: "idle", message: "" });

    const email = String(formData.get("email") || "").trim();
    const supabase = supabaseClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`
      }
    });

    setBusy(false);
    if (error) {
      setStatus({ type: "error", message: error.message });
      return;
    }

    setStatus({ type: "success", message: "Check your email for the sign-in link." });
  }

  return (
    <>
      {status.message && <p className="notice"><strong>{status.type === "error" ? "Auth error" : "Auth update"}</strong><span>{status.message}</span></p>}
      <section className="auth-grid">
        <article className="panel">
          <p className="eyebrow">Create account</p>
          <h2>Start a care circle</h2>
          <p className="muted">The first user creates the circle, then invites trusted family members from the dashboard.</p>
          <form className="form" action={signUp}>
            <input name="fullName" placeholder="Full name" required disabled={disabled || busy} />
            <input name="email" type="email" placeholder="you@example.com" required disabled={disabled || busy} />
            <input name="password" type="password" placeholder="Password, 8+ characters" minLength={8} required disabled={disabled || busy} />
            <button className="button" type="submit" disabled={disabled || busy}>Create account</button>
          </form>
        </article>

        <article className="panel">
          <p className="eyebrow">Secure access</p>
          <h2>Sign in</h2>
          <p className="muted">Use your password, or request a Supabase magic link if you prefer email-only access.</p>
          <form className="form" action={signIn}>
            <input name="email" type="email" placeholder="you@example.com" required disabled={disabled || busy} />
            <input name="password" type="password" placeholder="Password" required disabled={disabled || busy} />
            <button className="button" type="submit" disabled={disabled || busy}>Sign in</button>
          </form>
          <form className="form compact-form" action={sendMagicLink}>
            <input name="email" type="email" placeholder="you@example.com" required disabled={disabled || busy} />
            <button className="ghost" type="submit" disabled={disabled || busy}>Email me a magic link</button>
          </form>
          <p className="muted small-copy">Joining a family circle? Open the invite link your family lead shared.</p>
          <Link className="ghost" href="/">Back home</Link>
        </article>
      </section>
    </>
  );
}
