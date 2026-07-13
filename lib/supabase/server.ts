import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "./config";

export async function createClient() {
  const cookieStore = await cookies();

  const client = createServerClient(
    supabaseUrl(),
    supabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server components cannot always set cookies; middleware refreshes sessions.
          }
        }
      }
    }
  );

  // Set the selected care recipient in session for RLS policies
  const selectedCircleId = cookieStore.get("homex-care-recipient-id")?.value;
  if (selectedCircleId) {
    try {
      await client.rpc("set_selected_care_recipient", { recipient_id: selectedCircleId });
    } catch (e) {
      console.error("Failed to set selected care recipient in session", e);
    }
  }

  return client;
}
