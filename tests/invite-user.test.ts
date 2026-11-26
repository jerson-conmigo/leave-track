import { spawnSync } from "node:child_process";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
// @ts-expect-error — plain ESM script without type declarations
import { inviteUser } from "../scripts/invite-user.mjs";

/**
 * TASK-024 — the operator invite: the ONLY place an identity is linked to a user.
 * It refuses before inviting when the user is missing or already linked, and links only
 * while the row is still unlinked (a concurrent invite can't overwrite a link).
 */
const USER = { id: "00000000-0000-4000-8000-000000000101", auth_user_id: null };
const AUTH_ID = "30000000-0000-4000-8000-000000000101";

const ports = (over: Partial<Record<"findUser" | "invite" | "link", unknown>> = {}) => ({
  findUser: vi.fn(async () => USER),
  invite: vi.fn(async () => AUTH_ID),
  link: vi.fn(async () => true),
  ...over,
});

describe("inviteUser", () => {
  it("finds the user, invites, then links the new identity", async () => {
    const p = ports();
    expect(await inviteUser("  Ana@Example.com ", p)).toEqual({
      ok: true,
      userId: USER.id,
      authUserId: AUTH_ID,
    });
    expect(p.findUser).toHaveBeenCalledWith("Ana@Example.com");
    expect(p.link).toHaveBeenCalledWith(USER.id, AUTH_ID);
  });

  it.each([
    ["an invalid email", "not-an-email", ports(), "invalid-email"],
    ["no such user", "x@example.com", ports({ findUser: vi.fn(async () => null) }), "no-such-user"],
    [
      "an already-linked user",
      "x@example.com",
      ports({ findUser: vi.fn(async () => ({ ...USER, auth_user_id: AUTH_ID })) }),
      "already-linked",
    ],
  ])("%s → refused before any invite is sent", async (_l, email, p, reason) => {
    expect(await inviteUser(email, p)).toEqual({ ok: false, reason });
    expect(p.invite).not.toHaveBeenCalled();
  });

  it("a link lost to a concurrent invite is reported, never overwritten", async () => {
    const p = ports({ link: vi.fn(async () => false) });
    expect(await inviteUser("x@example.com", p)).toEqual({
      ok: false,
      reason: "linked-concurrently",
    });
  });

  it("a provider error propagates (nothing is linked)", async () => {
    const p = ports({
      invite: vi.fn(async () => {
        throw new Error("invite refused (email_exists)");
      }),
    });
    await expect(inviteUser("x@example.com", p)).rejects.toThrow(/email_exists/);
    expect(p.link).not.toHaveBeenCalled();
  });
});

describe("TASK-054 — invite targets the LOCAL stack unless --remote is explicit", () => {
  const root = path.resolve(import.meta.dirname, "..");
  const invite = (args: string[], env: Record<string, string>) =>
    spawnSync(process.execPath, [path.join(root, "scripts/invite-user.mjs"), ...args], {
      encoding: "utf8",
      timeout: 30_000,
      env: {
        PATH: process.env.PATH ?? "",
        SUPABASE_SERVICE_ROLE_KEY: "service-role-VALUE-must-not-print",
        ...env,
      } as unknown as NodeJS.ProcessEnv,
    });
  const HOSTED = {
    DATABASE_URL: "postgresql://u:s3cret@db.hosted-project.invalid:5432/postgres",
    NEXT_PUBLIC_SUPABASE_URL: "https://hosted-project.invalid",
  };

  it("a hosted target without --remote → refused before anything is sent, host named", () => {
    const res = invite(["ana@example.com"], HOSTED);
    expect(res.status).toBe(1);
    expect(res.stderr).toMatch(/database URL \(db\.hosted-project\.invalid\)/);
    expect(res.stderr).toMatch(/Nothing was sent\. .*add --remote/);
    expect(res.stderr + res.stdout).not.toMatch(/s3cret|service-role-VALUE/);
  });

  it("a mix (local database, hosted Supabase) is still refused", () => {
    const res = invite(["ana@example.com"], {
      DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:1/postgres",
      NEXT_PUBLIC_SUPABASE_URL: HOSTED.NEXT_PUBLIC_SUPABASE_URL,
    });
    expect(res.status).toBe(1);
    expect(res.stderr).toMatch(
      /NEXT_PUBLIC_SUPABASE_URL \(hosted-project\.invalid\) is not the local stack/,
    );
  });

  it("--remote is the explicit opt-in: the hosted host is announced first", () => {
    const res = invite(["ana@example.com", "--remote"], HOSTED);
    expect(res.stdout).toMatch(/--remote: targeting db\.hosted-project\.invalid/);
    expect(res.stderr).not.toMatch(/Nothing was sent/);
  });

  it("local targets need no flag", () => {
    const res = invite(["ana@example.com"], {
      DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:1/postgres",
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:1",
    });
    expect(res.stderr).not.toMatch(/not the local stack/);
  });

  it("unknown extra arguments → usage", () => {
    expect(invite(["a@b.co", "--force"], HOSTED).stderr).toMatch(/usage: .*\[--remote\]/);
  });
});
