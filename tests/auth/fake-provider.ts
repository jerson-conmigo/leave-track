import { vi } from "vitest";
import { mockAuthProvider, type AuthProvider } from "@/lib/auth/provider";

/**
 * A Supabase-shaped AuthProvider for unit tests (TASK-024): REAL signed session tokens
 * (from the mock adapter) plus spies for every provider call, so tests can script the
 * provider session without a network.
 */
export function fakeSupabaseProvider() {
  return {
    ...mockAuthProvider,
    name: "supabase" as const,
    refresh: vi.fn<AuthProvider["refresh"]>(async () => true),
    currentProviderUser: vi.fn<AuthProvider["currentProviderUser"]>(async () => null),
    signInWithPassword: vi.fn<AuthProvider["signInWithPassword"]>(async () => ({ ok: false })),
    verifyEmailLink: vi.fn<AuthProvider["verifyEmailLink"]>(async () => false),
    setPassword: vi.fn<AuthProvider["setPassword"]>(async () => ({ ok: false })),
    requestPasswordReset: vi.fn<AuthProvider["requestPasswordReset"]>(async () => {}),
    signOut: vi.fn<AuthProvider["signOut"]>(async () => {}),
  };
}

export type FakeProvider = ReturnType<typeof fakeSupabaseProvider>;

/** A cookie jar shaped like `await cookies()` (get/getAll/set/delete), with a log. */
export function fakeJar() {
  const store = new Map<string, string>();
  const deleted: string[] = [];
  return {
    store,
    deleted,
    get: (name: string) => (store.has(name) ? { name, value: store.get(name)! } : undefined),
    getAll: () => [...store].map(([name, value]) => ({ name, value })),
    set: (name: string, value: string) => void store.set(name, value),
    delete: (name: string) => {
      deleted.push(name);
      store.delete(name);
    },
  };
}
