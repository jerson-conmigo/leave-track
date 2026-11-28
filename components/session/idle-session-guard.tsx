'use client';

import { Clock } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useIdleTimer, type EventsType } from 'react-idle-timer';
import { endSessionAction } from '@/app/(public)/login/actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  absoluteComesFirst,
  absoluteWarningAt,
  announcement,
  formatCountdown,
  heartbeatDue,
  isSessionMessage,
  loginUrlFor,
  SESSION_CHANNEL,
  shouldAnnounce,
  type SessionMessage,
  type WarningMode,
} from '@/lib/session/idle';

/** Server-provided timing (lib/auth/session.ts SessionTiming); times are epoch seconds. */
export type IdleSessionGuardProps = {
  idleTimeoutSeconds: number;
  warningSeconds: number;
  heartbeatIntervalSeconds: number;
  absoluteExpiresAt: number;
};

/** Activity that counts (D2): no mousemove, so a nudged mouse doesn't keep a session alive. */
const ACTIVITY_EVENTS: EventsType[] = ['keydown', 'pointerdown', 'wheel', 'touchstart', 'scroll'];
const HEARTBEAT_PATH = '/api/session/heartbeat';
/** Buttons wrap at 200 % text on a 320 px screen instead of widening the dialog; ≥ 44 px tall. */
const WRAP_BUTTON = 'h-auto min-h-11 whitespace-normal md:min-h-9';
/** A forced heartbeat right after another (the click that is also "activity") is one signal. */
const DEDUPE_MS = 2000;

/**
 * Idle warning (TASK-025, US-13). UX only — the server enforces the idle timeout and the
 * 8-hour limit on every request whatever this component does.
 *
 * - Real activity sends a heartbeat (at most one per heartbeatIntervalSeconds) so the server's
 *   idle window follows the user. Nothing is sent while idle.
 * - warningSeconds before the deadline an alertdialog shows a live countdown. Activity outside
 *   the dialog, "Stay signed in" or Esc keeps the session; "Log out" ends it everywhere.
 * - Tabs share one idle timer (react-idle-timer crossTab) and tell each other about "stay" and
 *   sign-out over a BroadcastChannel.
 * - Near the absolute limit the dialog says the session will end, and offers no way to extend.
 */
