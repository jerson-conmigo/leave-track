import type { User } from "@/lib/data/types";

/**
 * Approval routing (TASK-026, BR-10, ADR-LeaveTrack-E005) for the IN-MEMORY store and mock
 * repository only. Postgres enforces the same rule in SQL (supabase/migrations/
 * 20261202000000_approval_routing.sql: can_decide / has_approver / approver_label) — the app
 * never filters database results with these functions. tests/leave-requests/approval-routing
 * runs one case table against both, so they cannot drift apart.
 */
type Person = Pick<User, "id" | "name" | "role" | "managerId">;

/** May `actorId` decide requests made by `requesterId`? Never their own. */
export function canDecide(users: readonly Person[], actorId: string, requesterId: string): boolean {
  if (actorId === requesterId) return false;
  const requester = users.find((u) => u.id === requesterId);
  const actor = users.find((u) => u.id === actorId);
  if (!requester || !actor) return false;
  return (
    requester.managerId === actor.id ||
    (requester.role === "hr_admin" && requester.managerId === null && actor.role === "hr_admin")
  );
}

/** Is there anyone who may decide `requesterId`'s requests? (409 at submit otherwise.) */
export function hasApprover(users: readonly Person[], requesterId: string): boolean {
  return users.some((a) => canDecide(users, a.id, requesterId));
}

/** "Awaiting …": the manager's name, "HR" for an HR Admin decided by peers, or null. */
export function approverLabel(users: readonly Person[], requesterId: string): string | null {
  const requester = users.find((u) => u.id === requesterId);
  if (!requester) return null;
  const manager = requester.managerId ? users.find((u) => u.id === requester.managerId) : undefined;
  if (manager && canDecide(users, manager.id, requester.id)) return manager.name;
  return hasApprover(users, requester.id) ? "HR" : null;
}

/** The submit-side view of the approver (who to notify). */
export type Approver =
  { kind: "manager"; id: string; name: string; email: string } | { kind: "hr" } | null;
