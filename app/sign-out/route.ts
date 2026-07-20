import { NextResponse } from "next/server";
import { selectedCircleCookieName } from "@/lib/circles";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  let userId: string | null = null;
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id || null;
    await supabase.auth.signOut();
  }

  const response = NextResponse.redirect(new URL("/sign-in", request.url));
  response.cookies.delete("homex-care-recipient-id");
  response.cookies.delete("homex-session-fingerprint");
  if (userId) response.cookies.delete(selectedCircleCookieName(userId));
  return response;
}
