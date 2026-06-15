import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export function isSuperAdminEmail(email?: string | null) {
  const configured = process.env.SUPERADMIN_EMAILS || "";
  const allowed = configured
    .split(",")
    .map(item => item.trim().toLowerCase())
    .filter(Boolean);

  return !!email && allowed.includes(email.toLowerCase());
}

export async function requireUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/sign-in");
  }

  return data.user;
}

export async function requireSuperAdmin() {
  const user = await requireUser();

  if (!isSuperAdminEmail(user.email)) {
    redirect("/dashboard");
  }

  return user;
}
