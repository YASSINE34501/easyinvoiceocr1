import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// A standalone config: the app's Vite config loads the TanStack Start and
// Nitro plugins, which a unit-test run neither needs nor can use.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // jsdom supplies Blob, canvas stubs and the DOM globals the document
    // writers touch.
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    globals: false,
  },
});
