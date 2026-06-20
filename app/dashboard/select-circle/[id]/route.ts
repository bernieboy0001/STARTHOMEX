import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isSuperAdminEmail } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!isSuperAdminEmail(data.user?.email)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const { id } = await params;
  const cookieStore = await cookies();
  cookieStore.set("homex-care-recipient-id", id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365
  });

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
