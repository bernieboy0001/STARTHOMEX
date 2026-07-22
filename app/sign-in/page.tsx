import { ThemeToggle } from "@/components/theme-toggle";
import { AuthForms } from "@/components/auth-forms";

export default async function SignInPage({ searchParams }: { searchParams?: Promise<{ confirmation?: string; confirmed?: string; error?: string; sent?: string }> }) {
  const params = await searchParams;
  const demo = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return (
    <main className="auth-page">
      <div className="top-tools">
        <ThemeToggle />
      </div>
      {demo && <p className="notice"><strong>Supabase is not connected yet.</strong><span>Add the environment variables in Vercel, then redeploy.</span></p>}
      {params?.error && <p className="notice"><strong>Auth error</strong><span>{params.error}</span></p>}
      {params?.sent === "1" && <p className="notice"><strong>Magic link sent</strong><span>Check your email for the sign-in link.</span></p>}
      {params?.sent === "signup" && <p className="notice"><strong>Account created</strong><span>If email confirmation is on, check your inbox before signing in.</span></p>}
      {params?.confirmed === "1" && <p className="notice"><strong>Email confirmed</strong><span>Your email is verified. Please sign in with your email and password.</span></p>}
      {params?.confirmation === "1" && <p className="notice"><strong>Confirmation link opened</strong><span>Please sign in with your email and password. If your account is not confirmed yet, open the newest confirmation email first.</span></p>}
      <AuthForms disabled={demo} />
    </main>
  );
}
