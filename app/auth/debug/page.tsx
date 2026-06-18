import { cookies, headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function redact(value?: string | null) {
  if (!value) return "missing";
  if (value.length <= 12) return `${value.length} chars`;
  return `${value.slice(0, 6)}...${value.slice(-4)} (${value.length} chars)`;
}

export default async function AuthDebugPage() {
  const headerStore = await headers();
  const cookieStore = await cookies();
  const host = headerStore.get("host") || "unknown";
  const protocol = headerStore.get("x-forwarded-proto") || "unknown";
  const allCookies = cookieStore.getAll();
  const supabaseCookies = allCookies
    .filter(cookie => cookie.name.startsWith("sb-"))
    .map(cookie => ({
      name: cookie.name,
      value: redact(cookie.value)
    }));

  let userEmail = "not signed in";
  let userId = "not signed in";
  let authError = "none";

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) authError = error.message;
    if (data.user) {
      userEmail = data.user.email || "email missing";
      userId = data.user.id;
    }
  } catch (error) {
    authError = error instanceof Error ? error.message : "Unknown auth error";
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "missing";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "missing";

  return (
    <main className="main">
      <section className="panel">
        <p className="eyebrow">Auth debug</p>
        <h2>Session check</h2>
        <div className="rows">
          <div className="row"><strong>Current host</strong><span>{protocol}://{host}</span></div>
          <div className="row"><strong>NEXT_PUBLIC_APP_URL</strong><span>{appUrl}</span></div>
          <div className="row"><strong>Supabase URL</strong><span>{supabaseUrl}</span></div>
          <div className="row"><strong>Supabase cookies found</strong><span>{String(supabaseCookies.length)}</span></div>
          <div className="row"><strong>Server sees user</strong><span>{userEmail}</span></div>
          <div className="row"><strong>User id</strong><span>{userId}</span></div>
          <div className="row"><strong>Auth error</strong><span>{authError}</span></div>
        </div>
      </section>
      <section className="panel">
        <div className="panel-head"><h3>Cookie names</h3></div>
        <div className="rows">
          {supabaseCookies.length === 0 && <div className="row"><strong>No Supabase cookies</strong><span>The browser did not send Supabase auth cookies to this route.</span></div>}
          {supabaseCookies.map(cookie => (
            <div className="row" key={cookie.name}>
              <strong>{cookie.name}</strong>
              <span>{cookie.value}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
