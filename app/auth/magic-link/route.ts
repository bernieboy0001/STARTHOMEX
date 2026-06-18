import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { z } from "zod";
import { appUrl } from "@/lib/auth";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";

const emailSchema = z.object({
  email: z.string().email(),
  next: z.string().optional()
});

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const parsed = emailSchema.safeParse({
    email: formData.get("email"),
    next: formData.get("next") || "/dashboard"
  });

  if (!parsed.success) {
    return NextResponse.redirect(new URL("/sign-in?error=Enter%20a%20valid%20email.", request.url));
  }

  const cookiesToSet: CookieToSet[] = [];
  const supabase = createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(items) {
        cookiesToSet.push(...items);
      }
    }
  });

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${appUrl()}/auth/callback?next=${encodeURIComponent(parsed.data.next || "/dashboard")}`
    }
  });

  if (error) {
    return NextResponse.redirect(new URL(`/sign-in?error=${encodeURIComponent(error.message)}`, request.url));
  }

  const response = NextResponse.redirect(new URL("/sign-in?sent=1", request.url));
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, { ...options, path: "/" });
  });
  return response;
}
