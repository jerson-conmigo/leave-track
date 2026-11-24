import type { ActionResult } from "@/lib/data/types";

/**
 * Client-safe mock mutation handlers used as DEFAULT props by interactive
 * components. They persist nothing. Day 1 passes real server actions instead
 * (TASK-011 submit, TASK-014 decision) — component code does not change.
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function mockSubmit(): Promise<ActionResult> {
  await delay(600);
  return { success: true };
}
