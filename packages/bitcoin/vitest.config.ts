import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@satdust/shared": path.resolve(__dirname, "../shared/src/index.ts"),
    },
  },
});
