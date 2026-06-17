"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { extractCareText } from "@/lib/care-extraction";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const extractionSchema = z.object({
  careRecipientId: z.string().uuid(),
  sourceText: z.string().min(20)
});

export async function createCareExtraction(formData: FormData) {
  const parsed = extractionSchema.parse({
    careRecipientId: formData.get("careRecipientId"),
    sourceText: formData.get("sourceText")
  });

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("You must be signed in.");

  const extracted = extractCareText(parsed.sourceText);
  const admin = createAdminClient();
  const { error: insertError } = await admin.from("care_extractions").insert({
    care_recipient_id: parsed.careRecipientId,
    source_text: parsed.sourceText,
    summary: extracted.summary,
    suggested_tasks: extracted.suggestedTasks,
    red_flags: extracted.redFlags,
    created_by: data.user.id
  });

  if (insertError) throw new Error(insertError.message);
  revalidatePath("/dashboard/ai");
}
