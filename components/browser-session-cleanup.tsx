"use client";

import { useEffect } from "react";

/** Registers a deliberately small worker: it never caches authenticated routes. */
export function BrowserSessionCleanup() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(error => {
      console.warn("HOMEX offline support could not start", error);
    });
  }, []);

  return null;
}
