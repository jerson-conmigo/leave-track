import { z } from "zod";
import { AppError } from "@/lib/api/errors";
import type { Session } from "@/lib/auth/session";
import type { SqlClient } from "@/lib/db/sql";
import { mockDb } from "@/lib/data/mock/store";

/**
 * TASK-030 — mark the session user's OWN notifications as read (AC3). The recipient is always the
 * session user and the store scopes the UPDATE to it in SQL, so an id belonging to someone else is
 * silently not touched. No ids = all of the user's unread notifications.
 */
export const MarkReadSchema = z.object({
  ids: z
    .array(z.uuid({ error: "Invalid notification id." }))
    .min(1)
    .max(200)
    .optional(),
});

export interface NotificationReadStore {
  /** Returns how many of the recipient's unread notifications were marked read. */
  markRead(recipientId: string, ids: readonly string[] | undefined, now: Date): Promise<number>;
}

export function createPostgresNotificationReadStore(sql: SqlClient): NotificationReadStore {
  return {
    async markRead(recipientId, ids, now) {
      const rows = await sql.query<{ id: string }>(
        `update notifications set read_at = $3
          where recipient_id = $1 and read_at is null
            and ($2::uuid[] is null or id = any($2::uuid[]))
          returning id`,
        [recipientId, ids ?? null, now.toISOString()],
      );
      return rows.length;
    },
  };
}

export const memoryNotificationReadStore: NotificationReadStore = {
  async markRead(recipientId, ids, now) {
    const wanted = ids ? new Set(ids) : null;
    let updated = 0;
    for (const n of mockDb.notifications) {
      if (n.recipientId !== recipientId || n.readAt !== null) continue;
      if (wanted && !wanted.has(n.id)) continue;
      n.readAt = now.toISOString();
      updated++;
    }
    return updated;
  },
};

export type MarkReadDeps = { store: NotificationReadStore; now?: Date };

export async function markNotificationsRead(
  session: Pick<Session, "userId">,
  rawInput: unknown,
  { store, now = new Date() }: MarkReadDeps,
): Promise<{ updated: number }> {
  const parsed = MarkReadSchema.safeParse(rawInput ?? {});
  if (!parsed.success) {
    throw new AppError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid request.");
  }
  const updated = await store.markRead(session.userId, parsed.data.ids, now);
  return { updated };
}
