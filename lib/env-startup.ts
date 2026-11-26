/**
 * Node-only startup check, imported by instrumentation.ts only on the Node.js runtime
 * (kept out of instrumentation.ts so the Edge bundle never sees process.exit/stderr).
 *
 * Importing lib/env validates the environment. A deployed environment missing required
 * configuration (TASK-019) must not start at all: Next.js would otherwise keep the
 * process alive and answer every request with a 500, so we exit with a non-zero code
 * and the variable NAMES (never values) on stderr.
 */
export async function assertEnvOrExit(): Promise<void> {
  try {
    await import("@/lib/env");
  } catch (error) {
    // The logger can't be used here: it depends on the env that just failed to load.
    process.stderr.write(
      `[leave-track] refusing to start: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exit(1);
  }
}
