import { defineConfig } from "@playwright/test";
import publicConfig from "./playwright.public.config";
const baseURL = process.env.FORTIUS_INMUEBLES_TEST_URL ?? "http://localhost:3001";
// La guía de cada pantalla se abre sola en la primera visita; las pruebas empiezan con todas vistas.
const tourSeen = JSON.stringify(["hoy", "operaciones", "operacion", "nueva", "contactos", "inmuebles", "agenda", "herramientas"]);
export default defineConfig({
  testDir: "./tests/admin/browser",
  // Las páginas públicas corren en `test:public:browser` con su backend de ejemplo; aquí fallarían contra otra base.
  testIgnore: publicConfig.testMatch,
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
    storageState: { cookies: [], origins: [{ origin: new URL(baseURL).origin, localStorage: [{ name: "fortius.guia.vista.v1", value: tourSeen }] }] },
    browserName: "chromium",
    channel: process.platform === "win32" ? "msedge" : undefined,
    headless: true,
    trace: "retain-on-failure",
  },
});
