import { test, expect } from "@playwright/test";
import { mobilePanelData, panelRecords } from "./fixtures/mobile-panel-data";

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-12T19:00:00Z") });
  const data = mobilePanelData("2026-10-12");
  data.propiedades[0].codigo = "FORTIUS-PRUEBA-001";
  data.propiedades[0].titulo = "Casa del Valle · dato sintético";
  data.leads[0].nombre = "Contacto de prueba";
  await page.route("**/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    if (route.request().method() !== "GET") return route.fulfill({ status: 405, json: { error: "Sin escrituras en esta prueba" } });
    if (path === "/api/auth/session") return route.fulfill({ json: { user: { id: "design-qa", email: "qa@example.invalid", role: "admin" } } });
    if (path === "/api/admin/expedientes") return route.fulfill({ json: { expedientes: [
      { id: "qa-dossier", folio: "FORTIUS-QA", cliente_id: "cliente-prueba", etapa: "documentacion", fecha_objetivo: "2026-10-15", version: 1 },
    ] } });
    if (path === "/api/admin/mi-asesor") return route.fulfill({ json: { asesorId: "asesor-prueba" } });
    return route.fulfill({ json: { records: panelRecords(data, path.split("/")[4]) } });
  });
});

for (const width of [375, 768, 1440]) {
  test(`approved module design fits at ${width}`, async ({ page }, info) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height: 1000 });
    for (const [path, title] of [
      ["", "¿Qué vas a hacer hoy?"], ["leads", "CRM · Relaciones comerciales"], ["propiedades", "Cartera de inmuebles"],
      ["expedientes", "Expedientes"], ["documentos", "Documentos y expediente"], ["finanzas", "Finanzas y rentabilidad"],
      ["territorio", "Análisis territorial"], ["portal-clientes", "Portal de clientes"],
    ]) {
      await page.goto(`/admin/${path}`);
      await expect(page.getByRole("main").getByRole("heading", { name: title, exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (path === "") await expect(page.getByRole("main").getByText("12/10/2026", { exact: true })).toBeVisible();
      if (path === "leads") {
        await page.getByRole("button", { name: "Por etapas", exact: true }).click();
        await expect(page.getByRole("button", { name: "Ver resumen de Contacto de prueba", exact: true })).toBeVisible();
      }
      if (path === "propiedades") {
        await expect(page.getByRole("list", { name: "Inmuebles", exact: true })).toBeVisible();
        await expect(page.getByRole("button", { name: "Tarjetas", exact: true })).toHaveAttribute("aria-pressed", "true");
        await page.getByRole("button", { name: "Lista", exact: true }).click();
        await expect(page.getByRole("button", { name: "Lista", exact: true })).toHaveAttribute("aria-pressed", "true");
        await page.getByRole("button", { name: "Tarjetas", exact: true }).click();
      }
      if (path === "finanzas" || path === "portal-clientes") await expect(page.getByText("Pendiente de implementación", { exact: true })).toBeVisible();
      if (path === "territorio") {
        await expect(page.getByText("Mapas pendientes", { exact: true })).toBeVisible();
        await expect(page.getByRole("main").getByRole("link", { name: "Casa del Valle · dato sintético" })).toBeVisible();
      }
      await page.screenshot({ path: info.outputPath(`${path || "resumen"}-${width}.png`), fullPage: true });
    }
  });
}

test("pending client portal exposes no client data or invitation action", async ({ page }) => {
  await page.goto("/admin/portal-clientes");
  const main = page.getByRole("main");
  await expect(main.getByText("El acceso de clientes todavía no está habilitado.", { exact: false })).toBeVisible();
  await expect(main.getByRole("button")).toHaveCount(0);
  await expect(main.getByText("Contacto de prueba", { exact: true })).toHaveCount(0);
});

test("cycle failure is explicit and does not invent zero counts", async ({ page }) => {
  await page.route("**/api/admin/expedientes", route => route.fulfill({ status: 503, json: { error: "Expedientes no disponibles" } }));
  await page.goto("/admin");
  const cycle = page.getByRole("region", { name: "Proceso de venta", exact: true });
  await expect(cycle.getByRole("alert")).toHaveText("No se pudieron consultar las etapas. Recarga el módulo para reintentar.");
  await expect(cycle.getByRole("list")).toHaveCount(0);
});

test("new administrator modules preserve adviser access limits", async ({ page }) => {
  await page.route("**/api/auth/session", route => route.fulfill({ json: { user: { id: "adviser-qa", email: "adviser@example.invalid", role: "asesor" } } }));
  for (const path of ["finanzas", "portal-clientes"]) {
    await page.goto(`/admin/${path}`);
    await expect(page.getByRole("main").getByRole("alert")).toHaveText("Este módulo requiere acceso de administrador.");
    await expect(page.getByRole("navigation", { name: "Módulos del panel", exact: true }).getByRole("link", { name: "Finanzas", exact: true })).toHaveCount(0);
  }
});
