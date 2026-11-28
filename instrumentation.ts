/**
 * Runs once per server start, before any request is served (Next.js `register`).
 * On the Node.js runtime it validates the environment and exits if a deployed
 * environment is misconfigured (TASK-019, lib/env-startup.ts).
 *
 * lib/env also validates at module load, so `next build` in a deployed environment
 * with missing configuration fails at build time too.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertEnvOrExit } = await import("./lib/env-startup");
    await assertEnvOrExit();
  }
}
