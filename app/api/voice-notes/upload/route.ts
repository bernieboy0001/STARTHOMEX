import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
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
    uploaded_by: null
  });

  const { error: noteError } = await admin.from("care_notes").insert({
    care_recipient_id: careRecipientId,
    author_id: null,
    author_name: "HOMEX dashboard user",
    note_type: "voice",
    body: "Voice note uploaded."
  });

  if (noteError) return NextResponse.json({ error: noteError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
