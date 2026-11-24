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
  },
});
