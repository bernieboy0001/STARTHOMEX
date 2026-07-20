import { NextResponse } from "next/server";
import { canAccessCircle, selectedCircleCookieName } from "@/lib/circles";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    return NextResponse.redirect(new URL("/sign-in?error=Your%20session%20has%20expired.%20Please%20sign%20in%20again.", request.url));
  }

  const { id } = await params;
  if (!(await canAccessCircle(id, user.id, user.email))) {
    return NextResponse.redirect(new URL("/dashboard?error=You%20do%20not%20have%20access%20to%20that%20circle.", request.url));
  }

  const response = NextResponse.redirect(new URL("/dashboard", request.url));
  response.cookies.set(selectedCircleCookieName(user.id), id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
  return response;
}
