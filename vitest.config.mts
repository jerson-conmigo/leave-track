import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname),
      "server-only": path.resolve(import.meta.dirname, "tests/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    env: { LOG_LEVEL: "silent" },
    // tests/db spins up in-process Postgres (PGlite); WASM cold start is slow on CI.
    testTimeout: 30_000,
    hookTimeout: 60_000,
    // TASK-021: coverage for `npm run test:coverage` (CI). Scope = code unit tests are
    // meant to cover; UI (components, pages, layouts) is covered by the e2e suite.
    coverage: {
      provider: "v8",
      include: [
        "lib/**/*.ts",
        "app/api/**/*.ts",
        "app/**/actions.ts",
        "proxy.ts",
        "instrumentation.ts",
      ],
      exclude: ["lib/data/mock/fixtures.ts", "**/*.d.ts", "tests/**"],
      reporter: ["text-summary", "json-summary", "html"],
      reportsDirectory: "coverage",
      // Measured baseline 2026-11-26: statements 86.28, branches 80.24, functions 91.77,
      // lines 87.2. Thresholds = baseline rounded down − 2, so CI fails if coverage drops
      // by more than ~2 points. Raise them as coverage improves; never lower silently.
      thresholds: { statements: 84, branches: 78, functions: 89, lines: 85 },
    },
  },
});
