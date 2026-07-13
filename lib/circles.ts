import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isSuperAdminEmail } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export function selectedCircleCookieName(userId: string) {
  return `homex-care-recipient-id-${userId}`;
}

export async function requireSessionUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/sign-in?error=Please%20sign%20in%20first");
  }

  return data.user;
}

export async function canAccessCircle(careRecipientId: string, userId: string, email?: string | null) {
  if (isSuperAdminEmail(email)) return true;

  const admin = createAdminClient();
  const { data } = await admin
    .from("care_memberships")
    .select("id")
    .eq("care_recipient_id", careRecipientId)
    .eq("user_id", userId)
    .maybeSingle();

  return !!data;
}

export async function setSelectedCircle(userId: string, careRecipientId: string) {
  const cookieStore = await cookies();
  cookieStore.set(selectedCircleCookieName(userId), careRecipientId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365
  });
}
