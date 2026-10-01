import { defineConfig } from "vitest/config";
import path from "node:path";

const TEST_PROJECT = "bc1pvhl5eemwk4a9d8k225medwye8m4rzw0nhr3nsfw732xzr6zx8rmq5ckdk4";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    env: {
      PROJECT_ADDRESS: TEST_PROJECT,
    },
  },
  resolve: {
    alias: {
      "@satdust/shared/project": path.resolve(__dirname, "../shared/src/project.ts"),
      "@satdust/shared": path.resolve(__dirname, "../shared/src/index.ts"),
    },
  },
});
