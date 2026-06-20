import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { isSuperAdminEmail, requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AgencyPage() {
  const user = await requireUser();
  const admin = createAdminClient();

  const { data: coordinatorMemberships } = await admin
    .from("care_memberships")
    .select("id")
    .eq("user_id", user.id)
    .eq("role", "agency_coordinator")
    .limit(1);

  if (!isSuperAdminEmail(user.email) && !coordinatorMemberships?.length) {
    redirect("/dashboard");
  }

  const [{ data: recipients }, { data: memberships }] = await Promise.all([
    admin.from("care_recipients").select("id, full_name, recovery_status, created_at").order("created_at", { ascending: false }).limit(100),
    admin.from("care_memberships").select("care_recipient_id")
  ]);

  const memberCount = new Map<string, number>();
  (memberships || []).forEach(member => {
    memberCount.set(member.care_recipient_id, (memberCount.get(member.care_recipient_id) || 0) + 1);
  });

  return (
    <main className="main">
      <header className="page-head">
        <div>
          <p className="eyebrow">Agency dashboard</p>
          <h2>Care circles overview</h2>
          <p className="muted">For care homes, coordinators, and superadmin operators managing many circles.</p>
        </div>
      </header>
      <section className="panel">
        <div className="panel-head"><h3>Circles</h3><Building2 size={20} /></div>
        <div className="rows">
          {(recipients || []).map(recipient => (
            <div className="row" key={recipient.id}>
              <strong>{recipient.full_name}</strong>
              <span>{recipient.recovery_status || "General care"} / {memberCount.get(recipient.id) || 0} members</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
