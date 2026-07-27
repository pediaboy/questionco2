"use client";

import { useEffect } from "react";

// Owner request 2026-07-27: Base44's scheduled workflow dispatcher is silently
// cancelling every run platform-wide (0 steps executed), and the GitHub Actions
// backup cron can lag 1-4h on this public repo's free scheduler queue. Both are
// outside our control. This hook is a third, self-contained trigger: while any
// member has a dashboard tab open, it pings the no-secret GET on
// /api/cron/auto-signal every ~15s, piggy-backing real traffic into a de-facto
// sub-minute tick. The endpoint self-debounces (skips if another tab/tick already
// ran <12s ago), so many open tabs never cause duplicate load.
export function useSignalHeartbeat() {
  useEffect(() => {
    let cancelled = false;

    const ping = () => {
      if (cancelled || document.visibilityState !== "visible") return;
      fetch("/api/cron/auto-signal", { method: "GET", cache: "no-store" }).catch(() => null);
    };

    ping();
    const interval = setInterval(ping, 15000);
    document.addEventListener("visibilitychange", ping);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", ping);
    };
  }, []);
}
