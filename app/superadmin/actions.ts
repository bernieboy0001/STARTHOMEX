"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/auth";

const idSchema = z.object({ id: z.string().uuid() });

export async function revokeMembership(formData: FormData) {
  await requireSuperAdmin();
  const { id } = idSchema.parse({ id: formData.get("id") });
  const admin = createAdminClient();
  const { error } = await admin.from("care_memberships").delete().eq("id", id);

  if (error) redirect(`/superadmin?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/superadmin");
  redirect("/superadmin?status=access-revoked");
}

export async function revokeInvite(formData: FormData) {
  await requireSuperAdmin();
  const { id } = idSchema.parse({ id: formData.get("id") });
  const admin = createAdminClient();
  const { error } = await admin
    .from("care_circle_invites")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id);

  if (error) redirect(`/superadmin?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/superadmin");
  redirect("/superadmin?status=invite-revoked");
}

export async function deleteAuthUser(formData: FormData) {
  const currentUser = await requireSuperAdmin();
  const { id } = idSchema.parse({ id: formData.get("id") });
  if (id === currentUser.id) {
    redirect("/superadmin?error=You%20cannot%20delete%20your%20own%20superadmin%20account.");
  }

  const admin = createAdminClient();
  const { error: membershipError } = await admin.from("care_memberships").delete().eq("user_id", id);
  if (membershipError) redirect(`/superadmin?error=${encodeURIComponent(membershipError.message)}`);

  // Care records can reference a user, so use Supabase's soft deletion rather
  // than breaking the care history with a hard auth-row deletion.
  const { error } = await admin.auth.admin.deleteUser(id, true);

  if (error) redirect(`/superadmin?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/superadmin");
  redirect("/superadmin?status=user-deleted");
}

async function clearReference(error: { message: string } | null, target: string) {
  if (error) redirect(`/superadmin?error=${encodeURIComponent(`Could not clear ${target}: ${error.message}`)}`);
}

export async function permanentlyDeleteDeactivatedUser(formData: FormData) {
  const currentUser = await requireSuperAdmin();
  const { id } = idSchema.parse({ id: formData.get("id") });
  if (id === currentUser.id) {
    redirect("/superadmin?error=You%20cannot%20delete%20your%20own%20superadmin%20account.");
  }

  const admin = createAdminClient();
  const { data: account, error: accountError } = await admin.auth.admin.getUserById(id);
  if (accountError || !account.user?.deleted_at) {
    redirect("/superadmin?error=Deactivate%20the%20account%20before%20permanently%20deleting%20it.");
  }

  const [
    memberships,
    taskOwner,
    taskCompletion,
    taskCreator,
    notes,
    documents,
    videos,
    shifts,
    plans,
    auditEvents,
    inviteCreator,
    inviteAcceptance
  ] = await Promise.all([
    admin.from("care_memberships").delete().eq("user_id", id),
    admin.from("tasks").update({ owner_id: null }).eq("owner_id", id),
    admin.from("tasks").update({ completed_by: null }).eq("completed_by", id),
    admin.from("tasks").update({ created_by: null }).eq("created_by", id),
    admin.from("care_notes").update({ author_id: null }).eq("author_id", id),
    admin.from("documents").update({ uploaded_by: null }).eq("uploaded_by", id),
    admin.from("caregiver_videos").update({ created_by: null }).eq("created_by", id),
    admin.from("care_shifts").update({ caregiver_id: null }).eq("caregiver_id", id),
    admin.from("discharge_plans").update({ created_by: null }).eq("created_by", id),
    admin.from("audit_events").update({ actor_id: null }).eq("actor_id", id),
    admin.from("care_circle_invites").update({ created_by: null }).eq("created_by", id),
    admin.from("care_circle_invites").update({ accepted_by: null }).eq("accepted_by", id)
  ]);

  await clearReference(memberships.error, "care-circle access");
  await clearReference(taskOwner.error || taskCompletion.error || taskCreator.error, "task ownership");
  await clearReference(notes.error, "care notes");
  await clearReference(documents.error, "documents");
  await clearReference(videos.error, "videos");
  await clearReference(shifts.error, "care shifts");
  await clearReference(plans.error, "care plans");
  await clearReference(auditEvents.error, "activity history");
  await clearReference(inviteCreator.error || inviteAcceptance.error, "invite history");

  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) redirect(`/superadmin?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/superadmin");
  redirect("/superadmin?status=user-removed");
}
