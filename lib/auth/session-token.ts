import { createHmac, timingSafeEqual } from "node:crypto";
import { ROLES, type Role } from "../data/types";

/**
 * Signed session token (TASK-023, ADR-LeaveTrack-E004):
 *
 *   v1.<base64url(JSON claims)>.<base64url(HMAC-SHA256(secret, "v1.<payload>"))>
 *
 * The algorithm is fixed — nothing in the token selects it. The signature is checked
 * (constant time) BEFORE the payload is parsed. Authorization is NOT taken from the
 * claims: getSession() re-reads the user from the database; `role` is carried only so
 * proxy.ts can route without a database lookup.
 *
 * Pure module (no server-only, relative imports) so proxy.ts, the server and the e2e
 * helpers share one implementation.
 */
export type SessionClaims = { uid: string; role: Role; iat: number; exp: number };

export type VerifyResult =
  | { ok: true; claims: SessionClaims }
  | { ok: false; reason: "malformed" | "version" | "signature" | "expired" | "future" };

const VERSION = "v1";
export const MAX_TOKEN_LENGTH = 1024;
/** Clock skew tolerated for `iat` in the future. */
const MAX_FUTURE_SKEW_SECONDS = 60;
/** HMAC-SHA256 digest size; every valid signature decodes to exactly this many bytes. */
const SIGNATURE_BYTES = 32;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const B64URL = /^[A-Za-z0-9_-]+$/;

const sign = (data: string, secret: string) =>
  createHmac("sha256", secret).update(data).digest("base64url");

export function signSessionToken(claims: SessionClaims, secret: string): string {
  const payload = Buffer.from(JSON.stringify(claims), "utf8").toString("base64url");
  const data = `${VERSION}.${payload}`;
  return `${data}.${sign(data, secret)}`;
}

function isClaims(value: unknown): value is SessionClaims {
  if (!value || typeof value !== "object") return false;
  const c = value as Record<string, unknown>;
  return (
    typeof c.uid === "string" &&
    UUID.test(c.uid) &&
    typeof c.role === "string" &&
    (ROLES as readonly string[]).includes(c.role) &&
    Number.isInteger(c.iat) &&
    Number.isInteger(c.exp) &&
    (c.exp as number) > (c.iat as number)
  );
}

export function verifySessionToken(
  token: unknown,
  secret: string,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): VerifyResult {
  if (typeof token !== "string" || token.length === 0 || token.length > MAX_TOKEN_LENGTH) {
    return { ok: false, reason: "malformed" };
  }
  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, reason: "malformed" };
  const [version, payload, signature] = parts as [string, string, string];
  if (version !== VERSION) return { ok: false, reason: "version" };
  if (!B64URL.test(payload) || !B64URL.test(signature)) return { ok: false, reason: "malformed" };

  const expected = Buffer.from(sign(`${version}.${payload}`, secret), "base64url");
  const given = Buffer.from(signature, "base64url");
  if (given.length !== SIGNATURE_BYTES || !timingSafeEqual(given, expected)) {
    return { ok: false, reason: "signature" };
  }

  let claims: unknown;
  try {
    claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (!isClaims(claims)) return { ok: false, reason: "malformed" };
  if (claims.exp <= nowSeconds) return { ok: false, reason: "expired" };
  if (claims.iat > nowSeconds + MAX_FUTURE_SKEW_SECONDS) return { ok: false, reason: "future" };
  return { ok: true, claims };
}
