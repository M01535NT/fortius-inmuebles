module.exports = {
  resolve: { alias: { "@": `${__dirname}/src` } },
  oxc: { jsx: { runtime: "automatic" } },
  test: {
    include: ["tests/admin/**/*.test.{ts,tsx}"],
    environment: "jsdom",
    fileParallelism: false,
  },
} satisfies Parameters<typeof import("vitest/config").defineConfig>[0];
