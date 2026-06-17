"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const inviteSchema = z.object({
  careRecipientId: z.string().uuid(),
  invitedEmail: z.string().email().optional().or(z.literal("")),
  role: z.enum(["family_member", "home_aide", "agency_coordinator", "clinician"]).default("family_member")
});

const revokeInviteSchema = z.object({
  token: z.string().min(12),
  careRecipientId: z.string().uuid()
});

const revokeMemberSchema = z.object({
  membershipId: z.string().uuid(),
  careRecipientId: z.string().uuid()
});

async function requireLead(careRecipientId: string, userId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("care_memberships")
    .select("organization_id, role")
    .eq("care_recipient_id", careRecipientId)
    .eq("user_id", userId)
    .single();

  if (error || !data || !["family_lead", "agency_coordinator"].includes(data.role)) {
    throw new Error("Only the family lead or agency coordinator can create invite links.");
  }

  return data;
}

export async function createInviteLink(formData: FormData) {
  const parsed = inviteSchema.parse({
    careRecipientId: formData.get("careRecipientId"),
    invitedEmail: formData.get("invitedEmail") || "",
    role: formData.get("role") || "family_member"
  });
  const user = await requireUser();
  const membership = await requireLead(parsed.careRecipientId, user.id);
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("care_circle_invites")
    .insert({
      organization_id: membership.organization_id,
      care_recipient_id: parsed.careRecipientId,
      invited_email: parsed.invitedEmail || null,
      role: parsed.role,
      created_by: user.id
    })
    .select("token")
    .single();

  if (error) {
    redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  redirect(`/dashboard?invite=${data.token}`);
}

export async function revokeInviteLink(formData: FormData) {
  const parsed = revokeInviteSchema.parse({
    token: formData.get("token"),
    careRecipientId: formData.get("careRecipientId")
  });
  const user = await requireUser();
  await requireLead(parsed.careRecipientId, user.id);
  const admin = createAdminClient();

  const { error } = await admin
    .from("care_circle_invites")
    .update({ revoked_at: new Date().toISOString() })
    .eq("token", parsed.token)
    .eq("care_recipient_id", parsed.careRecipientId);

  if (error) redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/dashboard");
  redirect("/dashboard#invite");
}

export async function revokeMemberAccess(formData: FormData) {
  const parsed = revokeMemberSchema.parse({
    membershipId: formData.get("membershipId"),
    careRecipientId: formData.get("careRecipientId")
  });
  const user = await requireUser();
  await requireLead(parsed.careRecipientId, user.id);
  const admin = createAdminClient();

  const { data: membership, error: membershipError } = await admin
    .from("care_memberships")
    .select("user_id, role")
    .eq("id", parsed.membershipId)
    .eq("care_recipient_id", parsed.careRecipientId)
    .single();

  if (membershipError || !membership) {
    redirect("/dashboard?error=Membership%20not%20found");
  }

  if (membership.user_id === user.id) {
    redirect("/dashboard?error=You%20cannot%20remove%20your%20own%20access");
  }

  const { error } = await admin
    .from("care_memberships")
    .delete()
    .eq("id", parsed.membershipId)
    .eq("care_recipient_id", parsed.careRecipientId);

  if (error) redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/dashboard");
  redirect("/dashboard#invite");
}
