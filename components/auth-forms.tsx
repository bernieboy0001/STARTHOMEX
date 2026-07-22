"use client";

import Link from "next/link";
import { ArrowRight, KeyRound, ShieldCheck, UserRoundPlus } from "lucide-react";
import { useState } from "react";

export function AuthForms({ disabled }: { disabled: boolean }) {
  const [mode, setMode] = useState<"sign-up" | "sign-in">("sign-up");

  return (
    <section className="auth-workspace">
      <aside className="auth-aside">
        <Link href="/" className="auth-brand"><img src="/homex-logo.png" alt="HOMEX" /><span>HOMEX</span></Link>
        <div>
          <p className="eyebrow">Care, made clearer</p>
          <h1>One calm place for the people who show up.</h1>
          <p>Coordinate tasks, visits, medication and family updates without chasing messages.</p>
        </div>
        <div className="auth-reassurance"><ShieldCheck size={18} /><span>Private care-circle access</span></div>
      </aside>
      <article className="auth-card">
        <div className="auth-card-head">
          <p className="eyebrow">Welcome to HOMEX</p>
          <h2>{mode === "sign-up" ? "Start a care circle" : "Welcome back"}</h2>
          <p className="muted">{mode === "sign-up" ? "Create the first account, then invite the people you trust." : "Sign in to continue caring together."}</p>
        </div>
        <div className="auth-switch" role="tablist" aria-label="Account access">
          <button type="button" className={mode === "sign-up" ? "is-active" : ""} onClick={() => setMode("sign-up")}><UserRoundPlus size={16} />Create account</button>
          <button type="button" className={mode === "sign-in" ? "is-active" : ""} onClick={() => setMode("sign-in")}><KeyRound size={16} />Sign in</button>
        </div>
        {mode === "sign-up" ? <form className="form auth-form" action="/auth/password" method="post">
          <input type="hidden" name="mode" value="sign-up" />
          <label>Full name<input name="fullName" autoComplete="name" required disabled={disabled} /></label>
          <label>Email address<input name="email" type="email" autoComplete="email" required disabled={disabled} /></label>
          <label>Password<input name="password" type="password" autoComplete="new-password" minLength={8} required disabled={disabled} /></label>
          <p className="form-hint">Use at least 8 characters. We will ask you to confirm your email.</p>
          <button className="button auth-submit" type="submit" disabled={disabled}>Create secure account <ArrowRight size={18} /></button>
        </form> : <div className="auth-form-stack">
          <form className="form auth-form" action="/auth/password" method="post">
            <input type="hidden" name="mode" value="sign-in" />
            <label>Email address<input name="email" type="email" autoComplete="email" required disabled={disabled} /></label>
            <label>Password<input name="password" type="password" autoComplete="current-password" minLength={8} required disabled={disabled} /></label>
            <button className="button auth-submit" type="submit" disabled={disabled}>Sign in <ArrowRight size={18} /></button>
          </form>
          <form className="magic-access" action="/auth/magic-link" method="post">
            <input type="hidden" name="next" value="/dashboard" />
            <span>Prefer email-only access?</span>
            <input name="email" type="email" placeholder="you@example.com" required disabled={disabled} />
            <button className="ghost" type="submit" disabled={disabled}>Send a sign-in link</button>
          </form>
        </div>}
        <p className="auth-footnote">Joining an existing circle? Open the invite link your family lead shared.</p>
      </article>
    </section>
  );
}
