"use client";

import { Check, Copy } from "lucide-react";
import { useRef, useState } from "react";

export function InviteLinkCopy({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      inputRef.current?.select();
      document.execCommand("copy");
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="invite-link-copy">
      <input ref={inputRef} value={url} readOnly aria-label="Invite link" onFocus={event => event.currentTarget.select()} />
      <button className="ghost small" type="button" onClick={copyLink} aria-label="Copy invite link">
        {copied ? <Check size={17} /> : <Copy size={17} />}
        <span>{copied ? "Copied" : "Copy"}</span>
      </button>
    </div>
  );
}
