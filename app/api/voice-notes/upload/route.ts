import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const careRecipientId = String(formData.get("careRecipientId") || "");
  const file = formData.get("file");
  if (!careRecipientId || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing voice note" }, { status: 400 });
  }

  const admin = createAdminClient();
  const storagePath = `voice-notes/${careRecipientId}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await admin.storage.from("care-files").upload(storagePath, file, {
    contentType: file.type || "audio/webm",
    upsert: false
  });
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  await admin.from("documents").insert({
    care_recipient_id: careRecipientId,
    title: "Voice note",
    category: "Voice note",
    storage_path: storagePath,
    notes: "Recorded in HOMEX.",
    uploaded_by: data.user.id
  });

  const authorName = (data.user.user_metadata?.full_name as string | undefined) || data.user.email || "Care circle member";
  const { error: noteError } = await admin.from("care_notes").insert({
    care_recipient_id: careRecipientId,
    author_id: data.user.id,
    author_name: authorName,
    note_type: "voice",
    body: "Voice note uploaded."
  });

  if (noteError) return NextResponse.json({ error: noteError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
