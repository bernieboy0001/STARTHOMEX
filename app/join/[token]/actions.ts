"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { appUrl } from "@/lib/auth";
import { setSelectedCircle } from "@/lib/circles";

const passwordSchema = z.object({
  token: z.string().min(12),
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2).optional()
});

async function acceptInviteForUser(token: string, userId: string, email?: string | null) {
  const admin = createAdminClient();
  const { data: invite, error: inviteError } = await admin
    .from("care_circle_invites")
    .select("id, organization_id, care_recipient_id, invited_email, role, accepted_at, revoked_at, expires_at")
    .eq("token", token)
    .single();

  if (inviteError || !invite) throw new Error("This invite link is not valid.");
  if (invite.revoked_at) throw new Error("This invite link was revoked.");
  if (invite.accepted_at) throw new Error("This invite link has already been used.");
  if (new Date(invite.expires_at).getTime() < Date.now()) throw new Error("This invite link has expired.");
  if (invite.invited_email && email && invite.invited_email.toLowerCase() !== email.toLowerCase()) {
    throw new Error("This invite was created for a different email address.");
  }

  const { error: membershipError } = await admin.from("care_memberships").upsert({
    organization_id: invite.organization_id,
    care_recipient_id: invite.care_recipient_id,
    user_id: userId,
    role: invite.role
  }, { onConflict: "organization_id,care_recipient_id,user_id" });
  if (membershipError) throw membershipError;

  const { error: updateError } = await admin
    .from("care_circle_invites")
    .update({ accepted_by: userId, accepted_at: new Date().toISOString() })
    .eq("id", invite.id);
  if (updateError) throw updateError;

  await setSelectedCircle(userId, invite.care_recipient_id);
}

function fail(token: string, error: unknown) {
  const message = error instanceof Error ? error.message : "Unable to join this care circle.";
  redirect(`/join/${token}?error=${encodeURIComponent(message)}`);
}

export async function acceptCurrentSessionInvite(formData: FormData) {
  const token = String(formData.get("token") || "");

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) redirect(`/join/${token}?mode=signin`);
    await acceptInviteForUser(token, data.user.id, data.user.email);
  } catch (error) {
    fail(token, error);
  }

  redirect("/dashboard");
}

export async function signInAndAcceptInvite(formData: FormData) {
  const parsed = passwordSchema.omit({ fullName: true }).parse({
    token: formData.get("token"),
    email: formData.get("email"),
    password: formData.get("password")
  });

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.email,
      password: parsed.password
    });
    if (error) throw error;
    if (!data.user) throw new Error("Sign in did not return a user.");
    await acceptInviteForUser(parsed.token, data.user.id, data.user.email);
  } catch (error) {
    fail(parsed.token, error);
  }

  redirect("/dashboard");
}

export async function signUpAndAcceptInvite(formData: FormData) {
  const parsed = passwordSchema.parse({
    token: formData.get("token"),
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName")
  });

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email: parsed.email,
      password: parsed.password,
      options: {
        data: { full_name: parsed.fullName },
        emailRedirectTo: `${appUrl()}/auth/callback?next=/join/${parsed.token}`
      }
    });
    if (error) throw error;
    if (!data.user) throw new Error("Account created. Check your email, then open the invite link again.");

    const admin = createAdminClient();
    await admin.from("profiles").upsert({ id: data.user.id, full_name: parsed.fullName });
    await acceptInviteForUser(parsed.token, data.user.id, data.user.email);
  } catch (error) {
    fail(parsed.token, error);
  }

  redirect("/dashboard");
}

export async function emailInviteMagicLink(formData: FormData) {
  const parsed = passwordSchema.pick({ token: true, email: true }).parse({
    token: formData.get("token"),
    email: formData.get("email")
  });

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: parsed.email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${appUrl()}/auth/callback?next=/join/${parsed.token}`
      }
    });
    if (error) throw error;
  } catch (error) {
    fail(parsed.token, error);
  }

  redirect(`/join/${parsed.token}?sent=1`);
}
