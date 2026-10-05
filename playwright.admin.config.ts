import { defineConfig } from "@playwright/test";
const baseURL = process.env.FORTIUS_INMUEBLES_TEST_URL ?? "http://localhost:3001";
export default defineConfig({
  testDir: "./tests/admin/browser",
  outputDir: ".superpowers/task2-ui/artifacts",
  workers: 1,
  reporter: "list",
  webServer: {
    command: `npm run start -- --hostname 127.0.0.1 --port ${new URL(baseURL).port || "3001"}`,
    url: new URL("/admin", baseURL).href,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: {
    baseURL,
    browserName: "chromium",
    channel: process.platform === "win32" ? "msedge" : undefined,
    headless: true,
    trace: "retain-on-failure",
  },
});
