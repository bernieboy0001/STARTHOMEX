import { NextResponse } from "next/server";
import { z } from "zod";
import { canAccessCircle } from "@/lib/circles";
import { retrySupabase } from "@/lib/retry";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  careRecipientId: z.string().uuid(),
  title: z.string().min(3),
  category: z.string().min(2),
  description: z.string().optional(),
  storagePath: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Add a title and category before saving." }, { status: 400 });

    const auth = await createClient();
    const { data: authData } = await retrySupabase(() => auth.auth.getUser());
    const user = authData.user;
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    if (!(await canAccessCircle(parsed.data.careRecipientId, user.id, user.email))) {
      return NextResponse.json({ error: "No access to this care circle." }, { status: 403 });
    }
    if (!parsed.data.storagePath.startsWith(`videos/${parsed.data.careRecipientId}/`)) {
      return NextResponse.json({ error: "Invalid video upload." }, { status: 400 });
    }

    const { error } = await retrySupabase(() => createAdminClient().from("caregiver_videos").insert({
      care_recipient_id: parsed.data.careRecipientId,
      title: parsed.data.title,
      category: parsed.data.category,
      description: parsed.data.description || null,
      storage_path: parsed.data.storagePath,
      created_by: user.id
    }));

    if (error) return NextResponse.json({ error: error.message }, { status: 503 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Video save failed", error);
    return NextResponse.json({ error: "Video uploaded but could not be saved. Please try again." }, { status: 503 });
  }
}
