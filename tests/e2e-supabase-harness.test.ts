import { readdirSync, readFileSync } from "node:fs";
import { createServer, type Server } from "node:net";
import path from "node:path";
import { createChunks, stringToBase64URL } from "@supabase/ssr";
import { afterEach, describe, expect, it } from "vitest";
import {
  accessTokenFromCookies,
  isTestEmail,
  TEST_EMAIL_DOMAIN,
  testEmail,
} from "../e2e-supabase/identities";
import { assertPortFree, probePort } from "../e2e-supabase/preflight";

/**
 * TASK-024 A1–A4 — the real-Supabase e2e harness, checked without Docker:
 *  A1 only test-domain identities are ever deleted; A2 AC3 stands alone;
 *  A3 the access token is read from real @supabase/ssr cookies; A4 port preflight.
 */
const root = path.resolve(import.meta.dirname, "..");
const harnessDir = path.join(root, "e2e-supabase");
const sources = Object.fromEntries(
  readdirSync(harnessDir)
    .filter((f) => f.endsWith(".ts"))
    .map((f) => [f, readFileSync(path.join(harnessDir, f), "utf8")]),
);

describe("A1 — test identities: only the reserved domain matches", () => {
  it("builds unique, lower-case addresses in the test domain", () => {
    expect(testEmail("AC3 HR", "Run_1")).toBe(`ac3-hr-run-1@${TEST_EMAIL_DOMAIN}`);
    expect(isTestEmail(testEmail("x", "y"))).toBe(true);
  });

  it.each([
    [`a@${TEST_EMAIL_DOMAIN}`, true],
    [`A@E2E-AUTH.LEAVETRACK.TEST`, true],
    ["carla.diaz@leavetrack.test", false], // seeded HR Admin
    ["ana.reyes@leavetrack.test", false], // seeded employee
    [`a@sub.${TEST_EMAIL_DOMAIN}`, false],
    [`a@${TEST_EMAIL_DOMAIN}.evil`, false],
    [`${TEST_EMAIL_DOMAIN}@example.com`, false],
    [`@${TEST_EMAIL_DOMAIN}`, false],
    ["", false],
    [null, false],
    [undefined, false],
  ])("isTestEmail(%s) → %s", (email, expected) => {
    expect(isTestEmail(email)).toBe(expected);
  });
});

describe("A3 — access token from real @supabase/ssr cookies", () => {
  const session = { access_token: "eyJ.test.token", refresh_token: "r", token_type: "bearer" };
  const key = "sb-127-auth-token";
  const encoded = `base64-${stringToBase64URL(JSON.stringify(session))}`;

  it("reads a single base64- cookie", async () => {
    expect(await accessTokenFromCookies([{ name: key, value: encoded }])).toBe(
      session.access_token,
    );
  });

  it("reassembles a chunked cookie (.0, .1, …) built by the library itself", async () => {
    const chunks = createChunks(key, encoded, 20);
    expect(chunks.length).toBeGreaterThan(1);
    const shuffled = [...chunks].reverse().concat([{ name: "lt-session", value: "x" }]);
    expect(await accessTokenFromCookies(shuffled)).toBe(session.access_token);
  });

  it("reads a raw (non-base64) session cookie", async () => {
    expect(await accessTokenFromCookies([{ name: key, value: JSON.stringify(session) }])).toBe(
      session.access_token,
    );
  });

  it.each([
    ["no auth cookie", [{ name: "lt-session", value: "x" }], /found 0/],
    [
      "two projects' cookies",
      [
        { name: key, value: encoded },
        { name: "sb-other-auth-token", value: encoded },
      ],
      /found 2/,
    ],
    ["garbled value", [{ name: key, value: "base64-%%%" }], /not a readable session/],
    [
      "no access_token",
      [{ name: key, value: `base64-${stringToBase64URL(JSON.stringify({ x: 1 }))}` }],
      /no access_token/,
    ],
  ])("%s → a clear error", async (_l, cookies, message) => {
    await expect(accessTokenFromCookies(cookies)).rejects.toThrow(message);
  });
});

