import type { NextRequest, NextResponse } from "next/server";

/**
 * Cookie access handed to an auth adapter (TASK-024). The Supabase adapter keeps its
 * provider session in its own cookies and may refresh them on any call, so it
 * needs to read AND write cookies wherever it runs: proxy.ts, server actions, route
 * handlers and server components.
 */
export type CookieToSet = { name: string; value: string; options?: Record<string, unknown> };

export type CookieIO = {
  getAll(): { name: string; value: string }[];
  setAll(cookies: CookieToSet[]): void;
};

type CookieJar = {
  getAll(): { name: string; value: string }[];
  set(name: string, value: string, options?: Record<string, unknown>): unknown;
};

/**
 * Over `await cookies()`. Server components may not set cookies — Next throws — so
 * writes there are dropped: proxy.ts already refreshed the session for this request,
 * and server actions / route handlers (where writes are allowed) persist normally.
 */
export function fromCookieJar(jar: CookieJar): CookieIO {
  return {
    getAll: () => jar.getAll(),
    setAll(cookies) {
      try {
        for (const { name, value, options } of cookies) jar.set(name, value, options);
      } catch {
        // Read-only context (server component render) — see above.
      }
    },
  };
}

/**
 * For proxy.ts: reads the request, records every write so it can be applied to
 * whichever response the proxy finally returns (next, redirect or 401), and mirrors
 * writes onto the request so the page rendered after `NextResponse.next` sees them.
 */
export function proxyCookieIO(request: NextRequest): {
  io: CookieIO;
  applyTo<T extends NextResponse>(response: T): T;
} {
  const pending: CookieToSet[] = [];
  return {
    io: {
      getAll: () => request.cookies.getAll().map(({ name, value }) => ({ name, value })),
      setAll(cookies) {
        for (const cookie of cookies) {
          pending.push(cookie);
          request.cookies.set(cookie.name, cookie.value);
        }
      },
    },
    applyTo(response) {
      for (const { name, value, options } of pending) response.cookies.set(name, value, options);
      return response;
    },
  };
}
