import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Integration tests, run on purpose and never as part of `npm test`.
 *
 * These talk to the real Supabase project with the service-role key: they
 * create a throwaway account, exercise server code against it and delete it
 * again. That is the only way to check that a webhook actually changes a
 * subscription and that the change actually changes what the account may do —
 * a mock of the database would only prove the mock agrees with itself.
 *
 * Node rather than jsdom: this loads server modules, and jsdom's fetch and
 * globals get in the way of the Supabase client.
 *
 *   npx vitest run --config vitest.integration.config.ts
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.itest.ts"],
    globals: false,
    // One at a time: they share the database, and a parallel run would have
    // them deleting each other's fixtures.
    fileParallelism: false,
    testTimeout: 60_000,
  },
});
