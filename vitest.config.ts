module.exports = {
  oxc: { jsx: { runtime: "automatic" } },
  resolve: { alias: { "@": `${__dirname}/src`, "server-only": `${__dirname}/tests/backend/server-only.ts` } },
  test: { include: ["tests/backend/**/*.test.ts", "tests/backend/**/*.test.mjs"], testTimeout: 20000, hookTimeout: 60000, fileParallelism: false },
} satisfies Parameters<typeof import("vitest/config").defineConfig>[0];
