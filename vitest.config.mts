import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname) },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // tests/db spins up in-process Postgres (PGlite); WASM cold start is slow on CI.
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