describe("A4 — port preflight", () => {
  let server: Server | undefined;
  afterEach(
    () => new Promise<void>((resolve) => (server ? server.close(() => resolve()) : resolve())),
  );

  const listen = (host?: string) =>
    new Promise<number>((resolve) => {
      server = createServer();
      server.listen({ port: 0, host }, () => {
        const address = server!.address();
        resolve(typeof address === "object" && address ? address.port : 0);
      });
    });

  it.each([
    ["127.0.0.1 only", "127.0.0.1"],
    ["all interfaces (how next start binds)", undefined],
  ])("occupied (%s) → a helpful error naming the port, site_url and the fix", async (_l, host) => {
    const port = await listen(host);
    expect(probePort(port)).toBe("EADDRINUSE");
    expect(() => assertPortFree(port)).toThrow(
      new RegExp(
        `Port ${port} is already in use.*supabase/config\\.toml \\[auth\\] site_url.*lsof -i :${port}`,
      ),
    );
  });

  it("a free port passes", async () => {
    const port = await listen("127.0.0.1");
    await new Promise<void>((resolve) => server!.close(() => resolve()));
    server = undefined;
    expect(probePort(port)).toBe("FREE");
    expect(() => assertPortFree(port)).not.toThrow();
  });

  it("a probe that cannot decide → still a clear error, never a silent pass", () => {
    expect(() => assertPortFree(3000, () => "EACCES")).toThrow(/could not be checked \(EACCES\)/);
  });
});

