import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { selectedCircleCookieName } from "@/lib/circles";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

export async function GET(request: NextRequest) {
  const cookiesToSet: CookieToSet[] = [];
  let userId: string | null = null;

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
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

    const { data } = await supabase.auth.getUser();
    userId = data.user?.id || null;
    await supabase.auth.signOut({ scope: "local" });
  }

  const response = NextResponse.redirect(new URL("/sign-in", request.url), 303);
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, { ...options, path: "/" });
  });
  response.cookies.delete("homex-care-recipient-id");
  response.cookies.delete("homex-session-fingerprint");
  if (userId) response.cookies.delete(selectedCircleCookieName(userId));

  return response;
}
