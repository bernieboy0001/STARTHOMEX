"use client";

import { useEffect, useRef, useTransition } from "react";
import { acceptCurrentSessionInvite } from "@/app/join/[token]/actions";

export function AcceptConfirmedInvite({ token }: { token: string }) {
  const started = useRef(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const formData = new FormData();
    formData.set("token", token);
    startTransition(() => {
      void acceptCurrentSessionInvite(formData);
    });
  }, [token]);

  return <p className="notice"><strong>Joining your care circle</strong><span>{isPending ? "Please wait a moment..." : "Preparing your access..."}</span></p>;
}
