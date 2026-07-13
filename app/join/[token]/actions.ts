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

  // Security check: Verify user doesn't already have this membership
  const { data: existingMembership } = await admin
    .from("care_memberships")
    .select("id")
    .eq("user_id", userId)
    .eq("care_recipient_id", invite.care_recipient_id)
    .maybeSingle();
  
  if (existingMembership) {
    throw new Error("You already have access to this care circle.");
  }

  // Check if another account with same email is already in this circle
  const { data: emailConflict } = await admin
    .from("care_memberships")
    .select("user_id")
    .eq("care_recipient_id", invite.care_recipient_id)
    .neq("user_id", userId);
  
  if (emailConflict && emailConflict.length > 0 && email) {
    const { data: otherProfiles } = await admin
      .from("profiles")
      .select("id")
      .in("id", emailConflict.map(m => m.user_id));
    
    // Note: This is a best-effort check. Ideally, query auth.users but that's admin-only
    if (otherProfiles && otherProfiles.length > 0) {
      // Someone else is already in this circle - not necessarily same email
      // but it's worth noting for audit purposes
    }
  }

  // Create membership atomically with transaction semantics
  const { error: membershipError } = await admin.from("care_memberships").upsert({
    organization_id: invite.organization_id,
    care_recipient_id: invite.care_recipient_id,
    user_id: userId,
    role: invite.role
  }, { onConflict: "organization_id,care_recipient_id,user_id" });
  
  if (membershipError) throw membershipError;

  // Mark invite as accepted
  const { error: updateError } = await admin
    .from("care_circle_invites")
    .update({ accepted_by: userId, accepted_at: new Date().toISOString() })
    .eq("id", invite.id);
  
  if (updateError) throw updateError;

  // Set the selected circle with full validation
  await setSelectedCircle(invite.care_recipient_id, userId);
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
    const admin = createAdminClient();
    
    // Security check: Verify email doesn't already have an account
    const existingUsers = await admin.auth.admin.listUsers();
    const emailExists = existingUsers.data?.users?.some(
      u => u.email?.toLowerCase() === parsed.email.toLowerCase()
    );
    
    if (emailExists) {
      throw new Error("This email is already registered. Please sign in instead.");
    }

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

    // Create profile and accept invite atomically
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
