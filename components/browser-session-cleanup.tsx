"use client";

import { useEffect } from "react";

export function BrowserSessionCleanup() {
  useEffect(() => {
    async function cleanup() {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(registration => registration.unregister()));
      }

      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.filter(key => key.startsWith("homex-")).map(key => caches.delete(key)));
      }

      window.localStorage.removeItem("homex-offline-dashboard");
      window.localStorage.removeItem("homex-offline-emergency");
    }

    void cleanup();
  }, []);

  return null;
}
