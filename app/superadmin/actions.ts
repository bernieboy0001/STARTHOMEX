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

  const { error } = await admin.auth.admin.deleteUser(id);

  if (error) redirect(`/superadmin?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/superadmin");
  redirect("/superadmin?status=user-deleted");
}
