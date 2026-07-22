import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/auth";
import { deleteAuthUser, permanentlyDeleteDeactivatedUser, revokeInvite, revokeMembership } from "./actions";

async function loadAdminData() {
  const admin = createAdminClient();
  const [usersResult, membershipsResult, invitesResult, recipientsResult] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 100 }),
    admin
      .from("care_memberships")
      .select("id, user_id, role, created_at, care_recipient_id, organization_id")
      .order("created_at", { ascending: false })
      .limit(100),
    admin
      .from("care_circle_invites")
      .select("id, token, invited_email, role, accepted_at, revoked_at, expires_at, created_at, care_recipient_id, organization_id")
      .order("created_at", { ascending: false })
      .limit(100),
    admin
      .from("care_recipients")
      .select("id, full_name, recovery_status, created_at, organization_id")
      .order("created_at", { ascending: false })
      .limit(100)
  ]);

  return {
    users: usersResult.data.users,
    memberships: membershipsResult.data || [],
    invites: invitesResult.data || [],
    recipients: recipientsResult.data || [],
    error: usersResult.error?.message || membershipsResult.error?.message || invitesResult.error?.message || recipientsResult.error?.message || null
  };
}

const statusMessage = {
  "access-revoked": "Care-circle access revoked.",
  "invite-revoked": "Invite link revoked.",
  "user-deleted": "User deactivated and their care-circle access removed.",
  "user-removed": "Deactivated user permanently removed."
} as const;

export default async function SuperAdminPage({ searchParams }: { searchParams?: Promise<{ error?: string; status?: keyof typeof statusMessage }> }) {
  const query = await searchParams;
  const user = await requireSuperAdmin();
  const { users, memberships, invites, recipients, error } = await loadAdminData();
  const activeUsers = users.filter(account => !account.deleted_at).length;
  const activeInvites = invites.filter(invite => !invite.accepted_at && !invite.revoked_at).length;

  return (
    <div className="shell">
      <aside className="rail">
        <Link href="/" className="brand">
          <img className="brand-logo" src="/homex-logo.png" alt="HOMEX" />
          <span><strong>HOMEX</strong><span>Superadmin</span></span>
        </Link>
        <ThemeToggle />
        <nav className="nav">
          <a href="#users">Users</a>
          <a href="#memberships">Access</a>
          <a href="#invites">Invites</a>
          <a href="#circles">Circles</a>
        </nav>
      </aside>
      <main className="main">
        <header className="page-head">
          <div>
            <p className="eyebrow">Superadmin</p>
            <h2>Platform oversight</h2>
            <p className="muted">Signed in as {user.email}</p>
          </div>
          <Link className="button" href="/dashboard">Care dashboard</Link>
        </header>

        <section className="operations-summary" aria-label="Platform summary">
          <div><strong>{activeUsers}</strong><span>active users</span></div>
          <div><strong>{recipients.length}</strong><span>care circles</span></div>
          <div><strong>{activeInvites}</strong><span>open invites</span></div>
        </section>

        {(query?.error || error) && <p className="notice"><strong>Admin error</strong><span>{query?.error || error}</span></p>}
        {query?.status && statusMessage[query.status] && <p className="notice success-notice"><strong>Updated</strong><span>{statusMessage[query.status]}</span></p>}

        <section className="panel" id="users">
          <div className="panel-head"><h3>Users</h3></div>
          <div className="rows">
            {users.map(account => (
              <div className="row split-row" key={account.id}>
                <span>
                  <strong>{account.email}</strong>
                  <span>{account.deleted_at ? "Deactivated" : "Active"} / Joined {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(account.created_at))}</span>
                </span>
                {account.deleted_at ? <form action={permanentlyDeleteDeactivatedUser}><input type="hidden" name="id" value={account.id} /><button className="ghost danger" type="submit">Delete record</button></form> : <form action={deleteAuthUser}><input type="hidden" name="id" value={account.id} /><button className="ghost danger" type="submit">Deactivate user</button></form>}
              </div>
            ))}
          </div>
        </section>

        <section className="panel" style={{ marginTop: 16 }} id="memberships">
          <div className="panel-head"><h3>Circle access</h3></div>
          <div className="rows">
            {memberships.map(membership => (
              <div className="row split-row" key={membership.id}>
                <span>
                  <strong>{membership.role.replace("_", " ")} access</strong>
                  <span>Care-circle membership</span>
                </span>
                <form action={revokeMembership}>
                  <input type="hidden" name="id" value={membership.id} />
                  <button className="ghost danger" type="submit">Revoke access</button>
                </form>
              </div>
            ))}
          </div>
        </section>

        <section className="panel" style={{ marginTop: 16 }} id="invites">
          <div className="panel-head"><h3>Invite links</h3></div>
          <div className="rows">
            {invites.map(invite => (
              <div className="row split-row" key={invite.id}>
                <span>
                  <strong>{invite.invited_email || "Open invite"} / {invite.role}</strong>
                  <span>{invite.accepted_at ? "Accepted" : invite.revoked_at ? "Revoked" : "Active"}</span>
                </span>
                <form action={revokeInvite}>
                  <input type="hidden" name="id" value={invite.id} />
                  <button className="ghost danger" type="submit" disabled={!!invite.revoked_at}>Revoke link</button>
                </form>
              </div>
            ))}
          </div>
        </section>

        <section className="panel" style={{ marginTop: 16 }} id="circles">
          <div className="panel-head"><h3>Care circles</h3></div>
          <div className="rows">
            {recipients.map(recipient => (
              <div className="row split-row" key={recipient.id}>
                <span>
                  <strong>{recipient.full_name}</strong>
                  <span>{recipient.recovery_status || "No status"}</span>
                </span>
                <Link className="ghost" href={`/dashboard/select-circle/${recipient.id}`}>Open circle</Link>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
