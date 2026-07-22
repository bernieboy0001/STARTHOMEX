import { NextResponse } from "next/server";
import { canAccessCircle } from "@/lib/circles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { retrySupabase } from "@/lib/retry";
import { ensureCareFilesBucket } from "@/lib/storage";

export async function POST(request: Request) {
  try {
  const formData = await request.formData();
  const careRecipientId = String(formData.get("careRecipientId") || "");
  const file = formData.get("file");
  if (!careRecipientId || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing voice note" }, { status: 400 });
  }

  const auth = await createClient();
  const { data } = await auth.auth.getUser();
  const user = data.user;
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (!(await canAccessCircle(careRecipientId, user.id, user.email))) {
    return NextResponse.json({ error: "No access to this care circle" }, { status: 403 });
  }

  const admin = await ensureCareFilesBucket();
  const storagePath = `voice-notes/${careRecipientId}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await retrySupabase(() => admin.storage.from("care-files").upload(storagePath, file, {
    contentType: file.type || "audio/webm",
    upsert: false
  }));
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { error: documentError } = await retrySupabase(() => admin.from("documents").insert({
    care_recipient_id: careRecipientId,
    title: "Voice note",
    category: "Voice note",
    storage_path: storagePath,
    notes: "Recorded in HOMEX.",
    uploaded_by: user.id
  }));
  if (documentError) return NextResponse.json({ error: documentError.message }, { status: 500 });

  const { error: noteError } = await retrySupabase(() => admin.from("care_notes").insert({
    care_recipient_id: careRecipientId,
    author_id: user.id,
    author_name: (typeof user.user_metadata.full_name === "string" && user.user_metadata.full_name) || user.email || "Care circle member",
    note_type: "voice",
    body: "Voice note attached below."
  }));

  if (noteError) return NextResponse.json({ error: noteError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Voice note upload failed", error);
    return NextResponse.json({ error: "Voice note could not be saved. Please try again." }, { status: 503 });
  }
}
