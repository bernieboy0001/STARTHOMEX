"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const onboardingSchema = z.object({
  organizationName: z.string().min(2),
  recipientName: z.string().min(2),
  primaryCondition: z.string().optional(),
  recoveryStatus: z.string().min(2),
  fallRisk: z.string().default("unknown"),
  emergencySummary: z.string().optional(),
  diagnosis: z.string().optional(),
  redFlags: z.string().optional(),
  restrictions: z.string().optional(),
  goals: z.string().optional()
});

function listFromText(value: string) {
  return value
    .split(/\r?\n|,/)
    .map(item => item.trim())
    .filter(Boolean);
}

export async function createCareCircle(formData: FormData) {
  const parsed = onboardingSchema.parse({
    organizationName: formData.get("organizationName"),
    recipientName: formData.get("recipientName"),
    primaryCondition: formData.get("primaryCondition") || undefined,
    recoveryStatus: formData.get("recoveryStatus"),
    fallRisk: formData.get("fallRisk"),
    emergencySummary: formData.get("emergencySummary") || undefined,
    diagnosis: formData.get("diagnosis") || undefined,
    redFlags: formData.get("redFlags") || undefined,
    restrictions: formData.get("restrictions") || undefined,
    goals: formData.get("goals") || undefined
  });

  try {
    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) redirect("/sign-in");
    const admin = createAdminClient();

    const { data: organization, error: orgError } = await admin
      .from("organizations")
      .insert({ name: parsed.organizationName, kind: "family" })
      .select()
      .single();
    if (orgError) throw new Error(orgError.message);

    const { data: recipient, error: recipientError } = await admin
      .from("care_recipients")
      .insert({
        organization_id: organization.id,
        full_name: parsed.recipientName,
        primary_condition: parsed.primaryCondition || "General home care",
        recovery_status: parsed.recoveryStatus,
        fall_risk: parsed.fallRisk,
        emergency_summary: parsed.emergencySummary || "No emergency summary added yet."
      })
      .select()
      .single();
    if (recipientError) throw new Error(recipientError.message);

    const { error: membershipError } = await admin.from("care_memberships").insert({
      organization_id: organization.id,
      care_recipient_id: recipient.id,
      user_id: userData.user.id,
      role: "family_lead"
    });
    if (membershipError) throw new Error(membershipError.message);

    const { error: dischargeError } = await admin.from("discharge_plans").insert({
      care_recipient_id: recipient.id,
      diagnosis: parsed.diagnosis || parsed.primaryCondition || "General home care",
      restrictions: listFromText(parsed.restrictions || ""),
      red_flags: listFromText(parsed.redFlags || ""),
      recovery_goals: listFromText(parsed.goals || ""),
      created_by: userData.user.id
    });
    if (dischargeError) throw new Error(dischargeError.message);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create this care circle.";
    redirect(`/onboarding?error=${encodeURIComponent(message)}`);
  }

  redirect("/dashboard");
}
