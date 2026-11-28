import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  MAX_TOKEN_LENGTH,
  newSessionId,
  renewClaims,
  signSessionToken,
  verifySessionToken,
  type SessionClaims,
} from '@/lib/auth/session-token';

/** TASK-023 AC1 — forged, tampered, expired or malformed tokens never verify. */
const SECRET = 'a'.repeat(64);
const NOW = 1_800_000_000;
const ANA = '00000000-0000-4000-8000-000000000101';
const SID = 'AbCdEfGhIjKlMnOpQrStUv'; // 22 base64url chars = 16 bytes
const claims: SessionClaims = {
  uid: ANA,
  role: 'employee',
  sid: SID,
  iat: NOW,
  lat: NOW,
  exp: NOW + 8 * 3600,
};
const b64 = (v: unknown) => Buffer.from(JSON.stringify(v)).toString('base64url');
/** Re-sign arbitrary bytes with the real secret — proves claim validation, not just the signature. */
const signedRaw = (payloadB64: string, secret = SECRET) =>
  `v2.${payloadB64}.${createHmac('sha256', secret).update(`v2.${payloadB64}`).digest('base64url')}`;

describe('session token', () => {
  it('round-trips valid claims', () => {
    const token = signSessionToken(claims, SECRET);
    expect(token).toMatch(/^v2\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    expect(verifySessionToken(token, SECRET, NOW)).toEqual({ ok: true, claims });
  });

  it('rejects a token signed with a different secret (forged)', () => {
    const forged = signSessionToken(claims, 'b'.repeat(64));
    expect(verifySessionToken(forged, SECRET, NOW)).toEqual({ ok: false, reason: 'signature' });
  });

  it.each([
    ['role escalated to hr_admin', { ...claims, role: 'hr_admin' }],
    ['uid swapped to another user', { ...claims, uid: '00000000-0000-4000-8000-000000000001' }],
    ['expiry extended', { ...claims, exp: NOW + 365 * 86400 }],
  ])('rejects a tampered payload with the original signature: %s', (_l, tampered) => {
    const [, , sig] = signSessionToken(claims, SECRET).split('.');
    expect(verifySessionToken(`v2.${b64(tampered)}.${sig}`, SECRET, NOW)).toEqual({
      ok: false,
      reason: 'signature',
    });
  });

  it('rejects a tampered signature', () => {
    const token = signSessionToken(claims, SECRET);
    const flipped = token.slice(0, -2) + (token.endsWith('AA') ? 'BB' : 'AA');
    expect(verifySessionToken(flipped, SECRET, NOW).ok).toBe(false);
  });

  it.each([
    ['expired', { ...claims, iat: NOW - 3600, lat: NOW - 3600, exp: NOW - 1 }, 'expired'],
    ['expiring exactly now', { ...claims, iat: NOW - 3600, lat: NOW - 3600, exp: NOW }, 'expired'],
    [
      'issued 61 s in the future',
      { ...claims, iat: NOW + 61, lat: NOW + 61, exp: NOW + 9 * 3600 },
      'future',
    ],
  ])('rejects a correctly signed token that is %s', (_l, c, reason) => {
    expect(verifySessionToken(signSessionToken(c as SessionClaims, SECRET), SECRET, NOW)).toEqual({
      ok: false,
      reason,
    });
  });

  it('accepts a token issued up to 60 s in the future (clock skew)', () => {
    const c = { ...claims, iat: NOW + 60, lat: NOW + 60, exp: NOW + 9 * 3600 };
    expect(verifySessionToken(signSessionToken(c, SECRET), SECRET, NOW).ok).toBe(true);
  });

  it.each([
    ['exp not after iat', { ...claims, exp: claims.iat }],
    ['unknown role', { ...claims, role: 'admin' }],
    ['uid not a uuid', { ...claims, uid: 'ana' }],
    ['non-integer iat', { ...claims, iat: NOW + 0.5 }],
    ['missing role', { uid: ANA, iat: NOW, exp: NOW + 10 }],
  ])('rejects correctly signed but invalid claims: %s', (_l, c) => {
    expect(verifySessionToken(signedRaw(b64(c)), SECRET, NOW)).toEqual({
      ok: false,
      reason: 'malformed',
    });
  });

  it('rejects a correctly signed payload that is not JSON (parsed only after the signature)', () => {
    const notJson = Buffer.from('not json').toString('base64url');
    expect(verifySessionToken(signedRaw(notJson), SECRET, NOW)).toEqual({
      ok: false,
      reason: 'malformed',
    });
  });

  it.each([
    ['undefined', undefined],
    ['empty', ''],
    ['two segments', 'v2.abc'],
    ['four segments', 'v2.a.b.c'],
    ['invalid base64url', 'v2.a+b/c=.sig'],
    ['over the size limit', 'v2.' + 'a'.repeat(MAX_TOKEN_LENGTH) + '.sig'],
    ['a number', 42],
  ])('rejects a malformed token: %s', (_l, token) => {
    expect(verifySessionToken(token, SECRET, NOW)).toEqual({ ok: false, reason: 'malformed' });
  });

  it('rejects an unknown version', () => {
    const token = signSessionToken(claims, SECRET).replace(/^v2\./, 'v3.');
    expect(verifySessionToken(token, SECRET, NOW)).toEqual({ ok: false, reason: 'version' });
  });
});

describe('session token v2 (TASK-025): sid, last activity, idle, absolute limit', () => {
  const IDLE = 30 * 60;

  it('rejects a pre-TASK-025 v1 token, even one correctly signed with the right secret', () => {
    const payload = b64({ uid: ANA, role: 'employee', iat: NOW, exp: NOW + 8 * 3600 });
    const sig = createHmac('sha256', SECRET).update(`v1.${payload}`).digest('base64url');
    expect(verifySessionToken(`v1.${payload}.${sig}`, SECRET, NOW)).toEqual({
      ok: false,
      reason: 'version',
    });
  });

  it.each([
    ['no sid', { ...claims, sid: undefined }],
    ['a short sid', { ...claims, sid: 'abc' }],
    ['a sid with invalid characters', { ...claims, sid: 'AbCdEfGhIjKlMnOpQrSt+/' }],
    ['no lat', { ...claims, lat: undefined }],
    ['lat before sign-in', { ...claims, lat: NOW - 1 }],
    ['lat after the absolute expiry', { ...claims, lat: claims.exp + 1 }],
    ['a non-integer lat', { ...claims, lat: NOW + 0.5 }],
  ])('rejects correctly signed claims with %s', (_l, c) => {
    expect(verifySessionToken(signedRaw(b64(c)), SECRET, NOW)).toEqual({
      ok: false,
      reason: 'malformed',
    });
  });

  it('idle: accepted until the idle timeout, rejected from that second on', () => {
    const token = signSessionToken(claims, SECRET);
    expect(verifySessionToken(token, SECRET, NOW + IDLE - 1, IDLE).ok).toBe(true);
    expect(verifySessionToken(token, SECRET, NOW + IDLE, IDLE)).toEqual({
      ok: false,
      reason: 'idle',
    });
  });

  it('idle is measured from lat (last activity), not from sign-in', () => {
    const active = { ...claims, lat: NOW + 4 * 3600 };
    const token = signSessionToken(active, SECRET);
    expect(verifySessionToken(token, SECRET, NOW + 4 * 3600 + IDLE - 1, IDLE).ok).toBe(true);
    expect(verifySessionToken(token, SECRET, NOW + 4 * 3600 + IDLE, IDLE)).toMatchObject({
      reason: 'idle',
    });
  });

  it('absolute: a constantly active session still ends at exp', () => {
    const busy = { ...claims, lat: claims.exp - 1 };
    expect(verifySessionToken(signSessionToken(busy, SECRET), SECRET, claims.exp, IDLE)).toEqual({
      ok: false,
      reason: 'expired',
    });
  });

  it('rejects lat more than 60 s in the future', () => {
    const c = { ...claims, lat: NOW + 120 };
    expect(verifySessionToken(signSessionToken(c, SECRET), SECRET, NOW)).toEqual({
      ok: false,
      reason: 'future',
    });
  });

  it('renewClaims moves ONLY lat, and never past exp — for any renewal time', () => {
    for (let i = 0; i < 500; i++) {
      const at = NOW + Math.floor(Math.random() * 10 * 3600) - 3600;
      const renewed = renewClaims(claims, at);
      expect({ ...renewed, lat: claims.lat }).toEqual(claims); // uid, role, sid, iat, exp kept
      expect(renewed.lat).toBeGreaterThanOrEqual(claims.lat); // never goes back
      expect(renewed.lat).toBeLessThanOrEqual(claims.exp); // never past the absolute limit
    }
  });

  it('newSessionId: 128 random bits, base64url, different every time', () => {
    const ids = new Set(Array.from({ length: 200 }, newSessionId));
    expect(ids.size).toBe(200);
    for (const id of ids) expect(id).toMatch(/^[A-Za-z0-9_-]{22}$/);
  });
});
