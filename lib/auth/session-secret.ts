import { randomBytes } from "node:crypto";
import { isDeployedEnv } from "@/lib/env";

/**
 * The HMAC key for session tokens (TASK-023).
 *  - SESSION_SECRET when set (lib/env.ts requires ≥ 32 characters, and requires it in
 *    every deployed environment).
 *  - Otherwise, ONLY when not deployed: a random 32-byte key created once per process.
 *    It lives on globalThis because Next.js loads proxy.ts and pages in separate module
 *    graphs (TASK-016 lesson); sessions reset when the process restarts.
 */
const globalForSession = globalThis as unknown as { __leaveTrackDevSessionSecret?: string };

export function getSessionSecret(): string {
  const configured = process.env.SESSION_SECRET;
  if (configured) return configured;
  if (isDeployedEnv(process.env)) {
    throw new Error("SESSION_SECRET is required in a deployed environment");
  }
  globalForSession.__leaveTrackDevSessionSecret ??= randomBytes(32).toString("hex");
  return globalForSession.__leaveTrackDevSessionSecret;
}
