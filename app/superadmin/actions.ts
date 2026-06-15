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
}

export async function deleteAuthUser(formData: FormData) {
  await requireSuperAdmin();
  const { id } = idSchema.parse({ id: formData.get("id") });
  const admin = createAdminClient();
  await admin.from("care_memberships").delete().eq("user_id", id);
  const { error } = await admin.auth.admin.deleteUser(id);

  if (error) redirect(`/superadmin?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/superadmin");
}
