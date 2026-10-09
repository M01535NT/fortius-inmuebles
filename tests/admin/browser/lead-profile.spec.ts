import { test, expect } from "@playwright/test";
import { propiedades } from "../../../src/data/propiedades";

for (const width of [320, 390, 768, 1440]) {
  test(`lead qualification survives reload and conflict at ${width}px`, async ({ page }, testInfo) => {
    const records = new Map<string, { id: string; data: Record<string, unknown>; version: number; createdAt: string; updatedAt: string }>();
    let conflict = false;
    await page.setViewportSize({ width, height: 844 });
    await page.route("**/api/**", async route => {
      const req = route.request(); const path = new URL(req.url()).pathname;
      if (path === "/api/auth/session") return route.fulfill({ json: { user: { id: "test", email: "test@example.invalid", role: "admin" } } });
      if (req.method() === "PUT") {
        const body = req.postDataJSON();
        if (conflict || (body.version !== null && !records.has(body.data.id))) return route.fulfill({ status: 409, json: { error: "El registro cambió; conserva tu borrador y revisa el conflicto" } });
        const record = { id: body.data.id, data: body.data, version: (body.version ?? 0) + 1, createdAt: "2026-09-23", updatedAt: "2026-09-23" };
        records.set(record.id, record); return route.fulfill({ json: { record } });
      }
      if (req.method() !== "GET") return route.fulfill({ status: 405, json: {} });
      const data = path.endsWith("/leads") ? [...records.values()] : path.endsWith("/propiedades") ? propiedades.map(p => ({ id: p.slug, data: p, version: 1 })) : [];
      return route.fulfill({ json: { records: data } });
    });
    await page.goto("/admin/leads");
    await page.getByRole("button", { name: "Nuevo prospecto", exact: true }).click();
    await page.getByLabel("Nombre", { exact: true }).fill("Lead de prueba móvil");
    await page.getByLabel("Teléfono", { exact: true }).fill("6641234567");
    await page.getByLabel("Correo electrónico", { exact: true }).fill("test@example.invalid");
    await page.getByText("Qué busca y características", { exact: true }).click();
    await page.getByLabel("Operación", { exact: true }).selectOption("rentar");
    await page.getByLabel("Uso del inmueble").selectOption("industrial");
    await page.getByLabel("Tipo de inmueble").selectOption("terreno");
    await page.getByLabel("Inmueble de interés").selectOption(propiedades[0].slug);
    await page.getByLabel("Zonas de interés").fill("Otay y alrededores");
    await page.getByLabel("Superficie mínima (m²)", { exact: true }).fill("500");
    await page.getByLabel("Requisitos adicionales").fill("Acceso para camiones y servicios disponibles.");
    await page.getByText("Presupuesto de renta", { exact: true }).click();
    await expect(page.getByText(/Presupuesto de renta mensual/)).toBeVisible();
    await page.getByLabel("Renta mensual máxima").fill("3000");
    await page.getByLabel("Moneda", { exact: true }).selectOption("USD");
    await page.getByLabel("Origen de ingresos").selectOption("estados-unidos");
    await page.getByText("Seguimiento", { exact: true }).click();
    await page.getByLabel("Próximo contacto").fill("2026-10-01");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`lead-form-${width}.png`), fullPage: true });
    await page.getByRole("button", { name: "Capturar prospecto", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/leads\/[^/]+$/);
    await expect(page.getByRole("heading", { name: "Lead de prueba móvil", exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByText("Estados Unidos", { exact: true })).toBeVisible();
    await expect(page.getByText("3,000 USD /mes", { exact: true })).toBeVisible();
    await expect(page.getByText("test@example.invalid", { exact: true }).last()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole("button", { name: "Editar ficha" }).click();
    await page.getByLabel("Nombre", { exact: true }).fill("Borrador conservado");
    conflict = true;
    await page.getByRole("button", { name: "Guardar ficha", exact: true }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Conflicto:" })).toContainText("el registro cambió");
    await expect(page.getByLabel("Nombre", { exact: true })).toHaveValue("Borrador conservado");
    conflict = false;
    await page.getByRole("button", { name: "Guardar ficha", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Borrador conservado", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Editar ficha" }).click();
    await page.getByLabel("Nombre", { exact: true }).fill("No perder aunque se elimine");
    records.clear();
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await page.getByRole("button", { name: "Guardar ficha", exact: true }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Conflicto:" })).toContainText("el registro cambió");
    await expect(page.getByLabel("Nombre", { exact: true })).toHaveValue("No perder aunque se elimine");
  });
}

test("seller capture shows property details and sale price at mobile width", async ({ page }, testInfo) => {
  let saved: Record<string, unknown> = {};
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/api/**", async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === "/api/auth/session") return route.fulfill({ json: { user: { id: "test", email: "test@example.invalid", role: "admin" } } });
    if (request.method() === "PUT") {
      saved = request.postDataJSON().data;
      return route.fulfill({ json: { record: { id: saved.id, data: saved, version: 1, createdAt: "2026-09-23", updatedAt: "2026-09-23" } } });
    }
    return route.fulfill({ json: { records: path.endsWith("/leads") && saved.id ? [{ id: saved.id, data: saved, version: 1 }] : [] } });
  });
  await page.goto("/admin/leads");
  await page.getByRole("button", { name: "Nuevo prospecto", exact: true }).click();
  await page.getByLabel("Nombre", { exact: true }).fill("Propietaria de prueba");
  await page.getByLabel("Teléfono", { exact: true }).fill("6641234567");
  await page.getByText("Qué busca y características", { exact: true }).click();
  await page.getByLabel("Operación").selectOption("vender");
  await expect(page.getByLabel("Superficie construida (m²)")).toBeVisible();
  await expect(page.getByLabel("Requisitos adicionales")).toHaveCount(0);
  await page.getByLabel("Ubicación del inmueble").fill("Hipódromo");
  await page.getByLabel("Superficie construida (m²)").fill("180");
  await page.getByText("Precio esperado", { exact: true }).click();
  await page.getByLabel("Precio de venta esperado").fill("3500000");
  await page.getByLabel("Moneda", { exact: true }).selectOption("MXN");
  await page.screenshot({ path: testInfo.outputPath("lead-sale-mobile.png"), fullPage: true });
  await page.getByRole("button", { name: "Capturar prospecto", exact: true }).click();
  await expect(page.getByText("3,500,000 MXN", { exact: true })).toBeVisible();
  expect((saved.perfil as Record<string, unknown>).precioObjetivo).toBe(3500000);
});
