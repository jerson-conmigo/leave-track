import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  MAX_TOKEN_LENGTH,
  signSessionToken,
  verifySessionToken,
  type SessionClaims,
} from "@/lib/auth/session-token";

/** TASK-023 AC1 — forged, tampered, expired or malformed tokens never verify. */
const SECRET = "a".repeat(64);
const NOW = 1_800_000_000;
const ANA = "00000000-0000-4000-8000-000000000101";
const claims: SessionClaims = { uid: ANA, role: "employee", iat: NOW, exp: NOW + 8 * 3600 };
const b64 = (v: unknown) => Buffer.from(JSON.stringify(v)).toString("base64url");
/** Re-sign arbitrary bytes with the real secret — proves claim validation, not just the signature. */
const signedRaw = (payloadB64: string, secret = SECRET) =>
  `v1.${payloadB64}.${createHmac("sha256", secret).update(`v1.${payloadB64}`).digest("base64url")}`;

describe("session token", () => {
  it("round-trips valid claims", () => {
    const token = signSessionToken(claims, SECRET);
    expect(token).toMatch(/^v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    expect(verifySessionToken(token, SECRET, NOW)).toEqual({ ok: true, claims });
  });

  it("rejects a token signed with a different secret (forged)", () => {
    const forged = signSessionToken(claims, "b".repeat(64));
    expect(verifySessionToken(forged, SECRET, NOW)).toEqual({ ok: false, reason: "signature" });
  });

  it.each([
    ["role escalated to hr_admin", { ...claims, role: "hr_admin" }],
    ["uid swapped to another user", { ...claims, uid: "00000000-0000-4000-8000-000000000001" }],
    ["expiry extended", { ...claims, exp: NOW + 365 * 86400 }],
  ])("rejects a tampered payload with the original signature: %s", (_l, tampered) => {
    const [, , sig] = signSessionToken(claims, SECRET).split(".");
    expect(verifySessionToken(`v1.${b64(tampered)}.${sig}`, SECRET, NOW)).toEqual({
      ok: false,
      reason: "signature",
    });
  });

  it("rejects a tampered signature", () => {
    const token = signSessionToken(claims, SECRET);
    const flipped = token.slice(0, -2) + (token.endsWith("AA") ? "BB" : "AA");
    expect(verifySessionToken(flipped, SECRET, NOW).ok).toBe(false);
  });

  it.each([
    ["expired", { ...claims, iat: NOW - 3600, exp: NOW - 1 }, "expired"],
    ["expiring exactly now", { ...claims, iat: NOW - 3600, exp: NOW }, "expired"],
    ["issued 61 s in the future", { ...claims, iat: NOW + 61, exp: NOW + 9 * 3600 }, "future"],
  ])("rejects a correctly signed token that is %s", (_l, c, reason) => {
    expect(verifySessionToken(signSessionToken(c as SessionClaims, SECRET), SECRET, NOW)).toEqual({
      ok: false,
      reason,
    });
  });

  it("accepts a token issued up to 60 s in the future (clock skew)", () => {
    const c = { ...claims, iat: NOW + 60, exp: NOW + 9 * 3600 };
    expect(verifySessionToken(signSessionToken(c, SECRET), SECRET, NOW).ok).toBe(true);
  });

  it.each([
    ["exp not after iat", { ...claims, exp: claims.iat }],
    ["unknown role", { ...claims, role: "admin" }],
    ["uid not a uuid", { ...claims, uid: "ana" }],
    ["non-integer iat", { ...claims, iat: NOW + 0.5 }],
    ["missing role", { uid: ANA, iat: NOW, exp: NOW + 10 }],
  ])("rejects correctly signed but invalid claims: %s", (_l, c) => {
    expect(verifySessionToken(signedRaw(b64(c)), SECRET, NOW)).toEqual({
      ok: false,
      reason: "malformed",
    });
  });

  it("rejects a correctly signed payload that is not JSON (parsed only after the signature)", () => {
    const notJson = Buffer.from("not json").toString("base64url");
    expect(verifySessionToken(signedRaw(notJson), SECRET, NOW)).toEqual({
      ok: false,
      reason: "malformed",
    });
  });

  it.each([
    ["undefined", undefined],
    ["empty", ""],
    ["two segments", "v1.abc"],
    ["four segments", "v1.a.b.c"],
    ["invalid base64url", "v1.a+b/c=.sig"],
    ["over the size limit", "v1." + "a".repeat(MAX_TOKEN_LENGTH) + ".sig"],
    ["a number", 42],
  ])("rejects a malformed token: %s", (_l, token) => {
    expect(verifySessionToken(token, SECRET, NOW)).toEqual({ ok: false, reason: "malformed" });
  });

  it("rejects an unknown version", () => {
    const token = signSessionToken(claims, SECRET).replace(/^v1\./, "v2.");
    expect(verifySessionToken(token, SECRET, NOW)).toEqual({ ok: false, reason: "version" });
  });
});
