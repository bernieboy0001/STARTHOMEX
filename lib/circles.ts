import { cookies } from "next/headers";

export async function setSelectedCircle(careRecipientId: string) {
  const cookieStore = await cookies();
  cookieStore.set("homex-care-recipient-id", careRecipientId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365
  });
}
