import { test, expect } from "@playwright/test";

for (const width of [390, 1440]) test(`commercial report fits at ${width}px`, async ({ page }, testInfo) => {
  await page.setViewportSize({ width, height: 850 });
  await page.route("**/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/auth/session") return route.fulfill({ json: { user: { id: "qa", email: "qa@example.test", role: "admin" } } });
    if (path === "/api/admin/expedientes") return route.fulfill({ json: { expedientes: [{ id: "e1", etapa: "negociacion", asesor_id: "a1" }] } });
    const key = path.split("/").pop() ?? "";
    const records: Record<string, unknown[]> = {
      asesores: [{ id: "a1", nombre: "Asesor de prueba", cargo: "", iniciales: "AP", activo: true }],
      leads: [{ id: "l1", nombre: "Lead de prueba", telefono: "6641234567", origen: "manual", estado: "activo", asesorId: "a1", creadoEl: "2026-10-01", notas: [] }],
    };
    return route.fulfill({ json: { records: (records[key] ?? []).map(data => ({ id: (data as {id:string}).id, data, version: 1, createdAt: "2026-10-01", updatedAt: "2026-10-01" })) } });
  });
  await page.goto("/admin/reportes");
  await expect(page.getByRole("heading", { name: "Reportes comerciales" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cartera por asesor" })).toBeVisible();
  await expect(page.getByText("Negociación")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath(`reportes-${width}.png`), fullPage: true });
});
