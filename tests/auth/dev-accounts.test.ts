import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  devLoginAccountsEnabled,
  isDevLoginHost,
  LOCAL_DEV_PASSWORD,
  toDevAccounts,
} from "@/lib/auth/dev-accounts";
import type { User } from "@/lib/data/types";

/**
 * TASK-056 — the local development account dropdown is shown only when EVERY guard holds, it
 * carries only name/email/role, and the password reaches the page only on that path.
 */
const root = path.resolve(import.meta.dirname, "../..");

const ON = {
  DEV_LOGIN_ACCOUNTS: "true",
  AUTH_PROVIDER: "supabase",
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
};

describe("devLoginAccountsEnabled — every guard must hold", () => {
  it("all guards hold → enabled (localhost works too)", () => {
    expect(devLoginAccountsEnabled(ON)).toBe(true);
    expect(
      devLoginAccountsEnabled({
        ...ON,
        NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
        DATABASE_URL: "postgresql://postgres:postgres@localhost:54322/postgres",
      }),
    ).toBe(true);
  });

  it.each<[string, Record<string, string | undefined>]>([
    ["no opt-in", { DEV_LOGIN_ACCOUNTS: undefined }],
    ["opt-in false", { DEV_LOGIN_ACCOUNTS: "false" }],
    ["opt-in not exactly 'true'", { DEV_LOGIN_ACCOUNTS: "TRUE" }],
    ["deployed (APP_ENV=production)", { APP_ENV: "production" }],
    ["deployed (APP_ENV=staging)", { APP_ENV: "staging" }],
    ["deployed (VERCEL_ENV=preview)", { VERCEL_ENV: "preview" }],
    ["mock sign-in", { AUTH_PROVIDER: "mock" }],
    ["no provider set (defaults to mock)", { AUTH_PROVIDER: undefined }],
    ["hosted Supabase URL", { NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co" }],
    ["missing Supabase URL", { NEXT_PUBLIC_SUPABASE_URL: undefined }],
    ["hosted database", { DATABASE_URL: "postgresql://u:p@db.abc.supabase.co:6543/postgres" }],
    ["missing database", { DATABASE_URL: undefined }],
  ])("%s → disabled", (_l, change) => {
    expect(devLoginAccountsEnabled({ ...ON, ...change })).toBe(false);
  });
});

describe("isDevLoginHost — strictly localhost or 127.0.0.1", () => {
  it.each([
    ["http://localhost:54321", true],
    ["http://127.0.0.1:54321", true],
    ["postgresql://postgres:postgres@127.0.0.1:54322/postgres", true],
    ["HTTP://LOCALHOST:3000", true],
    // Lookalikes, other loopback forms, private networks, remote hosts, garbage:
    ["http://127.0.0.1.nip.io:54321", false],
    ["http://localhost.example.com", false],
    ["http://127.0.0.2:54321", false],
    ["http://[::1]:54321", false],
    ["http://0.0.0.0:54321", false],
    ["http://192.168.1.10:54321", false],
    ["http://10.0.0.5:54321", false],
    ["http://172.16.0.1:54321", false],
    ["https://abc.supabase.co", false],
    ["localhost:54321", false],
    ["not a url", false],
    ["", false],
    [undefined, false],
  ])("%s → %s", (url, expected) => {
    expect(isDevLoginHost(url)).toBe(expected);
  });
});

describe("toDevAccounts — name, email and role only", () => {
  const user = (id: string, name: string, role: User["role"], managerId: string | null): User => ({
    id,
    name,
    email: `${name.toLowerCase()}@leavetrack.test`,
    role,
    managerId,
  });

  it("drops ids and manager links, and groups employee → manager → HR (by name)", () => {
    const out = toDevAccounts([
      user("3", "Carla", "hr_admin", null),
      user("2", "Ben", "manager", "3"),
      user("4", "Zoe", "employee", "2"),
      user("1", "Ana", "employee", "2"),
    ]);
    expect(out).toEqual([
      { name: "Ana", email: "ana@leavetrack.test", role: "employee" },
      { name: "Zoe", email: "zoe@leavetrack.test", role: "employee" },
      { name: "Ben", email: "ben@leavetrack.test", role: "manager" },
      { name: "Carla", email: "carla@leavetrack.test", role: "hr_admin" },
    ]);
    for (const a of out) expect(Object.keys(a).sort()).toEqual(["email", "name", "role"]);
  });
});

describe("structure: the password and the list reach the page only behind the guard", () => {
  const files = (dir: string): string[] =>
    readdirSync(dir).flatMap((f) => {
      const p = path.join(dir, f);
      return statSync(p).isDirectory() ? files(p) : /\.(ts|tsx|mjs|js)$/.test(f) ? [p] : [];
    });
  const page = readFileSync(path.join(root, "app/(public)/login/page.tsx"), "utf8");
  const form = readFileSync(path.join(root, "components/auth/password-login-form.tsx"), "utf8");

  it("the app password equals the seed script's (one value for app and seed)", () => {
    const seed = readFileSync(path.join(root, "scripts/dev-auth-seed.mjs"), "utf8");
    expect(seed.match(/export const LOCAL_DEV_PASSWORD = "([^"]+)"/)?.[1]).toBe(LOCAL_DEV_PASSWORD);
  });

  it("the password's value appears only in lib/auth/dev-accounts.ts and the seed script", () => {
    const holders = ["app", "lib", "components", "scripts"]
      .flatMap((d) => files(path.join(root, d)))
      .filter((f) => readFileSync(f, "utf8").includes(LOCAL_DEV_PASSWORD))
      .map((f) => path.relative(root, f))
      .sort();
    expect(holders).toEqual(["lib/auth/dev-accounts.ts", "scripts/dev-auth-seed.mjs"]);
  });

  it("the login page passes the list and password only inside the per-request guard", () => {
    expect(page).toMatch(/const devLogin = !isMock && devLoginAccountsEnabled\(process\.env\);/);
    expect(page).toMatch(
      /const devAccounts = devLogin \? toDevAccounts\(await repository\.listUsers\(\)\) : undefined;/,
    );
    expect(page).toMatch(
      /\{\.\.\.\(devLogin \? \{ devAccounts, devPassword: LOCAL_DEV_PASSWORD \} : \{\}\)\}/,
    );
    // Imported once, used once — nowhere else on the page.
    expect(page.match(/LOCAL_DEV_PASSWORD/g)).toHaveLength(2);
    expect(page.match(/devPassword/g)).toHaveLength(1);
  });

  it("the dropdown only fills the fields: it is never submitted and never submits", () => {
    // Find the menu by its handler (attribute order must not matter), and fail if it's missing.
    const handler = form.indexOf("onValueChange={fillDevAccount}");
    expect(handler).toBeGreaterThan(-1);
    const openTag = form.slice(
      form.lastIndexOf("<Select", handler),
      form.indexOf(">", handler) + 1,
    );
    expect(openTag).toMatch(/^<Select\b/);
    expect(openTag).not.toMatch(/\bname=/); // not part of the form data
    const start = form.indexOf("function fillDevAccount");
    expect(start).toBeGreaterThan(-1);
    const fill = form.slice(start, form.indexOf("\n  }\n", start));
    expect(fill).toMatch(/emailRef\.current\.value = email/);
    expect(fill).not.toMatch(/requestSubmit|\.submit\(|formAction|passwordLoginAction|click\(/);
    expect(form).not.toMatch(/requestSubmit\(/);
  });

  it("choosing an account never moves focus to (or holds a handle on) the Sign in button", () => {
    // VALIDATE found: focusing Sign in inside the selection let the same Enter keypress submit.
    const start = form.indexOf("function fillDevAccount");
    const fill = form.slice(start, form.indexOf("\n  }\n", start));
    expect(fill).not.toMatch(/\.focus\(|\.click\(|submit/i);
    expect(form).not.toMatch(/submitRef|useRef<HTMLButtonElement>/);
    const submit = form.slice(form.lastIndexOf("<Button", form.indexOf('type="submit"')));
    expect(submit.slice(0, submit.indexOf(">"))).not.toMatch(/\bref=/);
  });

  it("the local-only notice can hyphenate/break long words, so it fits 320px at 200% text", () => {
    // Class order is Prettier's choice; require both utilities on the notice's description.
    const at = form.indexOf("Local development only.");
    const tag = form.slice(form.lastIndexOf("<AlertDescription", at), at);
    const classes = tag.match(/className="([^"]+)"/)?.[1]?.split(/\s+/) ?? [];
    expect(classes).toEqual(expect.arrayContaining(["hyphens-auto", "wrap-anywhere"]));
  });

  it("the Password / Forgot password row wraps instead of widening the page", () => {
    const row = form.slice(
      form.lastIndexOf("<div", form.indexOf('<Label htmlFor="password">')),
      form.indexOf('<Label htmlFor="password">'),
    );
    const classes = row.match(/className="([^"]+)"/)?.[1]?.split(/\s+/) ?? [];
    expect(classes).toEqual(expect.arrayContaining(["flex", "flex-wrap"]));
  });

  it("the account text can break anywhere, so a long email wraps at 200% text", () => {
    const item = form.slice(
      form.indexOf("<SelectItem key={a.email}"),
      form.indexOf("</SelectItem>"),
    );
    expect(item).toMatch(/className="wrap-anywhere"/);
    expect(item).toMatch(/\{a\.name\} — \{a\.email\}/);
  });

  it("the client form imports only the DevAccount TYPE from the server-only module", () => {
    expect(form).toMatch(/import type \{ DevAccount \} from "@\/lib\/auth\/dev-accounts";/);
    expect(form).not.toMatch(/import \{[^}]*\} from "@\/lib\/auth\/dev-accounts"/);
  });
});
