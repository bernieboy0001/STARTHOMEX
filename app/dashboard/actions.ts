"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { canAccessCircle, requireSessionUser } from "@/lib/circles";
import { createAdminClient } from "@/lib/supabase/admin";
import { retrySupabase } from "@/lib/retry";

const taskSchema = z.object({
  careRecipientId: z.string().uuid(),
  title: z.string().min(3),
  ownerName: z.string().min(1),
  priority: z.enum(["low", "medium", "high"]),
  dueAt: z.string().optional()
});

const toggleTaskSchema = z.object({
  taskId: z.string().uuid(),
  careRecipientId: z.string().uuid(),
  completed: z.enum(["on", "off"]).default("off")
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

const medicationSchema = z.object({
  careRecipientId: z.string().uuid(),
  name: z.string().min(2),
  dosage: z.string().optional(),
  schedule: z.string().min(2),
  instructions: z.string().optional(),
  prescribedBy: z.string().optional(),
  refillDueAt: z.string().optional()
});

const visitSchema = z.object({
  careRecipientId: z.string().uuid(),
  title: z.string().min(2),
  startsAt: z.string().optional(),
  location: z.string().optional(),
  providerName: z.string().optional(),
  preparationNotes: z.string().optional()
});

const contactSchema = z.object({
  careRecipientId: z.string().uuid(),
  name: z.string().min(2),
  role: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional()
});

const documentSchema = z.object({
  careRecipientId: z.string().uuid(),
  title: z.string().min(2),
  category: z.string().min(2),
  externalUrl: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional()
});

const reminderSchema = z.object({
  careRecipientId: z.string().uuid(),
  title: z.string().min(2),
  remindAt: z.string().min(1),
  channel: z.enum(["app", "email", "sms"]).default("app")
});

async function currentUser(errorPath = "/dashboard") {
  try {
    const signedInUser = await requireSessionUser();
    return {
      supabase: createAdminClient(),
      user: signedInUser,
      actorName: signedInUser.email || "HOMEX dashboard user"
    };
  } catch (error) {
    console.error("Dashboard database client error", error);
    redirect(`${errorPath}?save=database-not-connected`);
  }
}

async function assertCircleAccess(careRecipientId: string, userId: string, email?: string | null, path = "/dashboard") {
  if (await canAccessCircle(careRecipientId, userId, email)) return;
  redirect(`${path}?save=error`);
}

function failSave(path: string, error: unknown): never {
  console.error("Dashboard save failed", error);
  redirect(`${path}?save=error`);
}

function handleUnexpectedSaveFailure(path: string, error: unknown): never {
  // Next.js uses thrown navigation errors for redirect(). Keep those intact.
  if (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof error.digest === "string" &&
    error.digest.startsWith("NEXT_")
  ) {
    throw error;
  }

  return failSave(path, error);
}

async function recordActivity(input: {
  careRecipientId: string;
  actorId: string | null;
  actorName: string;
  action: string;
  entity: string;
  entityId?: string | null;
  summary: string;
}) {
  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    console.error("Activity database client error", error);
    return;
  }

  const { data: recipient } = await admin
    .from("care_recipients")
    .select("organization_id")
    .eq("id", input.careRecipientId)
    .single();

  const { error } = await admin.from("audit_events").insert({
    organization_id: recipient?.organization_id || null,
    care_recipient_id: input.careRecipientId,
    actor_id: input.actorId,
    actor_name: input.actorName,
    action: input.action,
    entity: input.entity,
    entity_id: input.entityId || null,
    summary: input.summary
  });

  if (error) console.error("Activity save failed", error);
}

export async function createTask(formData: FormData) {
  try {
    const parsed = taskSchema.parse({
      careRecipientId: formData.get("careRecipientId"),
      title: formData.get("title"),
      ownerName: formData.get("ownerName"),
      priority: formData.get("priority"),
      dueAt: formData.get("dueAt") || undefined
    });

    const { supabase, user, actorName } = await currentUser("/dashboard/tasks");
    await assertCircleAccess(parsed.careRecipientId, user.id, user.email, "/dashboard/tasks");
    const { data, error } = await retrySupabase(() => supabase.from("tasks").insert({
      care_recipient_id: parsed.careRecipientId,
      title: parsed.title,
      owner_name: parsed.ownerName,
      priority: parsed.priority,
      due_at: parsed.dueAt || null,
      created_by: user.id
    }).select("id").single());

    if (error) failSave("/dashboard/tasks", error);
    await recordActivity({
      careRecipientId: parsed.careRecipientId,
      actorId: user.id,
      actorName,
      action: "created",
      entity: "task",
      entityId: data?.id,
      summary: `Created task: ${parsed.title}.`
    });
    revalidatePath("/dashboard");
  } catch (error) {
    handleUnexpectedSaveFailure("/dashboard/tasks", error);
  }
}

export async function toggleTaskCompletion(formData: FormData) {
  const parsed = toggleTaskSchema.parse({
    taskId: formData.get("taskId"),
    careRecipientId: formData.get("careRecipientId"),
    completed: formData.get("completed") ? "on" : "off"
  });

  const { supabase, user, actorName } = await currentUser("/dashboard/tasks");
  await assertCircleAccess(parsed.careRecipientId, user.id, user.email, "/dashboard/tasks");

  const checked = parsed.completed === "on";
  const name =
    (typeof user.user_metadata.full_name === "string" && user.user_metadata.full_name.trim()) ||
    user.email ||
    "Care circle member";

  const { error } = await retrySupabase(() => supabase
    .from("tasks")
    .update({
      completed_at: checked ? new Date().toISOString() : null,
      completed_by: checked ? user.id : null,
      completed_by_name: checked ? name : null
    })
    .eq("id", parsed.taskId)
    .eq("care_recipient_id", parsed.careRecipientId));

  if (error) failSave("/dashboard/tasks", error);
  await recordActivity({
    careRecipientId: parsed.careRecipientId,
    actorId: user.id,
    actorName,
    action: checked ? "completed" : "reopened",
    entity: "task",
    entityId: parsed.taskId,
    summary: checked ? "Checked off a task." : "Reopened a task."
  });
  revalidatePath("/dashboard");
}

export async function createNote(formData: FormData) {
  const parsed = noteSchema.parse({
    careRecipientId: formData.get("careRecipientId"),
    authorName: formData.get("authorName"),
    body: formData.get("body"),
    noteType: formData.get("noteType") || "general"
  });

  const { supabase, user, actorName } = await currentUser("/dashboard/notes");
  await assertCircleAccess(parsed.careRecipientId, user.id, user.email, "/dashboard/notes");
  const { data, error } = await supabase.from("care_notes").insert({
    care_recipient_id: parsed.careRecipientId,
    author_id: user.id,
    author_name: parsed.authorName,
    body: parsed.body,
    note_type: parsed.noteType
  }).select("id").single();

  if (error) failSave("/dashboard/notes", error);
  await recordActivity({
    careRecipientId: parsed.careRecipientId,
    actorId: user.id,
    actorName,
    action: "created",
    entity: "note",
    entityId: data?.id,
    summary: `Added care note: ${parsed.body.slice(0, 80)}`
  });
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

  const { supabase, user, actorName } = await currentUser("/dashboard/videos");
  await assertCircleAccess(parsed.careRecipientId, user.id, user.email, "/dashboard/videos");
  const { data, error } = await supabase.from("caregiver_videos").insert({
    care_recipient_id: parsed.careRecipientId,
    title: parsed.title,
    category: parsed.category,
    description: parsed.description || null,
    embed_url: parsed.embedUrl || null,
    created_by: user.id
  }).select("id").single();

  if (error) failSave("/dashboard/videos", error);
  await recordActivity({
    careRecipientId: parsed.careRecipientId,
    actorId: user.id,
    actorName,
    action: "created",
    entity: "video",
    entityId: data?.id,
    summary: `Added care video: ${parsed.title}.`
  });
  revalidatePath("/dashboard");
}

export async function createMedication(formData: FormData) {
  try {
    const parsed = medicationSchema.parse({
      careRecipientId: formData.get("careRecipientId"),
      name: formData.get("name"),
      dosage: formData.get("dosage") || undefined,
      schedule: formData.get("schedule"),
      instructions: formData.get("instructions") || undefined,
      prescribedBy: formData.get("prescribedBy") || undefined,
      refillDueAt: formData.get("refillDueAt") || undefined
    });
    const { supabase, user, actorName } = await currentUser("/dashboard/medications");
    await assertCircleAccess(parsed.careRecipientId, user.id, user.email, "/dashboard/medications");
    const { data, error } = await retrySupabase(() => supabase.from("medications").insert({
      care_recipient_id: parsed.careRecipientId,
      name: parsed.name,
      dosage: parsed.dosage || null,
      schedule: parsed.schedule,
      instructions: parsed.instructions || null,
      prescribed_by: parsed.prescribedBy || null,
      refill_due_at: parsed.refillDueAt || null
    }).select("id").single());
    if (error) failSave("/dashboard/medications", error);
    await recordActivity({ careRecipientId: parsed.careRecipientId, actorId: user.id, actorName, action: "created", entity: "medication", entityId: data?.id, summary: `Added medication: ${parsed.name}.` });
    revalidatePath("/dashboard");
  } catch (error) {
    handleUnexpectedSaveFailure("/dashboard/medications", error);
  }
}

export async function createVisit(formData: FormData) {
  const parsed = visitSchema.parse({
    careRecipientId: formData.get("careRecipientId"),
    title: formData.get("title"),
    startsAt: formData.get("startsAt") || undefined,
    location: formData.get("location") || undefined,
    providerName: formData.get("providerName") || undefined,
    preparationNotes: formData.get("preparationNotes") || undefined
  });
  const { supabase, user, actorName } = await currentUser("/dashboard/visits");
  await assertCircleAccess(parsed.careRecipientId, user.id, user.email, "/dashboard/visits");
  const { data, error } = await supabase.from("visits").insert({
    care_recipient_id: parsed.careRecipientId,
    title: parsed.title,
    starts_at: parsed.startsAt || null,
    location: parsed.location || null,
    provider_name: parsed.providerName || null,
    preparation_notes: parsed.preparationNotes || null
  }).select("id").single();
  if (error) failSave("/dashboard/visits", error);
  await recordActivity({ careRecipientId: parsed.careRecipientId, actorId: user.id, actorName, action: "created", entity: "visit", entityId: data?.id, summary: `Added appointment: ${parsed.title}.` });
  revalidatePath("/dashboard");
}

export async function createContact(formData: FormData) {
  const parsed = contactSchema.parse({
    careRecipientId: formData.get("careRecipientId"),
    name: formData.get("name"),
    role: formData.get("role"),
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || "",
    notes: formData.get("notes") || undefined
  });
  const { supabase, user, actorName } = await currentUser("/dashboard/family");
  await assertCircleAccess(parsed.careRecipientId, user.id, user.email, "/dashboard/family");
  const { data, error } = await supabase.from("contacts").insert({
    care_recipient_id: parsed.careRecipientId,
    name: parsed.name,
    role: parsed.role,
    phone: parsed.phone || null,
    email: parsed.email || null,
    notes: parsed.notes || null
  }).select("id").single();
  if (error) failSave("/dashboard/family", error);
  await recordActivity({ careRecipientId: parsed.careRecipientId, actorId: user.id, actorName, action: "created", entity: "contact", entityId: data?.id, summary: `Added contact: ${parsed.name}.` });
  revalidatePath("/dashboard");
}

export async function createDocument(formData: FormData) {
  const parsed = documentSchema.parse({
    careRecipientId: formData.get("careRecipientId"),
    title: formData.get("title"),
    category: formData.get("category"),
    externalUrl: formData.get("externalUrl") || "",
    notes: formData.get("notes") || undefined
  });
  const { supabase, user, actorName } = await currentUser("/dashboard/documents");
  await assertCircleAccess(parsed.careRecipientId, user.id, user.email, "/dashboard/documents");
  const { data, error } = await supabase.from("documents").insert({
    care_recipient_id: parsed.careRecipientId,
    title: parsed.title,
    category: parsed.category,
    external_url: parsed.externalUrl || null,
    notes: parsed.notes || null,
    uploaded_by: user.id
  }).select("id").single();
  if (error) failSave("/dashboard/documents", error);
  await recordActivity({ careRecipientId: parsed.careRecipientId, actorId: user.id, actorName, action: "created", entity: "document", entityId: data?.id, summary: `Added document: ${parsed.title}.` });
  revalidatePath("/dashboard");
}

export async function createReminder(formData: FormData) {
  const parsed = reminderSchema.parse({
    careRecipientId: formData.get("careRecipientId"),
    title: formData.get("title"),
    remindAt: formData.get("remindAt"),
    channel: formData.get("channel") || "app"
  });

  const { supabase, user, actorName } = await currentUser("/dashboard/reminders");
  await assertCircleAccess(parsed.careRecipientId, user.id, user.email, "/dashboard/reminders");
  const { data, error } = await supabase.from("reminders").insert({
    care_recipient_id: parsed.careRecipientId,
    title: parsed.title,
    remind_at: parsed.remindAt,
    channel: parsed.channel,
    created_by: user.id
  }).select("id").single();

  if (error) failSave("/dashboard/reminders", error);
  await recordActivity({
    careRecipientId: parsed.careRecipientId,
    actorId: user.id,
    actorName,
    action: "created",
    entity: "reminder",
    entityId: data?.id,
    summary: `Added reminder: ${parsed.title}.`
  });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/reminders");
}
