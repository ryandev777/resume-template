"use client";

import { useEffect } from "react";

/** Registers public/sw.js. Skipped outside production so `next dev`'s own Turbopack HMR/caching
 * never fights with the service worker's cache — this only needs to run against a real build
 * (Vercel deploy or `next start`). Renders nothing; this is a boot-time side effect only. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // best-effort — PWA install/offline support degrades gracefully without it
    });
  }, []);

  return null;
}
