"use client";

import { BellRing } from "lucide-react";
import { useState } from "react";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function keyBytes(key: string) {
  const padding = "=".repeat((4 - (key.length % 4)) % 4);
  const base64 = (key + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from(raw, character => character.charCodeAt(0));
}

export function NotificationSettings() {
  const [message, setMessage] = useState("");
  const [working, setWorking] = useState(false);

  async function enable() {
    if (!publicKey) return setMessage("Notifications need a VAPID public key before they can be enabled.");
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return setMessage("This browser does not support push notifications.");
    setWorking(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return setMessage("Notifications were not allowed in this browser.");
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) });
      const response = await fetch("/api/notifications/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(subscription) });
      if (!response.ok) throw new Error("Unable to save notification settings.");
      setMessage("Notifications are enabled for this device.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to enable notifications.");
    } finally { setWorking(false); }
  }

  return <div className="notification-settings"><div><BellRing size={19} /><span><strong>Device notifications</strong><small>Get reminder alerts on this device.</small></span></div><button className="ghost" type="button" onClick={enable} disabled={working}>{working ? "Enabling..." : "Enable"}</button>{message && <p>{message}</p>}</div>;
}
