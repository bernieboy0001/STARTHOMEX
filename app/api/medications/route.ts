import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { canAccessCircle } from "@/lib/circles";
import { retrySupabase } from "@/lib/retry";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  careRecipientId: z.string().uuid(),
  name: z.string().min(2),
  dosage: z.string().optional(),
  schedule: z.string().min(2),
  instructions: z.string().optional(),
  prescribedBy: z.string().optional(),
  refillDueAt: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Add the medication name and schedule." }, { status: 400 });

    const auth = await createClient();
    const { data: authData } = await retrySupabase(() => auth.auth.getUser());
    const user = authData.user;
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    if (!(await canAccessCircle(parsed.data.careRecipientId, user.id, user.email))) {
      return NextResponse.json({ error: "No access to this care circle." }, { status: 403 });
    }

    const { error } = await retrySupabase(() => createAdminClient().from("medications").insert({
      care_recipient_id: parsed.data.careRecipientId,
      name: parsed.data.name,
      dosage: parsed.data.dosage || null,
      schedule: parsed.data.schedule,
      instructions: parsed.data.instructions || null,
      prescribed_by: parsed.data.prescribedBy || null,
      refill_due_at: parsed.data.refillDueAt || null
    }));

    if (error) return NextResponse.json({ error: "Medication could not be saved. Please try again." }, { status: 503 });
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/medications");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Medication API save failed", error);
    return NextResponse.json({ error: "Medication could not be saved. Please try again." }, { status: 503 });
  }
}
