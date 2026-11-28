import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AppError } from "@/lib/api/errors";
import { withErrorHandler } from "@/lib/api/with-error-handler";
import { fromCookieJar } from "@/lib/auth/cookie-io";
import { getAuthProvider } from "@/lib/auth/provider";

/**
 * GET /auth/confirm?token_hash=…&type=invite|recovery — the target of the invite and
 * password-reset emails (supabase/templates/*.html; TASK-024). Exchanges the one-time
 * token for a provider session, then ALWAYS continues to /auth/set-password: the
 * destination is fixed, never taken from the query (no open redirect). A bad or used
 * link goes to /login with a generic notice. 404 unless AUTH_PROVIDER=supabase.
 */
const ConfirmQuery = z.object({
  token_hash: z.string().min(1).max(512),
  type: z.enum(["invite", "recovery"]),
});

const SET_PASSWORD_PATH = "/auth/set-password";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const provider = getAuthProvider();
  if (provider.name !== "supabase") throw new AppError("NOT_FOUND", "Not found.");

  const parsed = ConfirmQuery.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  const ok =
    parsed.success &&
    (await provider.verifyEmailLink(
      fromCookieJar(await cookies()),
      parsed.data.token_hash,
      parsed.data.type,
    ));

  const target = ok ? SET_PASSWORD_PATH : "/login?error=link";
  return NextResponse.redirect(new URL(target, request.url));
});
