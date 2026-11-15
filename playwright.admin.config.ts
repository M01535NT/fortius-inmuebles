import { defineConfig } from "@playwright/test";
import { PUBLIC_SPECS } from "./tests/admin/browser/suites";
// Puerto propio: en el 3001 suele correr `next dev` con el `.env.local` real, y reutilizarlo
// probaría contra la base real. CI fija la dirección con FORTIUS_INMUEBLES_TEST_URL.
const baseURL = process.env.FORTIUS_INMUEBLES_TEST_URL ?? "http://127.0.0.1:3102";
// La guía de cada pantalla se abre sola en la primera visita; las pruebas empiezan con todas vistas.
const tourSeen = JSON.stringify(["hoy", "operaciones", "operacion", "nueva", "contactos", "inmuebles", "agenda", "herramientas"]);
export default defineConfig({
  testDir: "./tests/admin/browser",
  // Las del sitio público tienen su propio backend de ejemplo: `npm run test:public:browser`.
  testIgnore: PUBLIC_SPECS,
  outputDir: ".superpowers/task2-ui/artifacts",
  workers: 1,
  reporter: "list",
  webServer: {
    command: `npm run start -- --hostname 127.0.0.1 --port ${new URL(baseURL).port || "3001"}`,
    url: new URL("/admin", baseURL).href,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Como en CI: el backend público no está disponible y el contacto directo está apagado, aunque
    // exista `.env.local` (las variables del proceso ganan a ese archivo). El panel usa API simulada.
    env: {
      FORTIUS_INMUEBLES_SITE_URL: process.env.FORTIUS_INMUEBLES_SITE_URL ?? new URL(baseURL).origin,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:3999",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "test-anon-key",
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
      FORTIUS_INMUEBLES_PUBLIC_LEADS_ENABLED: process.env.FORTIUS_INMUEBLES_PUBLIC_LEADS_ENABLED ?? "false",
    },
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
