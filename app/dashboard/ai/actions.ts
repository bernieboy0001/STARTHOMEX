"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { extractCareText } from "@/lib/care-extraction";
import { createAdminClient } from "@/lib/supabase/admin";

const extractionSchema = z.object({
  careRecipientId: z.string().uuid(),
  sourceText: z.string().min(20)
});

export async function createCareExtraction(formData: FormData) {
  const parsed = extractionSchema.parse({
    careRecipientId: formData.get("careRecipientId"),
    sourceText: formData.get("sourceText")
  });

  const extracted = extractCareText(parsed.sourceText);
  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    console.error("AI extraction database client error", error);
    redirect("/dashboard/ai?save=database-not-connected");
  }
  const { error: insertError } = await admin.from("care_extractions").insert({
    care_recipient_id: parsed.careRecipientId,
    source_text: parsed.sourceText,
    summary: extracted.summary,
    suggested_tasks: extracted.suggestedTasks,
    red_flags: extracted.redFlags,
    created_by: null
  });

  if (insertError) {
    console.error("AI extraction save failed", insertError);
    redirect("/dashboard/ai?save=error");
  }
  revalidatePath("/dashboard/ai");
  redirect("/dashboard/ai?save=saved");
}
