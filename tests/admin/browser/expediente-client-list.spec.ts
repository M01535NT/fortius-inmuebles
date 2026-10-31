import { test, expect } from "@playwright/test";

for (const width of [390, 768, 1440]) {
  test(`tablero de operaciones a ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    const clients = [
      { id: "buyer", nombre: "Ana Martínez", tipo: "comprador", asesorId: "adviser" },
      { id: "seller", nombre: "Juan Ibarra", tipo: "propietario", asesorId: "adviser" },
      { id: "seller2", nombre: "Liliana Tonalá Vargas", tipo: "propietario", asesorId: "adviser" },
    ];
    const ids = ["51000000-0000-4000-8000-000000000001", "51000000-0000-4000-8000-000000000002", "51000000-0000-4000-8000-000000000003"];
    const operations = clients.map((client, index) => ({
      id: ids[index], cliente_id: client.id, asesor_id: "adviser", propiedad_slug: null,
      folio: `EXP-00000${index + 1}`, operacion: "venta", unidad: "", version: 1, etapa: index === 0 ? "documentacion" : "captacion",
      flujo: { version: 1, ruta: index === 0 ? "compra" : "captacion", estado: "activa", motivo: "", requisitos: {} },
    }));
    await page.route("**/api/**", async route => {
      const request = route.request(), url = new URL(request.url());
      if (request.method() !== "GET") return route.fulfill({ status: 405, json: { error: "Prueba sin escrituras" } });
      if (url.pathname === "/api/auth/session") return route.fulfill({ json: { user: { id: "qa", email: "qa@example.invalid", role: "admin" } } });
      if (url.pathname === "/api/admin/mi-asesor") return route.fulfill({ json: { asesorId: "adviser" } });
      if (url.pathname === "/api/admin/expedientes") return route.fulfill({ json: { expedientes: url.searchParams.has("estado") ? [] : operations, nextOffset: null } });
      if (url.pathname === "/api/admin/entrevistas") return route.fulfill({ json: { entrevistas: [] } });
      if (url.pathname.endsWith("/formatos")) return route.fulfill({ json: { documentos: [] } });
      if (url.pathname.endsWith("/actividad")) return route.fulfill({ json: { actividad: [] } });
      if (url.pathname === "/api/admin/apps/runs") return route.fulfill({ json: { runs: [], nextOffset: null } });
      const data = url.pathname.endsWith("/clientes") ? clients : url.pathname.endsWith("/asesores") ? [{ id: "adviser", nombre: "Nallely De la Cruz", activo: true }] : [];
      return route.fulfill({ json: { records: data.map(item => ({ id: item.id, data: item, version: 1 })) } });
    });
    await page.goto("/admin/operaciones");
    await expect(page.getByRole("heading", { name: "Operaciones", exact: true })).toBeVisible();
    // Lista del boceto C: «Esperan algo de ti» y «Al día», con filtro por etapa (sin fases desde el 27/10/2026).
    const waiting = page.getByRole("region", { name: /Esperan algo de ti/ });
    await expect(waiting.getByRole("link", { name: /Juan Ibarra\. Etapa 1 de 10, Prospecto\. Sin próxima tarea/ })).toBeVisible();
    await expect(waiting.getByRole("link", { name: /Ana Martínez\. Etapa 2 de 7, Opciones/ })).toBeVisible();
    await page.getByRole("group", { name: "Etapa" }).getByRole("button", { name: /Opciones/ }).click();
    await expect(page).toHaveURL(/etapa=Opciones/);
    await expect(waiting.getByRole("link", { name: /Juan Ibarra/ })).toHaveCount(0);
    await expect(waiting.getByRole("link", { name: /Ana Martínez/ })).toBeVisible();
    await page.getByRole("group", { name: "Etapa" }).getByRole("button", { name: /^Todas/ }).click();
    await page.screenshot({ path: testInfo.outputPath(`tablero-${width}.png`), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const search = page.getByRole("textbox", { name: "Buscar operación" });
    await search.fill("tonala");
    await expect(waiting.getByRole("link", { name: /Liliana Tonalá Vargas/ })).toBeVisible();
    await expect(waiting.getByRole("link", { name: /Juan Ibarra/ })).toHaveCount(0);
    await search.fill("EXP-000002");
    await waiting.getByRole("link", { name: /Juan Ibarra/ }).click();
    await expect(page).toHaveURL(new RegExp(`/admin/operaciones/${ids[1]}$`));
    await expect(page.getByRole("heading", { level: 1, name: "Juan Ibarra" })).toBeVisible();
    await expect(page.getByText(/^Etapa 1 de 10/).filter({ visible: true }).first()).toBeVisible();
    await expect(page.getByRole("region", { name: "Siguiente acción" }).getByRole("heading", { level: 2, name: "Hacer la entrevista inicial" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`operacion-${width}.png`), fullPage: true });
    await page.getByRole("link", { name: "Operaciones", exact: true }).first().click();
    await page.getByRole("link", { name: "Ver operaciones eliminadas" }).click();
    await expect(page.getByText("No hay operaciones eliminadas")).toBeVisible();
    await page.goto("/admin/operaciones/nueva");
    await expect(page.getByRole("heading", { name: "¿Qué quiere hacer el cliente?" })).toBeVisible();
    expect(errors).toEqual([]);
  });
}
