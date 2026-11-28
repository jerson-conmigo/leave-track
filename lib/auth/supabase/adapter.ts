import type { CookieIO } from "@/lib/auth/cookie-io";
import type { AuthProvider } from "@/lib/auth/provider";
import { clearProviderCookies, createSupabaseServerClient } from "@/lib/auth/supabase/client";
import { logger } from "@/lib/logger";

/**
 * The Supabase Auth half of the auth port (TASK-024, ADR-LeaveTrack-E004). Every
 * failure — wrong password, dead or revoked session, Supabase unreachable — fails
 * CLOSED (no identity). Logs carry error codes only: never emails, tokens or passwords.
 */
type SupabaseAccount = Omit<AuthProvider, "name" | "createSessionToken" | "readSessionToken">;

const noCookies: CookieIO = { getAll: () => [], setAll: () => {} };

const warn = (error: { code?: string; status?: number } | null | unknown, msg: string) =>
  logger.warn(
    {
      code: (error as { code?: string })?.code,
      status: (error as { status?: number })?.status,
    },
    msg,
  );

export const supabaseAccount: SupabaseAccount = {
  async refresh(io) {
    try {
      // getClaims verifies the access token and refreshes it (writing new cookies) when
      // it has expired.
      const { data, error } = await createSupabaseServerClient(io).auth.getClaims();
      if (!error && typeof data?.claims?.sub === "string") return true;
      if (error) warn(error, "provider session refresh failed");
    } catch (error) {
      warn(error, "provider session refresh threw");
    }
    clearProviderCookies(io);
    return false;
  },

  async currentProviderUser(io) {
    try {
      // getUser asks the Auth server, so a signed-out (revoked) session is rejected even
      // while its access token has not expired yet (AC3).
      const { data, error } = await createSupabaseServerClient(io).auth.getUser();
      return error || !data.user ? null : data.user.id;
    } catch (error) {
      warn(error, "provider user lookup threw");
      return null;
    }
  },

  async signInWithPassword(io, email, password) {
    try {
      const { data, error } = await createSupabaseServerClient(io).auth.signInWithPassword({
        email,
        password,
      });
      if (error || !data.user) {
        warn(error, "provider sign-in refused");
        return { ok: false };
      }
      return { ok: true, authUserId: data.user.id };
    } catch (error) {
      warn(error, "provider sign-in threw");
      return { ok: false };
    }
  },

  async verifyEmailLink(io, tokenHash, type) {
    try {
      const { error } = await createSupabaseServerClient(io).auth.verifyOtp({
        token_hash: tokenHash,
        type,
      });
      if (error) warn(error, "email link refused");
      return !error;
    } catch (error) {
      warn(error, "email link verification threw");
      return false;
    }
  },

  async setPassword(io, password) {
    try {
      const client = createSupabaseServerClient(io);
      const { data: current, error: sessionError } = await client.auth.getUser();
      if (sessionError || !current.user) return { ok: false };
      const { data, error } = await client.auth.updateUser({ password });
      if (error || !data.user) {
        warn(error, "password update refused");
        return { ok: false };
      }
      return { ok: true, authUserId: data.user.id };
    } catch (error) {
      warn(error, "password update threw");
      return { ok: false };
    }
  },

  async requestPasswordReset(email, redirectTo) {
    try {
      const { error } = await createSupabaseServerClient(noCookies).auth.resetPasswordForEmail(
        email,
        { redirectTo },
      );
      // Unknown address, rate limit, … — all invisible to the caller (no enumeration).
      if (error) warn(error, "password reset request not sent");
    } catch (error) {
      warn(error, "password reset request threw");
    }
  },

  async signOut(io) {
    try {
      // "local": revoke THIS session's refresh token on the Auth server.
      const { error } = await createSupabaseServerClient(io).auth.signOut({ scope: "local" });
      if (error) warn(error, "provider sign-out failed");
    } catch (error) {
      warn(error, "provider sign-out threw");
    }
    clearProviderCookies(io);
  },
};