export function IdleSessionGuard({
  idleTimeoutSeconds,
  warningSeconds,
  heartbeatIntervalSeconds,
  absoluteExpiresAt,
}: IdleSessionGuardProps) {
  const [mode, setMode] = useState<WarningMode | null>(null);
  const [remaining, setRemaining] = useState(warningSeconds);
  const [spoken, setSpoken] = useState('');
  const lastHeartbeat = useRef<number | null>(null);
  const channel = useRef<BroadcastChannel | null>(null);
  const ended = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const absoluteMs = absoluteExpiresAt * 1000;

  const broadcast = useCallback((message: SessionMessage) => {
    channel.current?.postMessage(message);
  }, []);

  /** Leave for /login. Ends the session on the server first (best effort — it may be gone). */
  const signOut = useCallback(
    async (reason: 'idle' | 'expired' | null, { tell = true } = {}) => {
      if (ended.current) return;
      ended.current = true;
      if (tell) broadcast({ type: 'signed-out', ...(reason ? { reason } : {}) });
      try {
        await endSessionAction();
      } catch {
        // The server may already have ended the session (proxy.ts refuses the action).
      }
      window.location.assign(reason ? loginUrlFor(reason) : '/login');
    },
    [broadcast]
  );

  const sendHeartbeat = useCallback(
    async (force = false) => {
      const now = Date.now();
      const last = lastHeartbeat.current;
      if (
        force
          ? last !== null && now - last < DEDUPE_MS
          : !heartbeatDue(last, now, heartbeatIntervalSeconds)
      ) {
        return;
      }
      lastHeartbeat.current = now;
      try {
        const res = await fetch(HEARTBEAT_PATH, { method: 'POST', credentials: 'same-origin' });
        if (res.status === 401) void signOut('expired');
      } catch {
        // Offline for a moment: the next activity tries again; the server stays authoritative.
        lastHeartbeat.current = null;
      }
    },
    [heartbeatIntervalSeconds, signOut]
  );

  const timer = useIdleTimer({
    timeout: idleTimeoutSeconds * 1000,
    promptBeforeIdle: warningSeconds * 1000,
    events: ACTIVITY_EVENTS,
    throttle: 500,
    crossTab: true,
    syncTimers: 200,
    name: 'leavetrack-idle',
    onAction: () => {
      void sendHeartbeat();
    },
    onPrompt: () => {
      // If the 8-hour limit comes first, only the absolute warning applies.
      if (absoluteComesFirst(Date.now(), warningSeconds, absoluteMs)) return;
      setMode(m => (m === 'absolute' ? m : 'idle'));
    },
    onIdle: () => {
      void signOut('idle');
    },
  });

  // Marks <html> once the guard is mounted and its timers run (lets e2e tests wait for it).
  useEffect(() => {
    document.documentElement.dataset.idleGuard = 'ready';
    return () => {
      delete document.documentElement.dataset.idleGuard;
    };
  }, []);

  // The timer API object may change identity per render; effects read it through a ref.
  const timerRef = useRef(timer);
  useEffect(() => {
    timerRef.current = timer;
  });

  /** Keep the session: close the warning here and in every tab, and tell the server. */
  const stay = useCallback(() => {
    setMode(m => (m === 'absolute' ? m : null));
    timerRef.current.activate();
    broadcast({ type: 'active' });
    void sendHeartbeat(true);
  }, [broadcast, sendHeartbeat]);

  // Cross-tab messages: another tab stayed signed in, or the browser has no session any more.
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const bc = new BroadcastChannel(SESSION_CHANNEL);
    channel.current = bc;
    bc.onmessage = (event: MessageEvent<unknown>) => {
      if (!isSessionMessage(event.data)) return;
      if (event.data.type === 'active') {
        setMode(m => (m === 'absolute' ? m : null));
      } else {
        void signOut(event.data.reason ?? null, { tell: false });
      }
    };
    return () => {
      bc.close();
      channel.current = null;
    };
  }, [signOut]);

  // The 8-hour limit: warn warningSeconds before it, then leave. Activity can't move it.
  useEffect(() => {
    const now = Date.now();
    const warnIn = absoluteWarningAt(absoluteMs, warningSeconds) - now;
    const warn = setTimeout(() => setMode('absolute'), Math.max(0, warnIn));
    const end = setTimeout(() => void signOut('expired'), Math.max(0, absoluteMs - now));
    return () => {
      clearTimeout(warn);
      clearTimeout(end);
    };
  }, [absoluteMs, warningSeconds, signOut]);

  // Countdown, once a second while the warning is open.
  useEffect(() => {
    if (!mode) return;
    const tick = () => {
      const left =
        mode === 'absolute'
          ? (absoluteMs - Date.now()) / 1000
          : timerRef.current.getRemainingTime() / 1000;
      setRemaining(Math.ceil(left));
      if (shouldAnnounce(left)) setSpoken(announcement(left));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [mode, absoluteMs]);

  // D2: while the idle warning is open, activity OUTSIDE its controls (the dimmed page) counts
  // as "I'm back". Keys pressed on the dialog's own buttons are left to the buttons, so Enter on
  // "Log out" logs out.
  useEffect(() => {
    if (mode !== 'idle') return;
    const onActivity = (event: Event) => {
      if (event.target instanceof Node && contentRef.current?.contains(event.target)) return;
      stay();
    };
    const events = ['pointerdown', 'wheel', 'touchstart'];
    for (const e of events) document.addEventListener(e, onActivity, true);
    return () => {
      for (const e of events) document.removeEventListener(e, onActivity, true);
    };
  }, [mode, stay]);

  const open = mode !== null;
  const absolute = mode === 'absolute';

  return (
    <AlertDialog
      open={open}
      onOpenChange={next => {
        if (next) return;
        if (absolute) setMode(null);
        else stay(); // Esc = the safe default: stay signed in
      }}
    >
      <AlertDialogContent
        ref={contentRef}
        aria-describedby="idle-warning-description"
        className="p-4 sm:p-6"
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Clock aria-hidden className="size-5 shrink-0 text-status-pending-foreground" />
            {absolute ? 'Your session is ending' : 'Are you still there?'}
          </AlertDialogTitle>
          <AlertDialogDescription id="idle-warning-description">
            {absolute
              ? "For security, sessions end 8 hours after you sign in. Save your work — you'll need to sign in again."
              : "You've been inactive for a while. For your security you'll be signed out soon."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <p className="text-center text-3xl font-semibold tabular-nums" aria-hidden>
          {formatCountdown(remaining)}
        </p>
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {spoken}
        </p>
        <AlertDialogFooter>
          <AlertDialogAction
            className={cn(buttonVariants({ variant: 'outline' }), WRAP_BUTTON)}
            onClick={e => {
              e.preventDefault();
              void signOut(absolute ? 'expired' : null);
            }}
          >
            {absolute ? 'Sign in again' : 'Log out'}
          </AlertDialogAction>
          <AlertDialogCancel className={cn(buttonVariants(), WRAP_BUTTON)}>
            {absolute ? 'Dismiss' : 'Stay signed in'}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
