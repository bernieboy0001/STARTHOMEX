import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isSuperAdminEmail } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { retrySupabase } from "@/lib/retry";

export function selectedCircleCookieName(userId: string) {
  return `homex-care-recipient-id-${userId}`;
}

export async function requireSessionUser() {
  const supabase = await createClient();
  const { data, error } = await retrySupabase(() => supabase.auth.getUser());

  if (error || !data.user) {
    redirect("/sign-in?error=Your%20session%20has%20expired.%20Please%20sign%20in%20again.");
  }

  return data.user;
}

export async function canAccessCircle(careRecipientId: string, userId: string, email?: string | null) {
  if (isSuperAdminEmail(email)) return true;

  const admin = createAdminClient();
  const { data } = await admin
    .from("care_memberships")
    .select("id")
    .eq("user_id", userId)
    .eq("care_recipient_id", careRecipientId)
    .maybeSingle();

  return !!data;
}

export async function setSelectedCircle(careRecipientId: string) {
  const user = await requireSessionUser();

  if (!(await canAccessCircle(careRecipientId, user.id, user.email))) {
    throw new Error("You do not have access to this care circle.");
  }

  const cookieStore = await cookies();
  cookieStore.set(selectedCircleCookieName(user.id), careRecipientId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

export async function clearSelectedCircle() {
  const user = await requireSessionUser();
  const cookieStore = await cookies();
  cookieStore.delete(selectedCircleCookieName(user.id));
}
