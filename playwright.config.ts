import { randomUUID } from "node:crypto";
import { defineConfig } from "@playwright/test";

/**
 * TASK-016 — mobile e2e against the PRODUCTION build in memory mode (no
 * DATABASE_URL, no external services). Workers inherit this process's env, so
 * the per-run reset token below is shared by the server and every test.
 */
process.env.E2E_RESET_TOKEN ??= randomUUID();
const PORT = 3100;
const isCI = !!process.env.CI;

const mobile = { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } as const;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1, // one server process with one in-memory store → serial, reset per test
  retries: isCI ? 1 : 0,
  forbidOnly: isCI,
  reporter: isCI ? [["list"], ["html", { open: "never" }]] : "list",
  timeout: 30_000,
  expect: { timeout: 7_000 },
  use: {
    baseURL: `http://localhost:${PORT}`,
    // Locally drive the installed Google Chrome (no browser download);
    // CI uses Playwright's bundled Chromium (cached in the workflow).
    ...(isCI ? {} : { channel: "chrome" }),
    reducedMotion: "reduce",
    locale: "en-US",
    timezoneId: "UTC",
    trace: "on-first-retry",
  },
  projects: [
    { name: "mobile-375", use: { ...mobile, viewport: { width: 375, height: 667 } } },
    {
      name: "mobile-320",
      testMatch: /(request-form|balance)\.mobile\.spec\.ts/,
      use: { ...mobile, viewport: { width: 320, height: 568 } },
    },
    {
      name: "landscape",
      testMatch: /(request-form|balance)\.mobile\.spec\.ts/,
      use: { ...mobile, viewport: { width: 667, height: 375 } },
    },
  ],
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: false, // a reused server wouldn't carry the reset token
    timeout: 240_000,
    env: {
      E2E_RESET_TOKEN: process.env.E2E_RESET_TOKEN,
      DATABASE_URL: "",
      LOG_LEVEL: "warn",
    },
  },
});
