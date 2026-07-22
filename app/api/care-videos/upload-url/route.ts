import { NextResponse } from "next/server";
import { z } from "zod";
import { canAccessCircle } from "@/lib/circles";
import { retrySupabase } from "@/lib/retry";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ensureCareFilesBucket } from "@/lib/storage";

const schema = z.object({
  careRecipientId: z.string().uuid(),
  fileName: z.string().min(1).max(180),
  contentType: z.string().startsWith("video/")
});

function extension(fileName: string) {
  const value = fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  return value || "mp4";
}

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Choose a valid video file." }, { status: 400 });

    const auth = await createClient();
    const { data: authData } = await retrySupabase(() => auth.auth.getUser());
    const user = authData.user;
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    if (!(await canAccessCircle(parsed.data.careRecipientId, user.id, user.email))) {
      return NextResponse.json({ error: "No access to this care circle." }, { status: 403 });
    }

    const storagePath = `videos/${parsed.data.careRecipientId}/${crypto.randomUUID()}.${extension(parsed.data.fileName)}`;
    const admin = await ensureCareFilesBucket();
    const { data, error } = await retrySupabase(() => admin.storage
      .from("care-files")
      .createSignedUploadUrl(storagePath));

    if (error || !data) return NextResponse.json({ error: error?.message || "Could not prepare the upload." }, { status: 503 });
    return NextResponse.json({ storagePath, signedUrl: data.signedUrl });
  } catch (error) {
    console.error("Video upload preparation failed", error);
    return NextResponse.json({ error: "Could not prepare the video upload. Please try again." }, { status: 503 });
  }
}
