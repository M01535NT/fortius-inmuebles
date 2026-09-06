import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/admin/browser",
  outputDir: ".superpowers/task2-ui/artifacts",
  workers: 1,
  reporter: "list",
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1 --port 3001",
    url: process.env.MNT_TEST_URL ?? "http://localhost:3001",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: {
    baseURL: process.env.MNT_TEST_URL ?? "http://localhost:3001",
    browserName: "chromium",
    channel: process.platform === "win32" ? "msedge" : undefined,
    headless: true,
    trace: "retain-on-failure",
  },
});
