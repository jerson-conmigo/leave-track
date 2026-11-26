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
