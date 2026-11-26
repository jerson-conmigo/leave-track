import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { resetMockDb } from "@/lib/data/mock/store";

/**
 * POST /api/test/reset — TEST-ONLY hook that restores the in-memory mock data
 * to the seed so every e2e test starts from the same state.
 *
 * Closed by default: answers 404 (as if it didn't exist) unless ALL hold:
 *   - E2E_RESET_TOKEN is set (only playwright.config.ts sets it — NEVER set it in a
 *     deployed environment),
 *   - the `x-e2e-reset-token` header matches it (constant-time compare),
 *   - DATABASE_URL is unset — it can only reset the in-memory store, never Postgres.
 * Env is read at request time (not via lib/env) so a misconfigured deploy can't
 * enable it through validation defaults.
 */
const notFound = () =>
  NextResponse.json(
    { success: false, error: { code: "NOT_FOUND", message: "Not found." } },
    { status: 404 },
  );

function tokenMatches(expected: string, given: string | null): boolean {
  if (!given) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const expected = process.env.E2E_RESET_TOKEN;
  if (!expected || process.env.DATABASE_URL) return notFound();
  if (!tokenMatches(expected, req.headers.get("x-e2e-reset-token"))) return notFound();

  resetMockDb();
  revalidatePath("/", "layout");
  return NextResponse.json({ success: true, data: { reset: true } }, { status: 200 });
}
