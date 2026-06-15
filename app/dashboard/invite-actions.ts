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
