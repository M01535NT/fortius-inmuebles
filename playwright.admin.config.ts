import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/admin/browser",
  outputDir: ".superpowers/task2-ui/artifacts",
  workers: 1,
  reporter: "list",
  use: {
    baseURL: process.env.COTA_TEST_URL ?? "http://localhost:3000",
    channel: "msedge",
    headless: true,
    trace: "retain-on-failure",
  },
});
