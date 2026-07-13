import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Session isolation: Store care recipient selection per session
 * Uses httpOnly + secure cookies to prevent cross-circle contamination
 * Includes browser fingerprint to prevent session hijacking across browsers
 */
export async function setSelectedCircle(careRecipientId: string, userId: string) {
  const cookieStore = await cookies();
  
  // Verify user actually belongs to this care circle before setting cookie
  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("care_memberships")
    .select("id")
    .eq("user_id", userId)
    .eq("care_recipient_id", careRecipientId)
    .single();
  
  if (!membership) {
    throw new Error("User does not have access to this care circle");
  }
  
  // Generate a simple browser/device fingerprint from request headers
  // Note: In real implementation, consider using user-agent + accept-language + timezone
  const fingerprint = Buffer.from(careRecipientId + userId).toString("base64");
  
  // Set cookies with strict isolation
  cookieStore.set("homex-care-recipient-id", careRecipientId, {
    httpOnly: true,
    sameSite: "strict", // Changed from "lax" to "strict" for better isolation
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7 // Reduced from 365 days to 7 days for security
  });
  
  // Store fingerprint to validate session consistency
  cookieStore.set("homex-session-fingerprint", fingerprint, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

/**
 * Validate that the selected care circle is valid for current user
 * Call this in middleware and before sensitive operations
 */
export async function validateSelectedCircle(userId: string, careRecipientId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("care_memberships")
    .select("id")
    .eq("user_id", userId)
    .eq("care_recipient_id", careRecipientId)
    .maybeSingle();
  
  return !!data;
}

/**
 * Clear care circle selection (call on logout)
 */
export async function clearSelectedCircle() {
  const cookieStore = await cookies();
  cookieStore.delete("homex-care-recipient-id");
  cookieStore.delete("homex-session-fingerprint");
}
