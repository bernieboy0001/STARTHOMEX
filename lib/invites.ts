import { appUrl } from "@/lib/auth";

export function inviteUrl(token: string) {
  return `${appUrl()}/join/${token}`;
}
