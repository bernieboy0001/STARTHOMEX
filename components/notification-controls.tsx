"use client";

import { useEffect, useState } from "react";

function toBase64Url(value: string) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map(char => char.charCodeAt(0)));
}

export function NotificationControls({ publicKey }: { publicKey?: string }) {
  const [status, setStatus] = useState("Checking this device");
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported("Notification" in window && "serviceWorker" in navigator && "PushManager" in window);
    setStatus(Notification.permission === "granted" ? "Notifications are allowed" : "Notifications are not enabled");
  }, []);

  async function enable() {
    if (!supported) {
      setStatus("This browser does not support push notifications.");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setStatus("Notifications were not allowed on this device.");
      return;
    }

    if (!publicKey) {
      setStatus("Notifications are allowed. Add NEXT_PUBLIC_VAPID_PUBLIC_KEY to activate background push delivery.");
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: toBase64Url(publicKey)
    });

    const response = await fetch("/api/notifications/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(subscription)
    });

    setStatus(response.ok ? "This device is subscribed for reminders." : "Device permission worked, but saving the subscription failed.");
  }

  return (
    <div className="stack gap-sm">
      <p className="muted">{status}</p>
      <button className="button" type="button" onClick={enable}>Enable notifications</button>
    </div>
  );
}
