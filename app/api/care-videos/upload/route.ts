import { NextResponse } from "next/server";
import { z } from "zod";
import { canAccessCircle } from "@/lib/circles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { retrySupabase } from "@/lib/retry";

const uploadSchema = z.object({
  careRecipientId: z.string().uuid(),
  title: z.string().min(3),
  category: z.string().min(2),
  description: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing video file." }, { status: 400 });
    }

    if (!file.type.startsWith("video/")) {
      return NextResponse.json({ error: "Only video uploads are supported." }, { status: 400 });
    }

    if (file.size > 250 * 1024 * 1024) {
      return NextResponse.json({ error: "Video must be smaller than 250 MB." }, { status: 413 });
    }

    const parsed = uploadSchema.safeParse({
    careRecipientId: formData.get("careRecipientId"),
    title: formData.get("title"),
    category: formData.get("category"),
    description: formData.get("description") || undefined
  });
    if (!parsed.success) return NextResponse.json({ error: "Add a title and category before uploading." }, { status: 400 });

    const auth = await createClient();
    const { data: authData } = await retrySupabase(() => auth.auth.getUser());
    const user = authData.user;
    if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    if (!(await canAccessCircle(parsed.data.careRecipientId, user.id, user.email))) {
      return NextResponse.json({ error: "No access to this care circle" }, { status: 403 });
    }

    const supabase = createAdminClient();

    const extension = file.name.split(".").pop() || "mp4";
    const storagePath = `${parsed.data.careRecipientId}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await retrySupabase(() => supabase.storage
    .from("care-files")
    .upload(storagePath, file, { contentType: file.type, upsert: false }));

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 400 });
    }

    const { data, error } = await retrySupabase(() => supabase
    .from("caregiver_videos")
    .insert({
      care_recipient_id: parsed.data.careRecipientId,
      title: parsed.data.title,
      category: parsed.data.category,
      description: parsed.data.description || null,
      storage_path: storagePath,
      created_by: user.id
    })
    .select()
    .single());

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ video: data }, { status: 201 });
  } catch (error) {
    console.error("Video upload failed", error);
    return NextResponse.json({ error: "Video upload could not finish. Please try again." }, { status: 503 });
  }
}
