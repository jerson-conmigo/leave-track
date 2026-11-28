"use client";

import { useEffect } from "react";
import { SESSION_CHANNEL, type SessionMessage } from "@/lib/session/idle";

/**
 * Rendered by /login only when this browser has NO session (TASK-025). Cookies are shared by
 * every tab, so any other open LeaveTrack tab is now stale: tell it, and it goes to /login too.
 * Covers every way of ending a session (header sign-out, the idle warning, server expiry).
 */
export function SignedOutBroadcast() {
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const bc = new BroadcastChannel(SESSION_CHANNEL);
    bc.postMessage({ type: "signed-out" } satisfies SessionMessage);
    bc.close();
  }, []);
  return null;
}
