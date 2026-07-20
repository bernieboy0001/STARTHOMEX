import { NextResponse } from "next/server";
import { canAccessCircle } from "@/lib/circles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function cleanName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/-+/g, "-");
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const careRecipientId = String(formData.get("careRecipientId") || "");
  const title = String(formData.get("title") || "");
  const category = String(formData.get("category") || "Document");
  const file = formData.get("file");

  if (!careRecipientId || !title || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing upload fields" }, { status: 400 });
  }

  const auth = await createClient();
  const { data } = await auth.auth.getUser();
  const user = data.user;
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (!(await canAccessCircle(careRecipientId, user.id, user.email))) {
    return NextResponse.json({ error: "No access to this care circle" }, { status: 403 });
  }

  const admin = createAdminClient();
  const storagePath = `documents/${careRecipientId}/${Date.now()}-${cleanName(file.name)}`;
  const { error: uploadError } = await admin.storage.from("care-files").upload(storagePath, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false
  });
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { error: insertError } = await admin.from("documents").insert({
    care_recipient_id: careRecipientId,
    title,
    category,
    storage_path: storagePath,
    notes: "Uploaded from camera or file picker.",
    uploaded_by: user.id
  });
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
