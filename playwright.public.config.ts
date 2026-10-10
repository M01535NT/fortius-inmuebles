import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/admin/browser",
  testMatch: ["home-commercial.spec.ts", "pwa-install.spec.ts", "fortius-editorial.spec.ts", "home-experience.spec.ts", "editorial-home.spec.ts", "public-motion-experience.spec.ts", "public-navigation.spec.ts", "blog-editorial.spec.ts", "property-pdf.spec.ts", "financial-tools.spec.ts"],
  outputDir: "tmp/public-browser",
  workers: 1,
  reporter: "list",
  webServer: [
    { command: "node tests/admin/browser/fixtures/public-backend.mjs", url: "http://127.0.0.1:3101/health", reuseExistingServer: false },
    {
      command: "node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3100",
      url: "http://127.0.0.1:3100/admin", timeout: 120000, reuseExistingServer: false,
      env: { FORTIUS_INMUEBLES_SITE_URL: "http://127.0.0.1:3100", NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:3101", NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-test", SUPABASE_SERVICE_ROLE_KEY: "public-test", FORTIUS_INMUEBLES_PUBLIC_LEADS_ENABLED: "false" },
    },
  ],
  use: { baseURL: "http://127.0.0.1:3100", browserName: "chromium", channel: process.platform === "win32" ? "msedge" : undefined, headless: true, trace: "retain-on-failure" },
});
