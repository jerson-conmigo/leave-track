import type { Metadata } from 'next';
import { CircleCheck, Info, ShieldCheck, Smartphone } from 'lucide-react';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/auth/login-form';
import { PasswordLoginForm } from '@/components/auth/password-login-form';
import { Brand } from '@/components/layout/brand';
import { SignedOutBroadcast } from '@/components/session/signed-out-broadcast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  devLoginAccountsEnabled,
  LOCAL_DEV_PASSWORD,
  toDevAccounts,
} from '@/lib/auth/dev-accounts';
import { getAuthProvider } from '@/lib/auth/provider';
import { safeRedirectPath } from '@/lib/auth/roles';
import { sessionPolicy } from '@/lib/auth/session-policy';
import { getSession } from '@/lib/auth/session';
import { repository } from '@/lib/data/repositories';

export const metadata: Metadata = { title: 'Sign in' };

const HIGHLIGHTS = [
  { icon: CircleCheck, text: 'Request time off and track approval in one place' },
  { icon: ShieldCheck, text: 'Managers only ever see their own team' },
  { icon: Smartphone, text: 'Works just as well on your phone' },
];

/** ?error=… values set by our own redirects; anything else is ignored. */
const NOTICES: Record<string, string> = {
  link: 'That link is invalid or has expired. Ask HR for a new invite, or reset your password.',
  'not-linked': "This account isn't set up for LeaveTrack. Contact HR.",
};

/** ?reason=… values set by our own sign-outs (TASK-025); anything else is ignored. */
function signedOutNotice(reason: unknown): string | undefined {
  if (reason === 'idle') {
    const minutes = Math.round(sessionPolicy().idleSeconds / 60);
    return `You were signed out after ${minutes} minutes without activity. Sign in to continue.`;
  }
  if (reason === 'expired') return 'Your session has ended. Sign in to continue.';
  return undefined;
}

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const { next, error, reason } = await searchParams;
  const nextPath = typeof next === 'string' ? next : undefined;
  // B16 (TASK-025): already signed in → go where they were heading, if that's a safe
  // same-origin path (never /login or /api; defaults to /dashboard).
  if (await getSession()) redirect(safeRedirectPath(nextPath));
  const signedOut = signedOutNotice(reason);
  const isMock = getAuthProvider().name === 'mock';
  // The mock picker lists every seeded user — never rendered with a real provider.
  const users = isMock ? await repository.listUsers() : [];
  // TASK-056: the local development account dropdown — decided on the server for THIS request.
  // When any guard fails, neither the password nor the account list is passed (so neither
  // reaches the page).
  const devLogin = !isMock && devLoginAccountsEnabled(process.env);
  const devAccounts = devLogin ? toDevAccounts(await repository.listUsers()) : undefined;

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <section
        aria-hidden
        className="relative hidden flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex"
      >
        <p className="text-lg font-semibold">LeaveTrack</p>
        <div>
          <h2 className="max-w-md text-3xl leading-tight font-semibold tracking-tight">
            Time off, without the email chains.
          </h2>
          <ul className="mt-8 flex flex-col gap-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm">
                <Icon className="size-5 shrink-0 opacity-90" />
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm opacity-80">Self-service leave for the whole team.</p>
      </section>

      <main className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <Brand className="mb-8 lg:hidden" />
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-1 mb-6 text-sm text-muted-foreground">
            Welcome back. Sign in to manage your leave.
          </p>
          <SignedOutBroadcast />
          {signedOut ? (
            <Alert role="status" className="mb-6">
              <Info aria-hidden />
              <AlertDescription>{signedOut}</AlertDescription>
            </Alert>
          ) : null}
          {isMock ? (
            <LoginForm
              mockUsers={users.map(u => ({ id: u.id, name: u.name, role: u.role }))}
              next={nextPath}
            />
          ) : (
            <PasswordLoginForm
              next={nextPath}
              notice={typeof error === 'string' ? NOTICES[error] : undefined}
              {...(devLogin ? { devAccounts, devPassword: LOCAL_DEV_PASSWORD } : {})}
            />
          )}
        </div>
      </main>
    </div>
  );
}
