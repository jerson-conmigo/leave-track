import { describe, expect, it } from 'vitest';
import {
  absoluteComesFirst,
  absoluteWarningAt,
  announcement,
  formatCountdown,
  heartbeatDue,
  isSessionMessage,
  loginUrlFor,
  shouldAnnounce,
} from '@/lib/session/idle';

/** TASK-025 — the idle warning's timing rules, without timers. */
describe('countdown', () => {
  it.each([
    [60, '1:00'],
    [59.2, '1:00'],
    [45, '0:45'],
    [5, '0:05'],
    [0.4, '0:01'],
    [0, '0:00'],
    [-3, '0:00'],
  ])('%s s → %s', (s, text) => expect(formatCountdown(s)).toBe(text));

  it('announces at 60, 30, 10 and 5 seconds only — not every second', () => {
    const spoken = Array.from({ length: 61 }, (_, i) => 60 - i).filter(shouldAnnounce);
    expect(spoken).toEqual([60, 30, 10, 5]);
    expect(announcement(60)).toBe('1 minute left before you are signed out.');
    expect(announcement(30)).toBe('30 seconds left before you are signed out.');
  });
});

describe('heartbeat throttle', () => {
  it('the first activity sends; then at most one per interval', () => {
    expect(heartbeatDue(null, 1_000, 30)).toBe(true);
    expect(heartbeatDue(1_000, 30_999, 30)).toBe(false);
    expect(heartbeatDue(1_000, 31_000, 30)).toBe(true);
  });
});

describe('absolute limit', () => {
  const abs = 10_000_000;
  it('the absolute warning opens warningSeconds before the limit', () => {
    expect(absoluteWarningAt(abs, 60)).toBe(abs - 60_000);
  });
  it('absoluteComesFirst when the idle deadline would fall at or after the limit', () => {
    expect(absoluteComesFirst(abs - 1_800_000, 1800, abs)).toBe(true);
    expect(absoluteComesFirst(abs - 1_800_001, 1800, abs)).toBe(false);
  });
});

describe('cross-tab messages and login URLs', () => {
  it.each([
    [{ type: 'active' }, true],
    [{ type: 'signed-out' }, true],
    [{ type: 'signed-out', reason: 'idle' }, true],
    [{ type: 'signed-out', reason: 'expired' }, true],
    [{ type: 'signed-out', reason: 'javascript:alert(1)' }, false],
    [{ type: 'navigate', to: 'https://evil.example' }, false],
    ['signed-out', false],
    [null, false],
  ])('%j → %s', (m, ok) => expect(isSessionMessage(m)).toBe(ok));

  it('only fixed reasons reach the login URL', () => {
    expect(loginUrlFor('idle')).toBe('/login?reason=idle');
    expect(loginUrlFor('expired')).toBe('/login?reason=expired');
  });
});
