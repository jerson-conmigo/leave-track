import { AppError } from '@/lib/api/errors';
import { ok } from '@/lib/api/response';
import { withErrorHandler } from '@/lib/api/with-error-handler';
import { getSession, getSessionTiming } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * POST /api/session/heartbeat — the client idle warning's activity signal (TASK-025).
 * proxy.ts has already renewed the idle window for this request (it always renews a
 * heartbeat; the absolute expiry never moves). Returns the session's timing.
 * Sent only after real user activity — never on a timer — so an idle session still expires.
 *
 * 200 { success: true, data: SessionTiming } · 401 UNAUTHENTICATED (expired, idle or signed out)
 */
export const POST = withErrorHandler(async () => {
  const session = await getSession();
  if (!session) throw new AppError('UNAUTHENTICATED', 'Sign in to continue.');
  const timing = await getSessionTiming();
  if (!timing) throw new AppError('UNAUTHENTICATED', 'Sign in to continue.');
  return ok(timing, { headers: { 'Cache-Control': 'private, no-store' } });
});
