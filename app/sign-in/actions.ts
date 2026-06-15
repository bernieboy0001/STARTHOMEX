"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const emailSchema = z.object({
  email: z.string().email()
});

export async function sendMagicLink(formData: FormData) {
  const { email } = emailSchema.parse({ email: formData.get("email") });
  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`
    }
  });

  if (error) throw new Error(error.message);
  redirect("/sign-in?sent=1");
}
