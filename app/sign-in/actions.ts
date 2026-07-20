"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { appUrl } from "@/lib/auth";

const emailSchema = z.object({
  email: z.string().email()
});

const passwordSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

function fail(path: string, error: unknown) {
  const message = error instanceof Error ? error.message : "Something went wrong.";
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function signUpWithPassword(formData: FormData) {
  const parsed = passwordSchema
    .extend({ fullName: z.string().min(2) })
    .parse({
      email: formData.get("email"),
      password: formData.get("password"),
      fullName: formData.get("fullName")
    });

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email: parsed.email,
      password: parsed.password,
      options: {
        data: { full_name: parsed.fullName },
        emailRedirectTo: `${appUrl()}/auth/callback?next=/sign-in%3Fconfirmed%3D1`
      }
    });

    if (error) throw error;

    if (data.user) {
      const admin = createAdminClient();
      await admin.from("profiles").upsert({
        id: data.user.id,
        full_name: parsed.fullName
      });
    }
  } catch (error) {
    fail("/sign-in", error);
  }

  redirect("/sign-in?sent=signup");
}

export async function signInWithPassword(formData: FormData) {
  const parsed = passwordSchema.parse({
    email: formData.get("email"),
    password: formData.get("password")
  });

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword(parsed);
    if (error) throw error;
  } catch (error) {
    fail("/sign-in", error);
  }

  redirect("/dashboard");
}

export async function sendMagicLink(formData: FormData) {
  const { email } = emailSchema.parse({ email: formData.get("email") });
  const next = String(formData.get("next") || "/dashboard");

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${appUrl()}/auth/callback?next=${encodeURIComponent(next)}`
      }
    });

    if (error) throw error;
  } catch (error) {
    fail("/sign-in", error);
  }

  redirect("/sign-in?sent=1");
}
