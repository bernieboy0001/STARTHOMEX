import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { acceptCurrentSessionInvite, emailInviteMagicLink, signInAndAcceptInvite, signUpAndAcceptInvite } from "./actions";
import { AcceptConfirmedInvite } from "@/components/accept-confirmed-invite";

async function loadInvite(token: string) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("care_circle_invites")
    .select("token, role, invited_email, accepted_at, revoked_at, expires_at, care_recipients(full_name), organizations(name)")
    .eq("token", token)
    .single();

  return data;
}

export default async function JoinPage({
  params,
  searchParams
}: {
  params: Promise<{ token: string }>;
  searchParams?: Promise<{ confirmed?: string; error?: string; sent?: string }>;
}) {
  const { token } = await params;
  const query = await searchParams;
  const invite = await loadInvite(token);
  const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ? await createClient() : null;
  const { data } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  if (!invite) redirect("/sign-in?error=Invite%20link%20not%20found");

  const recipient = Array.isArray(invite.care_recipients) ? invite.care_recipients[0] : invite.care_recipients;
  const organization = Array.isArray(invite.organizations) ? invite.organizations[0] : invite.organizations;

  return (
    <main className="main">
      <section className="auth-grid">
        <article className="panel">
          <p className="eyebrow">Family invite</p>
          <h2>Join {organization?.name || "this care circle"}</h2>
          <p className="muted">
            You were invited to help coordinate care for {recipient?.full_name || "a loved one"} as a {invite.role.replace("_", " ")}.
          </p>
          {invite.revoked_at && <p className="notice"><strong>Invite revoked</strong><span>Ask the family lead for a new link.</span></p>}
          {invite.accepted_at && <p className="notice"><strong>Invite already used</strong><span>Sign in with the account that accepted it.</span></p>}
          {query?.error && <p className="notice"><strong>Invite error</strong><span>{query.error}</span></p>}
          {query?.sent === "1" && <p className="row">Check your email for the magic link, then return here to finish joining.</p>}
          {data.user && query?.confirmed === "1" && !invite.accepted_at && !invite.revoked_at && <AcceptConfirmedInvite token={token} />}
          {data.user && query?.confirmed !== "1" && !invite.accepted_at && !invite.revoked_at && (
            <form className="form" action={acceptCurrentSessionInvite}>
              <input type="hidden" name="token" value={token} />
              <button className="button" type="submit">Accept invite as {data.user.email}</button>
            </form>
          )}
        </article>

        {!data.user && (
          <>
            <article className="panel">
              <p className="eyebrow">New family member</p>
              <h2>Create account</h2>
              <form className="form" action={signUpAndAcceptInvite}>
                <input type="hidden" name="token" value={token} />
                <input name="fullName" placeholder="Full name" required />
                <input name="email" type="email" placeholder={invite.invited_email || "you@example.com"} defaultValue={invite.invited_email || ""} required />
                <input name="password" type="password" placeholder="Password, 8+ characters" minLength={8} required />
                <button className="button" type="submit">Create account and join</button>
              </form>
            </article>

            <article className="panel">
              <p className="eyebrow">Already have an account</p>
              <h2>Sign in and join</h2>
              <form className="form" action={signInAndAcceptInvite}>
                <input type="hidden" name="token" value={token} />
                <input name="email" type="email" placeholder={invite.invited_email || "you@example.com"} defaultValue={invite.invited_email || ""} required />
                <input name="password" type="password" placeholder="Password" required />
                <button className="button" type="submit">Sign in and join</button>
              </form>
              <form className="form compact-form" action={emailInviteMagicLink}>
                <input type="hidden" name="token" value={token} />
                <input name="email" type="email" placeholder={invite.invited_email || "you@example.com"} defaultValue={invite.invited_email || ""} required />
                <button className="ghost" type="submit">Email me a magic link</button>
              </form>
            </article>
          </>
        )}
      </section>
    </main>
  );
}
