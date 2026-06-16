export function supabaseUrl() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!value) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL in Vercel environment variables.");
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must be a full URL like https://your-project-ref.supabase.co.");
  }

  if (url.pathname !== "/" || !url.hostname.endsWith(".supabase.co")) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must be the bare Supabase Project URL, like https://your-project-ref.supabase.co. Do not use a Supabase dashboard URL, /rest/v1 URL, or /auth/v1 URL.");
  }

  return url.origin;
}

export function supabaseAnonKey() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel environment variables.");
  return key;
}

export function supabaseServiceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY in Vercel environment variables.");
  return key;
}
