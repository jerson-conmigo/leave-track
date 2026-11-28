import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * TASK-023/024 — the session cookies and their signing stay behind the auth boundary:
 * only these files touch our cookie, only the auth port creates or verifies tokens, and
 * only the Supabase adapter touches the provider's `sb-*` cookies or Supabase clients.
 * A new file reading `lt-session` or signing tokens directly fails here until reviewed.
 */
const root = path.resolve(import.meta.dirname, '../..');
const files = (dir: string): string[] =>
  readdirSync(dir).flatMap(f => {
    const p = path.join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.(ts|tsx)$/.test(f) ? [p] : [];
  });
const appFiles = [
  ...['app', 'lib', 'components'].flatMap(d => files(path.join(root, d))),
  path.join(root, 'proxy.ts'),
];
const using = (pattern: RegExp) =>
  appFiles
    .filter(f => pattern.test(readFileSync(f, 'utf8')))
    .map(f => path.relative(root, f))
    .sort();

describe('session boundary', () => {
  it('only completeSignIn writes the session cookie; only proxy.ts and getSession read it', () => {
    expect(using(/\bSESSION_COOKIE\b|["'`]lt-session["'`]/)).toEqual([
      // TASK-057: names `lt-session` in the OpenAPI cookieAuth scheme for documentation only —
      // it never reads, writes or manages the session cookie.
      'lib/api/openapi.ts',
      'lib/auth/cookies.ts',
      'lib/auth/session.ts',
      'lib/auth/sign-in.ts',
      'proxy.ts',
    ]);
  });

  it('only lib/auth/sign-in.ts SETS the session cookie', () => {
    expect(using(/\.set\(\s*SESSION_COOKIE\b/)).toEqual(['lib/auth/sign-in.ts']);
  });

  it('TASK-025: the sliding renewal is written by sign-in.ts and triggered ONLY by proxy.ts', () => {
    // renewSession (sign-in.ts) is the one extra writer, and only proxy.ts may call it.
    expect(using(/\brenewSession\(/)).toEqual(['lib/auth/sign-in.ts', 'proxy.ts']);
    // Pinned by import too, so passing the function around (not calling it) is caught as well.
    expect(using(/import[^;]*\brenewSession\b[^;]*from/)).toEqual(['proxy.ts']);
    expect(using(/export\s*\{[^}]*\brenewSession\b/)).toEqual([]);
    // The renewed token is minted only through the auth port, used only by sign-in.ts.
    expect(using(/\brenewSessionToken\b/)).toEqual(['lib/auth/provider.ts', 'lib/auth/sign-in.ts']);
  });

  it('TASK-025: a renewal keeps the absolute limit — max age counts down to exp, never 8 h again', () => {
    const signIn = readFileSync(path.join(root, 'lib/auth/sign-in.ts'), 'utf8');
    const renew = signIn.slice(signIn.indexOf('export function renewSession'));
    const body = renew.slice(0, renew.indexOf('\n}\n'));
    expect(body).toMatch(/maxAge: Math\.max\(1, claims\.exp - now\)/);
    expect(body).not.toMatch(/SESSION_MAX_AGE_SECONDS/);
    const token = readFileSync(path.join(root, 'lib/auth/session-token.ts'), 'utf8');
    const renewClaims = token.slice(token.indexOf('export function renewClaims'));
    expect(renewClaims.slice(0, renewClaims.indexOf('\n}\n'))).toMatch(
      /return \{ \.\.\.claims, lat: /
    );
  });

  it('TASK-025: client components never import the session cookie, token or session modules', () => {
    const clientFiles = appFiles.filter(f => /^["']use client["'];/m.test(readFileSync(f, 'utf8')));
    expect(clientFiles.length).toBeGreaterThan(0);
    const offenders = clientFiles.filter(f =>
      /from "@\/lib\/auth\/(cookies|session|session-token|sign-in|provider|session-secret)"/.test(
        readFileSync(f, 'utf8')
      )
    );
    expect(offenders.map(f => path.relative(root, f))).toEqual([]);
  });

  it('only the Supabase adapter creates Supabase clients or touches the sb-* cookies (TASK-024)', () => {
    expect(
      using(
        /@supabase\/|createServerClient|createSupabaseServerClient|PROVIDER_COOKIE_PREFIX|["'`]sb-/
      )
    ).toEqual(['lib/auth/supabase/adapter.ts', 'lib/auth/supabase/client.ts']);
  });

  it('the users row is found by auth_user_id, never by email, at sign-in (TASK-024)', () => {
    expect(using(/getUserByAuthUserId/)).toEqual([
      'app/(public)/auth/set-password/actions.ts',
      'app/(public)/login/actions.ts',
      'lib/auth/session.ts',
      'lib/data/mock/repository.ts',
      'lib/data/postgres-repository.ts',
      'lib/data/repositories.ts',
    ]);
    expect(using(/getUserByEmail|by_email|where\s+(lower\()?email/i)).toEqual([]);
  });

  it('only the auth port signs or verifies session tokens', () => {
    expect(using(/\b(signSessionToken|verifySessionToken)\b/)).toEqual([
      'lib/auth/provider.ts',
      'lib/auth/session-token.ts',
    ]);
  });

  it('nothing reads the Day 0 unsigned cookies', () => {
    expect(using(/\.get\(\s*["'`]mock-(role|user-id)["'`]/)).toEqual([]);
  });
});
