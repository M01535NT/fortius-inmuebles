import { test, expect } from "@playwright/test";

for (const width of [390, 768, 1440]) {
  test(`clientes y operaciones a ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    const clients = [
      { id: "buyer", nombre: "Ana Martínez", tipo: "comprador", asesorId: "adviser" },
      { id: "seller", nombre: "Juan Ibarra", tipo: "propietario", asesorId: "adviser" },
      { id: "seller2", nombre: "Liliana Tonalá Vargas", tipo: "propietario", asesorId: "adviser" },
    ];
    const operations = clients.map((client, index) => ({
      id: `exp-${index}`, cliente_id: client.id, asesor_id: "adviser", propiedad_slug: null,
      folio: `EXP-00000${index + 1}`, operacion: "venta", unidad: "", version: 1, etapa: "captacion",
    }));
    await page.route("**/api/**", async route => {
      const request = route.request(), url = new URL(request.url());
      if (url.pathname === "/api/auth/session") return route.fulfill({ json: { user: { id: "qa", email: "qa@example.invalid", role: "admin" } } });
      if (url.pathname === "/api/admin/expedientes") {
        if (request.method() === "POST") return route.fulfill({ json: { expediente: { ...operations[0], id: "new-exp", folio: "EXP-NUEVA" } } });
        return route.fulfill({ json: { expedientes: url.searchParams.has("estado") ? [] : operations } });
      }
      if (url.pathname === "/api/admin/entrevistas") return route.fulfill({ json: { entrevistas: [] } });
      if (url.pathname.endsWith("/formatos")) return route.fulfill({ json: { documentos: [] } });
      if (url.pathname.endsWith("/actividad")) return route.fulfill({ json: { actividad: [] } });
      const data = url.pathname.endsWith("/clientes") ? clients : url.pathname.endsWith("/asesores") ? [{ id: "adviser", nombre: "Nallely De la Cruz", activo: true }] : [];
      return route.fulfill({ json: { records: data.map(item => ({ id: item.id, data: item, version: 1 })) } });
    });
    await page.goto("/admin/operaciones");
    const panel = page.getByRole("complementary", { name: "Clientes y operaciones" });
    await expect(panel.getByRole("button", { name: /Ana Martínez/ })).toBeVisible();
    await panel.getByRole("button", { name: /Juan Ibarra/ }).click();
    await expect(panel.getByRole("button", { name: /Juan Ibarra/ })).toHaveAttribute("aria-current", "true");
    await expect(panel.getByRole("button", { name: /Juan Ibarra/ })).toHaveCSS("border-left-color", "rgb(138, 22, 52)");
    await expect(panel.getByRole("button", { name: /Ana Martínez/ })).toHaveCSS("border-left-color", "rgba(0, 0, 0, 0)");
    await expect(page.getByRole("heading", { name: "EXP-000002", exact: true })).toBeVisible();
    await expect(page.getByRole("region", { name: "Entrevista inicial" }).getByRole("link")).toBeVisible();
    await page.getByRole("heading", { name: "Operaciones", exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath(`clientes-${width}.png`), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await panel.getByRole("searchbox").fill("martinez");
    await expect(panel.getByRole("button", { name: /Ana Martínez/ })).toBeVisible();
    await expect(panel.getByRole("button", { name: /Juan Ibarra/ })).toHaveCount(0);
    await panel.getByRole("searchbox").fill("EXP-000002");
    await expect(panel.getByRole("button", { name: /Juan Ibarra/ })).toBeVisible();
    await panel.getByRole("searchbox").fill("sin coincidencia");
    await expect(panel.getByRole("status")).toContainText("No hay coincidencias");
    await panel.getByRole("searchbox").fill("");
    const sellers = panel.locator("details").filter({ hasText: "Vendedores" });
    await sellers.locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(panel.getByRole("button", { name: /Juan Ibarra/ })).not.toBeVisible();
    await page.keyboard.press("Enter");
    await expect(panel.getByRole("button", { name: /Juan Ibarra/ })).toBeVisible();
    await expect(panel.getByRole("link", { name: "Nueva operación" })).toHaveAttribute("href", "/admin/operaciones/nueva");
    await panel.getByRole("button", { name: "Eliminados", exact: true }).click();
    await expect(panel).toContainText("No hay expedientes eliminados");
    await panel.getByRole("link", { name: "Nueva operación" }).click();
    await expect(page).toHaveURL(/operaciones[/]nueva$/);
    await expect(page.getByRole("heading", { name: "¿Qué necesita esta persona?" })).toBeVisible();
    expect(errors).toEqual([]);
  });
}
