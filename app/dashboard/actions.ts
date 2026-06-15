"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const taskSchema = z.object({
  careRecipientId: z.string().uuid(),
  title: z.string().min(3),
  ownerName: z.string().min(1),
  priority: z.enum(["low", "medium", "high"]),
  dueAt: z.string().optional()
});

const noteSchema = z.object({
  careRecipientId: z.string().uuid(),
  authorName: z.string().min(1),
  body: z.string().min(3),
  noteType: z.string().default("general")
});

const videoSchema = z.object({
  careRecipientId: z.string().uuid(),
  title: z.string().min(3),
  category: z.string().min(2),
  description: z.string().optional(),
  embedUrl: z.string().url().optional().or(z.literal(""))
});

export async function createTask(formData: FormData) {
  const parsed = taskSchema.parse({
    careRecipientId: formData.get("careRecipientId"),
    title: formData.get("title"),
    ownerName: formData.get("ownerName"),
    priority: formData.get("priority"),
    dueAt: formData.get("dueAt") || undefined
  });

  const supabase = await createClient();
  const { error } = await supabase.from("tasks").insert({
    care_recipient_id: parsed.careRecipientId,
    title: parsed.title,
    owner_name: parsed.ownerName,
    priority: parsed.priority,
    due_at: parsed.dueAt || null
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

export async function createNote(formData: FormData) {
  const parsed = noteSchema.parse({
    careRecipientId: formData.get("careRecipientId"),
    authorName: formData.get("authorName"),
    body: formData.get("body"),
    noteType: formData.get("noteType") || "general"
  });

  const supabase = await createClient();
  const { error } = await supabase.from("care_notes").insert({
    care_recipient_id: parsed.careRecipientId,
    author_name: parsed.authorName,
    body: parsed.body,
    note_type: parsed.noteType
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

export async function createVideo(formData: FormData) {
  const parsed = videoSchema.parse({
    careRecipientId: formData.get("careRecipientId"),
    title: formData.get("title"),
    category: formData.get("category"),
    description: formData.get("description") || undefined,
    embedUrl: formData.get("embedUrl") || ""
  });

  const supabase = await createClient();
  const { error } = await supabase.from("caregiver_videos").insert({
    care_recipient_id: parsed.careRecipientId,
    title: parsed.title,
    category: parsed.category,
    description: parsed.description || null,
    embed_url: parsed.embedUrl || null
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}
