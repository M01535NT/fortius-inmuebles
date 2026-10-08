import { test, expect, type Page } from "@playwright/test";
import { mobilePanelData, panelRecords } from "./fixtures/mobile-panel-data";
test.beforeEach(async ({ page }) => {
  const data = mobilePanelData("2026-10-08");
  data.propiedades[0].publicada = false;
  data.leads[0].propiedadSlug = "audit-casa";
  data.leads[0].perfil = { proximoContacto: "2026-10-08" };
  data.eventos[0].propiedadSlug = "audit-casa";
  data.tareas[0].propiedadSlug = "audit-casa";
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (route.request().method() !== "GET")
      return route.fulfill({
        status: 405,
        json: { error: "Prueba sin escrituras reales" },
      });
    if (path === "/api/auth/session")
      return route.fulfill({
        json: {
          user: {
            id: "workspace-test",
            email: "prueba@example.invalid",
            role: "admin",
          },
        },
      });
    if (path === "/api/admin/mi-asesor")
      return route.fulfill({ json: { asesorId: "asesor-prueba" } });
    if (path === "/api/admin/expedientes")
      return route.fulfill({ json: { expedientes: [] } });
    if (path === "/api/admin/comercial")
      return route.fulfill({ json: { carteras: [] } });
    if (path === "/api/admin/historial")
      return route.fulfill({ json: { entries: [], hasMore: false } });
    return route.fulfill({
      json: { records: panelRecords(data, path.split("/")[4]) },
    });
  });
});
async function fits(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}
test("quick creation works repeatedly from the current module", async ({
  page,
}) => {
  for (const [path, label, field, close] of [
    ["/admin/leads", "Nuevo prospecto", "Nombre", "Cerrar captura"],
    ["/admin/tareas", "Nueva tarea", "Título", "Cerrar captura"],
  ]) {
    await page.goto(path);
    for (let i = 0; i < 2; i++) {
      await page.getByRole("button", { name: "Buscar en el panel" }).click();
      await page
        .getByRole("dialog")
        .getByRole("link", { name: label, exact: true })
        .click();
      await expect(page.getByLabel(field, { exact: true })).toBeVisible();
      if (i === 0)
        await page.getByRole("button", { name: close, exact: true }).click();
    }
  }
});
for (const width of [320, 390, 1440]) {
  test(`workspace views and draft preview fit at ${width}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of [
      "/admin",
      "/admin/propiedades",
      "/admin/leads",
      "/admin/reportes",
      "/admin/historial",
    ]) {
      await page.goto(path);
      await expect(page.locator("main h1")).toBeVisible();
      await fits(page);
    }
    await page.goto("/admin/propiedades/audit-casa/editar");
    await expect(
      page.getByRole("button", { name: "Guardar y publicar" }),
    ).toBeVisible();
    await fits(page);
    await page
      .getByLabel("Título", { exact: true })
      .fill("Casa pendiente de guardar");
    await page.getByRole("button", { name: "Guardar copia temporal" }).click();
    await page
      .getByRole("button", { name: "Vista previa", exact: true })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "Vista previa del inmueble",
    });
    await expect(
      dialog.getByText("Casa pendiente de guardar", { exact: true }),
    ).toBeVisible();
    await dialog.getByRole("button", { name: "Ver móvil" }).click();
    await fits(page);
    await page.screenshot({
      path: info.outputPath(`editor-preview-${width}.png`),
    });
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
  });
}
test("reorders navigation by drag and touch controls, persists and restores", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/admin");
  const desktop = page.getByRole("navigation", {
    name: "Módulos del panel",
    exact: true,
  });
  await desktop.getByRole("button", { name: "Organizar módulos" }).click();
  await desktop
    .getByTitle("Arrastrar Inmuebles")
    .dragTo(desktop.getByRole("link", { name: "Panel", exact: true }));
  await expect(desktop.getByRole("link").first()).toHaveText("Inmuebles");
  await page.reload();
  await expect(desktop.getByRole("link").first()).toHaveText("Inmuebles");
  await page.setViewportSize({ width: 390, height: 900 });
  await page.getByRole("button", { name: "Menú del panel" }).click();
  const mobile = page.getByRole("navigation", { name: "Módulos móviles" });
  await mobile.getByRole("button", { name: "Organizar módulos" }).click();
  await mobile
    .getByRole("button", { name: "Subir Panel", exact: true })
    .click();
  await expect(mobile.getByRole("link").first()).toHaveText("Panel");
  await fits(page);
});
test("inventory saved view, related tasks and global search navigate with context", async ({
  page,
}) => {
  await page.goto("/admin/propiedades");
  await page.getByText(/Filtros y vistas guardadas/).click();
  await page
    .getByLabel("Publicación", { exact: true })
    .selectOption("borrador");
  await page.getByLabel("Nombre de la vista").fill("Pendientes");
  await page
    .getByRole("button", { name: "Guardar vista", exact: true })
    .click();
  await page.reload();
  await page.getByText(/Filtros y vistas guardadas/).click();
  await page.getByRole("button", { name: "Pendientes", exact: true }).click();
  await expect(page.getByLabel("Publicación", { exact: true })).toHaveValue(
    "borrador",
  );
  await page.getByRole("button", { name: "Buscar en el panel" }).click();
  await page
    .getByRole("searchbox", { name: "Buscar personas, inmuebles o folios" })
    .fill("MNT-PRUEBA");
  await page.getByRole("dialog").getByRole("link").first().click();
  await expect(page).toHaveURL(/audit-casa\/editar/);
  await page.getByRole("link", { name: "Crear tarea relacionada" }).click();
  await expect(page).toHaveURL(/propiedadSlug=audit-casa/);
  await page
    .getByText("Descripción, categoría y vínculos", { exact: true })
    .click();
  await expect(
    page.getByLabel("Inmueble relacionado", { exact: true }),
  ).toHaveValue("audit-casa");
});
