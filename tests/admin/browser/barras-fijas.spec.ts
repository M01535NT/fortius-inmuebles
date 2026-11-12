import { test, expect, type Page } from "@playwright/test";

/*
  SIM-13 (C36, C39, 02/11/2026): ninguna barra fija tapa lo último de la pantalla en la operación
  ni en Nueva operación, y las pestañas de la operación van arriba del contenido de la etapa.
  API simulada y sin escrituras.
*/

const id = "51000000-0000-4000-8000-000000000098";
const op = { id, folio: "EXP-000015", cliente_id: "c1", asesor_id: "a1", propiedad_slug: null, operacion: "venta", unidad: "", version: 2, etapa: "documentacion",
  flujo: { version: 1, ruta: "captacion", estado: "activa", motivo: "", requisitos: {
    entrevista: { estado: "revisado", soporte: "Quiere vender", evidencia: { tipo: "externa", referencia: "Carpeta física 12, oficina", fecha: "2026-10-14", responsable: "Asesor sintético", resultado: "Quiere vender" } },
    titularidad: { estado: "observado", soporte: "Falta el certificado de libertad de gravamen; el propietario lo pide esta semana y lo entrega en la oficina", registradoEl: "2026-10-20" },
  } } };

async function mockApi(page: Page) {
  await page.addInitScript(() => localStorage.setItem("fortius.guia.vista.v1", JSON.stringify(["hoy", "operaciones", "operacion", "nueva"])));
  await page.route("**/api/**", async route => {
    const req = route.request(), u = new URL(req.url());
    if (req.method() !== "GET") return route.fulfill({ status: 405, json: { error: "Prueba sin escrituras" } });
    if (u.pathname === "/api/auth/session") return route.fulfill({ json: { user: { id: "qa", email: "qa@example.invalid", role: "admin" } } });
    if (u.pathname === "/api/admin/expedientes" || u.pathname === `/api/admin/expedientes/${id}`) return route.fulfill({ json: { expedientes: [op], expediente: op, nextOffset: null } });
    if (u.pathname.endsWith("/formatos")) return route.fulfill({ json: { documentos: [] } });
    if (u.pathname.endsWith("/adjuntos")) return route.fulfill({ json: { adjuntos: [] } });
    if (u.pathname === "/api/admin/mi-asesor") return route.fulfill({ json: { asesorId: "a1" } });
    if (u.pathname === "/api/admin/entrevistas") return route.fulfill({ json: { entrevistas: [] } });
    if (u.pathname === "/api/admin/apps/runs") return route.fulfill({ json: { runs: [], nextOffset: null } });
    const data = u.pathname.endsWith("/clientes") ? [{ id: "c1", nombre: "Laura Méndez Ríos", tipo: "propietario", telefono: "6641234567", asesorId: "a1" }]
      : u.pathname.endsWith("/asesores") ? [{ id: "a1", nombre: "Asesor sintético", activo: true }] : [];
    return route.fulfill({ json: { records: data.map(v => ({ id: v.id, data: v, version: 1 })) } });
  });
}

/** Baja al final de la página y devuelve cuánto se encima lo último visible con las barras fijas de abajo. */
async function overlapAtBottom(page: Page) {
  return page.evaluate(async () => {
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, document.documentElement.scrollHeight);
    await new Promise(resolve => setTimeout(resolve, 300));
    const bars = [...document.querySelectorAll<HTMLElement>("body *")].filter(el => {
      const r = el.getBoundingClientRect();
      return getComputedStyle(el).position === "fixed" && r.height > 0 && r.height < innerHeight / 2 && r.top > innerHeight / 3 && !el.closest("[role=dialog]");
    });
    const top = Math.min(innerHeight, ...bars.map(el => el.getBoundingClientRect().top));
    const items = [...document.querySelectorAll<HTMLElement>("main a, main button, main h2, main p, main label")]
      .filter(el => el.getClientRects().length && !bars.some(bar => bar.contains(el)));
    const bottom = Math.max(...items.map(el => el.getBoundingClientRect().bottom));
    return bottom - top;
  });
}

for (const width of [390, 1440]) {
  test(`la barra flotante de la operación no tapa nada a ${width} px y las pestañas van arriba`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await mockApi(page);
    await page.goto(`/admin/operaciones/${id}`);
    await expect(page.getByRole("region", { name: "Siguiente acción" })).toBeVisible();
    const tabs = await page.getByRole("tablist", { name: "Secciones de la operación" }).boundingBox();
    const confirm = await page.getByRole("heading", { name: "Antes de seguir, confirma" }).boundingBox();
    expect(tabs && confirm && tabs.y < confirm.y).toBe(true);
    expect(await overlapAtBottom(page)).toBeLessThanOrEqual(0);
  });

  test(`la barra fija de Nueva operación no tapa nada a ${width} px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await mockApi(page);
    await page.goto("/admin/operaciones/nueva");
    await expect(page.getByText("Vender su inmueble")).toBeVisible();
    expect(await overlapAtBottom(page)).toBeLessThanOrEqual(0);
  });
}
