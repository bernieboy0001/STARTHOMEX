import { createContact } from "../actions";
import { createInviteLink, revokeInviteLink, revokeMemberAccess } from "../invite-actions";
import { formatDate, loadDashboard } from "../data";
import { inviteUrl } from "@/lib/invites";
import { SaveStatusNotice } from "@/components/save-status-notice";
import { InviteLinkCopy } from "@/components/invite-link-copy";

export default async function FamilyPage({ searchParams }: { searchParams?: Promise<{ invite?: string; save?: "database-not-connected" | "error" | "saved" }> }) {
  const query = await searchParams;
  const data = await loadDashboard();
  const { recipient, contacts, memberships, invites, canInvite } = data;
  const careRecipientId = recipient.id;
  const latestInviteUrl = query?.invite ? inviteUrl(query.invite) : null;

  return (
    <main className="main app-main">
      <header className="page-head"><div><p className="eyebrow">Family & team</p><h2>Manage trusted access</h2><p className="muted">Invite family, aides, clinicians, and coordinators into this circle.</p></div></header>
      <SaveStatusNotice status={query?.save} />
      <section className="grid-2">
        <article className="panel"><div className="panel-head"><h3>Create invite link</h3></div>
          {canInvite ? <form className="form" action={createInviteLink}><input type="hidden" name="careRecipientId" value={careRecipientId} /><input name="invitedEmail" type="email" placeholder="Optional: family@example.com" /><select name="role" defaultValue="family_member"><option value="family_member">Family member</option><option value="home_aide">Home aide</option><option value="agency_coordinator">Agency coordinator</option><option value="clinician">Clinician</option></select><button className="button" type="submit">Generate invite link</button></form> : <p className="muted">Only the family lead can invite people into this care circle.</p>}
          {latestInviteUrl && <div className="row copy-row"><strong>Share this link</strong><InviteLinkCopy url={latestInviteUrl} /></div>}
        </article>
        <article className="panel"><div className="panel-head"><h3>Members and invites</h3></div><div className="rows">
          {memberships.map(member => (
            <div className="row split-row" key={member.id}>
              <span><strong>{member.full_name || member.email || member.user_id}</strong><span>{member.role.replace("_", " ")} / Joined {formatDate(member.created_at)}</span></span>
              <form action={revokeMemberAccess}><input type="hidden" name="membershipId" value={member.id} /><input type="hidden" name="careRecipientId" value={careRecipientId} /><button className="ghost danger" type="submit">Remove</button></form>
            </div>
          ))}
          {invites.map(invite => (
            <div className="row split-row" key={invite.token}>
              <span><strong>{invite.invited_email || "Open invite"} / {invite.role.replace("_", " ")}</strong><span>{invite.accepted_at ? "Accepted" : invite.revoked_at ? "Revoked" : inviteUrl(invite.token)}</span></span>
              {!invite.revoked_at && !invite.accepted_at && <form action={revokeInviteLink}><input type="hidden" name="token" value={invite.token} /><input type="hidden" name="careRecipientId" value={careRecipientId} /><button className="ghost danger" type="submit">Revoke</button></form>}
            </div>
          ))}
        </div></article>
      </section>
      <section className="grid-2 app-section">
        <article className="panel"><div className="panel-head"><h3>Contacts</h3></div><div className="rows">{contacts.map(contact => <div className="row" key={contact.id}><strong>{contact.name} / {contact.role}</strong><span>{contact.phone || "No phone"} / {contact.email || "No email"}</span><span>{contact.notes}</span></div>)}</div></article>
        <article className="panel"><div className="panel-head"><h3>Add contact</h3></div><form className="form" action={createContact}><input type="hidden" name="careRecipientId" value={careRecipientId} /><input name="name" placeholder="Name" required /><input name="role" placeholder="Role" required /><input name="phone" placeholder="Phone" /><input name="email" type="email" placeholder="Email" /><textarea name="notes" placeholder="Notes" /><button className="button" type="submit">Add contact</button></form></article>
      </section>
    </main>
  );
}
