import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { z } from "zod";
import { appUrl } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";

const passwordSchema = z.object({
  mode: z.enum(["sign-in", "sign-up"]),
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().optional()
});

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

function authClient(request: NextRequest, cookiesToSet: CookieToSet[]) {
  return createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(items) {
        cookiesToSet.push(...items);
      }
    }
  });
}

function redirectWithCookies(request: NextRequest, path: string, cookiesToSet: CookieToSet[]) {
  const response = NextResponse.redirect(new URL(path, request.url), 303);
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, { ...options, path: "/" });
  });
  return response;
}

function authError(request: NextRequest, message: string) {
  return NextResponse.redirect(new URL(`/sign-in?error=${encodeURIComponent(message)}`, request.url), 303);
}

/**
 * Check if email is already registered (used by another account)
 */
async function isEmailRegistered(email: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin.auth.admin.listUsers();
  return data?.users?.some(u => u.email?.toLowerCase() === email.toLowerCase()) || false;
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const parsed = passwordSchema.safeParse({
    mode: formData.get("mode"),
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName") || undefined
  });

  if (!parsed.success) {
    return authError(request, "Check your email and password, then try again.");
  }

  const cookiesToSet: CookieToSet[] = [];
  const supabase = authClient(request, cookiesToSet);

  if (parsed.data.mode === "sign-up") {
    const fullName = parsed.data.fullName?.trim();
    if (!fullName) return authError(request, "Enter your full name to create an account.");

    // Security check: Prevent email reuse
    const emailExists = await isEmailRegistered(parsed.data.email);
    if (emailExists) {
      return authError(request, "This email is already registered. Please sign in instead.");
    }

    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${appUrl()}/auth/callback?next=/sign-in%3Fconfirmed%3D1`
      }
    });

    if (error) return authError(request, error.message);

    if (data.user) {
      const admin = createAdminClient();
      // Ensure profile is created atomically with auth signup
      const { error: profileError } = await admin
        .from("profiles")
        .upsert({ id: data.user.id, full_name: fullName });
      
      if (profileError) {
        return authError(request, "Account created but profile setup failed. Please contact support.");
      }
    }

    if (data.session) {
      return redirectWithCookies(request, "/onboarding", cookiesToSet);
    }

    return redirectWithCookies(request, "/sign-in?sent=signup", cookiesToSet);
  }

  // Sign-in mode
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password
  });

  if (error) return authError(request, error.message);

  if (!data.user) {
    return authError(request, "Sign in failed. Please try again.");
  }

  // On successful sign-in, clear any contaminated care circle selection
  // User will need to select their circle again
  const response = redirectWithCookies(request, "/dashboard", cookiesToSet);
  response.cookies.delete("homex-care-recipient-id");
  response.cookies.delete("homex-session-fingerprint");
  
  return response;
}
