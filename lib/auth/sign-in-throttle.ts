import { createHmac } from "node:crypto";
import type { RateLimitStore } from "@/lib/rate-limit/store";

/**
 * Sign-in throttling (TASK-025, US-13; first use of TASK-041's limiter). Counts FAILED password
 * sign-ins per account and per client IP:
 *   - 5 failures per email within 15 minutes
 *   - 20 failures per IP within 15 minutes (tolerant of a shared office IP)
 * Over either limit, sign-in is refused BEFORE the provider is contacted, with the same message
 * whether or not the account exists. Keys are HMACs — no raw email or IP is ever stored or
 * logged. Callers fail closed if the store errors.
 */
export const SIGN_IN_WINDOW_SECONDS = 15 * 60;
export const MAX_FAILURES_PER_EMAIL = 5;
export const MAX_FAILURES_PER_IP = 20;

export const THROTTLED_MESSAGE =
  "Too many sign-in attempts. Wait 15 minutes, then try again or reset your password.";
export const UNAVAILABLE_MESSAGE = "Sign-in is temporarily unavailable. Try again in a moment.";

export type SignInKeys = { email: string; ip: string };

/** HMAC-SHA256 under a subkey derived from the session secret (no new secret to manage). */
function digest(secret: string, value: string): string {
  const subkey = createHmac("sha256", secret).update("leavetrack:rate-limit:v1").digest();
  return createHmac("sha256", subkey).update(value).digest("hex");
}

export function signInKeys(email: string, ip: string, secret: string): SignInKeys {
  return {
    email: `signin:email:${digest(secret, email.trim().toLowerCase())}`,
    ip: `signin:ip:${digest(secret, ip)}`,
  };
}

/**
 * The client IP, trusted only on Vercel (which sets these headers itself). Anywhere else the
 * headers could be forged, so every request shares one "local" key.
 */
export function clientIp(headers: Headers, raw: Record<string, string | undefined>): string {
  if (!raw.VERCEL) return "local";
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return headers.get("x-real-ip")?.trim() || forwarded || "unknown";
}

export async function isSignInThrottled(
  store: RateLimitStore,
  keys: SignInKeys,
  now: Date,
): Promise<boolean> {
  const [byEmail, byIp] = await Promise.all([
    store.count(keys.email, SIGN_IN_WINDOW_SECONDS, now),
    store.count(keys.ip, SIGN_IN_WINDOW_SECONDS, now),
  ]);
  return byEmail >= MAX_FAILURES_PER_EMAIL || byIp >= MAX_FAILURES_PER_IP;
}

export async function recordSignInFailure(
  store: RateLimitStore,
  keys: SignInKeys,
  now: Date,
): Promise<void> {
  await Promise.all([
    store.hit(keys.email, SIGN_IN_WINDOW_SECONDS, now),
    store.hit(keys.ip, SIGN_IN_WINDOW_SECONDS, now),
  ]);
}

/** A successful sign-in clears the ACCOUNT's failures (not the IP's). */
export async function recordSignInSuccess(store: RateLimitStore, keys: SignInKeys): Promise<void> {
  await store.reset(keys.email);
}