describe("structure: the harness can only ever touch test identities", () => {
  const all = Object.values(sources).join("\n");

  it("finds the harness files (guards against a vacuous pass)", () => {
    expect(Object.keys(sources).sort()).toEqual([
      "auth.spec.ts",
      "harness.ts",
      "identities.ts",
      "preflight.ts",
    ]);
  });

  it("never clears auth_user_id links in bulk", () => {
    expect(all).not.toMatch(/auth_user_id\s*=\s*null/i);
  });

  it("every provider-user delete is preceded by a test-domain assertion", () => {
    const deletes = [...all.matchAll(/deleteUser\(/g)];
    expect(deletes.length).toBeGreaterThan(0);
    for (const m of deletes) {
      expect(all.slice(Math.max(0, m.index! - 200), m.index)).toMatch(/assertTestEmail\(/);
    }
    expect(sources["harness.ts"]).toMatch(/\.filter\(\(u\) => isTestEmail\(u\.email\)\)/);
  });

  it("app users are deleted by id after an isTestEmail re-check, never by a bare pattern", () => {
    expect(sources["harness.ts"]).toMatch(/\.filter\(\(r\) => isTestEmail\(r\.email\)\)/);
    expect(all).not.toMatch(/delete from users where (lower\()?email/i);
  });

  it("Mailpit is never wiped: every DELETE sends explicit IDs, guarded against an empty list", () => {
    const deletes = [...all.matchAll(/method: "DELETE"/g)];
    expect(deletes.length).toBeGreaterThan(0);
    for (const m of deletes) {
      expect(all.slice(m.index, m.index! + 200)).toMatch(/JSON\.stringify\(\{ IDs:/);
    }
    expect(sources["harness.ts"]).toMatch(/if \(mail\.length > 0\)/);
  });

  it('alerts are targeted at the app\'s alert component, never a bare getByRole("alert")', () => {
    // Next.js renders an empty role="alert" route announcer on every page, so a bare
    // getByRole("alert") is ambiguous (strict-mode failure seen in the TASK-024 real run).
    const code = all
      .split("\n")
      .filter((l) => !/^\s*(\*|\/\/|\/\*)/.test(l))
      .join("\n");
    const bare = [
      ...code.matchAll(
        /getByRole\(\s*["'`]alert["'`]\s*\)(?!\s*\.and\(\s*page\.locator\(\s*'\[data-slot="alert"\]'\s*\)\s*\))/g,
      ),
    ];
    expect(bare.map((m) => m[0])).toEqual([]);
    expect(sources["auth.spec.ts"]).toMatch(
      /appAlert\(page\)\)\.toHaveText\("Email or password is incorrect\."\)/,
    );
    expect(sources["auth.spec.ts"]).toMatch(
      /appAlert\(page\)\)\.toHaveText\(\/isn't set up for LeaveTrack\/\)/,
    );
  });

  it("appAlert excludes exactly the TASK-056 local-dev notice — by text that really is in it", () => {
    const spec = sources["auth.spec.ts"]!;
    const text = spec.match(/export const DEV_NOTICE_TEXT = "([^"]+)";/)?.[1];
    expect(text).toBeTruthy();
    expect(spec).toMatch(/\.filter\(\{ hasNotText: DEV_NOTICE_TEXT \}\)/);
    // The excluded text must be the notice's own wording, or the exclusion silently goes stale.
    const form = readFileSync(path.join(root, "components/auth/password-login-form.tsx"), "utf8");
    expect(form).toMatch(new RegExp(`>\\s*${text}\\.`));
    // Only that one exclusion: no other hasNotText / nth() shortcuts on the alert locator.
    expect(spec.match(/hasNotText/g)).toHaveLength(1);
    expect(spec).not.toMatch(/appAlert\(page\)\.(nth|first|last)\(/);
  });

  it("no seeded people are used by the suite (code, not comments)", () => {
    const code = all
      .split("\n")
      .filter((l) => !/^\s*(\*|\/\/|\/\*)/.test(l))
      .join("\n");
    expect(code).not.toMatch(/[a-z.]+@leavetrack\.test["'`]/);
  });

  it("AC3 creates its own linked user and needs nothing from AC1", () => {
    const spec = sources["auth.spec.ts"]!;
    const ac3 = spec.slice(spec.indexOf('test("AC3'));
    expect(ac3).toMatch(/createLinkedUser\(/);
    expect(ac3).not.toMatch(/ac1-/);
    // A3: positive control before sign-out, rejection after.
    expect(ac3.indexOf("anon.auth.getUser(token)")).toBeLessThan(
      ac3.indexOf("await signOut(page)"),
    );
    expect(ac3.lastIndexOf("anon.auth.getUser(token)")).toBeGreaterThan(
      ac3.indexOf("await signOut(page)"),
    );
    const afterSignOut = ac3.slice(ac3.lastIndexOf("anon.auth.getUser(token)"));
    expect(afterSignOut).toMatch(/expect\(after\.error\)\.not\.toBeNull\(\)/);
    expect(afterSignOut).toMatch(/expect\(after\.data\.user\)\.toBeNull\(\)/);
    const beforeSignOut = ac3.slice(0, ac3.indexOf("await signOut(page)"));
    expect(beforeSignOut).toMatch(/expect\(before\.error\)\.toBeNull\(\)/);
    expect(beforeSignOut).toMatch(/expect\(before\.data\.user\?\.id\)\.toBe\(authUserId\)/);
  });

  it("the app port matches supabase/config.toml site_url (A4's premise), checked in the main process", () => {
    const config = readFileSync(path.join(root, "playwright.supabase.config.ts"), "utf8");
    const toml = readFileSync(path.join(root, "supabase/config.toml"), "utf8");
    const port = config.match(/const PORT = (\d+);/)?.[1];
    expect(toml).toMatch(new RegExp(`^site_url = "http://localhost:${port}"$`, "m"));
    expect(config).toMatch(/if \(!process\.env\.TEST_WORKER_INDEX\) assertPortFree\(PORT\);/);
  });
});
