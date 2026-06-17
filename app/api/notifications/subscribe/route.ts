import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subscription = await request.json();
  if (!subscription?.endpoint) return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });

  const admin = createAdminClient();
  const { error: insertError } = await admin.from("notification_subscriptions").upsert({
    user_id: data.user.id,
    endpoint: subscription.endpoint,
    subscription,
    revoked_at: null
  }, { onConflict: "endpoint" });

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
