import { ThemeToggle } from "@/components/theme-toggle";
import { AuthForms } from "@/components/auth-forms";

export default async function SignInPage({ searchParams }: { searchParams?: Promise<{ error?: string; sent?: string }> }) {
  const params = await searchParams;
  const demo = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return (
    <main className="main">
      <div className="top-tools">
        <ThemeToggle />
      </div>
      {demo && <p className="notice"><strong>Supabase is not connected yet.</strong><span>Add the environment variables in Vercel, then redeploy.</span></p>}
      {params?.error && <p className="notice"><strong>Auth error</strong><span>{params.error}</span></p>}
      {params?.sent === "1" && <p className="notice"><strong>Magic link sent</strong><span>Check your email for the sign-in link.</span></p>}
      {params?.sent === "signup" && <p className="notice"><strong>Account created</strong><span>If email confirmation is on, check your inbox before signing in.</span></p>}
      <AuthForms disabled={demo} />
    </main>
  );
}
