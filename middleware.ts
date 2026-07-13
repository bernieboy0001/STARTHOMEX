import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  // Refresh the auth session and update cookies
  const { data: { session } } = await supabase.auth.getSession();
  
  // Session isolation validation
  if (session?.user) {
    const selectedCircleId = request.cookies.get("homex-care-recipient-id")?.value;
    const sessionFingerprint = request.cookies.get("homex-session-fingerprint")?.value;
    
    if (selectedCircleId) {
      // Verify fingerprint matches current user + circle combination
      const expectedFingerprint = Buffer.from(selectedCircleId + session.user.id).toString("base64");
      
      if (sessionFingerprint !== expectedFingerprint) {
        // Fingerprint mismatch: user trying to use cookie from different browser/device
        // Clear the contaminated cookie
        response.cookies.delete("homex-care-recipient-id");
        response.cookies.delete("homex-session-fingerprint");
      }
    }
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/agency/:path*", "/superadmin/:path*", "/onboarding/:path*"]
};
