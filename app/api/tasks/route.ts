import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { canAccessCircle } from "@/lib/circles";
import { retrySupabase } from "@/lib/retry";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  careRecipientId: z.string().uuid(),
  title: z.string().min(3),
  ownerName: z.string().min(1),
  priority: z.enum(["low", "medium", "high"]),
  dueAt: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Complete the task title, owner, and priority." }, { status: 400 });

    const auth = await createClient();
    const { data: authData } = await retrySupabase(() => auth.auth.getUser());
    const user = authData.user;
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    if (!(await canAccessCircle(parsed.data.careRecipientId, user.id, user.email))) {
      return NextResponse.json({ error: "No access to this care circle." }, { status: 403 });
    }

    const { error } = await retrySupabase(() => createAdminClient().from("tasks").insert({
      care_recipient_id: parsed.data.careRecipientId,
      title: parsed.data.title,
      owner_name: parsed.data.ownerName,
      priority: parsed.data.priority,
      due_at: parsed.data.dueAt || null,
      created_by: user.id
    }));

    if (error) return NextResponse.json({ error: "Task could not be saved. Please try again." }, { status: 503 });
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/tasks");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Task API save failed", error);
    return NextResponse.json({ error: "Task could not be saved. Please try again." }, { status: 503 });
  }
}
