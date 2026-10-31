import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Contactos, Inmuebles, Agenda, Herramientas y Administración con datos de ensayo y sin escribir en ninguna base.
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Tijuana" }).format(new Date());
const shift = (days: number) => { const d = new Date(`${today}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10); };
const monday = shift(-((new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7));
const day = (offset: number) => { const d = new Date(`${monday}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + offset); return d.toISOString().slice(0, 10); };
const stamp = `${today}T18:00:00Z`;
const adviser = { id: "asesor-qa", nombre: "Mariana Ruiz", cargo: "Asesora", iniciales: "MR", activo: true };
const property = (slug: string, titulo: string, extra: Record<string, unknown>) => ({
  slug, codigo: slug.toUpperCase(), titulo, tipo: "casa", operacion: "venta", precio: { modalidad: "publico", monto: 4850000, moneda: "MXN" },
  zona: "Playas de Tijuana", direccionAproximada: "Av. del Pacífico", descripcion: ["Inmueble de ensayo."],
  ficha: { terrenoM2: 220, construccionM2: 180, recamaras: 3, banos: 2.5 }, amenidades: [], galeria: [], asesorId: adviser.id,
  creditoDisponible: true, puntosDeInteres: [], destacada: false, estado: "disponible", publicada: true, documentos: [], ...extra,
});
const data: Record<string, Record<string, unknown>[]> = {
  asesores: [adviser],
  leads: [
    { id: "l1", nombre: "Ramón Félix Arce", telefono: "664 351 0928", origen: "manual", estado: "contactado", zona: "Rosarito, cerca de la playa", tipoPropiedad: "casa", creadoEl: stamp, notas: [], perfil: { operacion: "comprar", presupuestoMax: 4200000, moneda: "MXN" } },
    { id: "l2", nombre: "Sofía Arreola Peña", telefono: "664 772 1045", origen: "contacto", estado: "nuevo", zona: "Zona Río", tipoPropiedad: "departamento", creadoEl: stamp, notas: [], perfil: { operacion: "rentar", presupuestoMin: 18000, presupuestoMax: 22000, moneda: "MXN", proximoContacto: shift(-2) } },
    { id: "l3", nombre: "Alberto Cázares", telefono: "664 615 8820", origen: "manual", estado: "en-evaluacion", zona: "Otay y Zona Río", creadoEl: stamp, notas: [], perfil: { operacion: "invertir", capitalDeclarado: 3500000, moneda: "MXN" } },
    { id: "l4", nombre: "Daniela Ochoa Lizárraga con un nombre muy largo para revisar el ancho", telefono: "665 108 3371", origen: "manual", estado: "nuevo", creadoEl: stamp, notas: [] },
  ],
  clientes: [{ id: "c1", nombre: "Familia Ortega Ruiz", telefono: "661 120 4398", tipo: "comprador", zona: "Baja Malibú", tipoPropiedad: "casa", notas: "", creadoEl: stamp, actualizadoEl: stamp, perfil: { presupuestoMax: 7000000, moneda: "MXN" } }],
  tareas: [
    { id: "t1", titulo: "Mandarle 3 opciones", descripcion: "", categoria: "leads", estado: "pendiente", prioridad: "normal", vence: today, leadId: "l1", asesorId: adviser.id, pasos: [] },
    { id: "t2", titulo: "Mandarle el análisis de renta", descripcion: "", categoria: "leads", estado: "en-curso", prioridad: "alta", vence: shift(3), leadId: "l3", asesorId: adviser.id, pasos: [{ id: "p1", texto: "Calcular", hecho: true }, { id: "p2", texto: "Enviar", hecho: false }] },
  ],
  eventos: [
    { id: "e1", titulo: "Visita · Casa Baja Malibú", fecha: today, hora: "11:00", tipo: "visita", clienteId: "c1" },
    { id: "e2", titulo: "Entrevista · Lucía Mendoza", fecha: today, hora: "13:30", tipo: "reunion" },
    { id: "e3", titulo: "Visita · Depto Zona Río", fecha: today, hora: "17:00", tipo: "visita" },
    { id: "e4", titulo: "Fotos · Depto Chapultepec", fecha: day(0), hora: "10:00", tipo: "otro" },
    { id: "e5", titulo: "Firma de contrato · Navarro Lugo", fecha: day(1), hora: "09:30", tipo: "firma" },
    { id: "e6", titulo: "Visita · Local en Tecate", fecha: day(2), hora: "12:00", tipo: "visita" },
    { id: "e7", titulo: "Llamada · Sofía Arreola", fecha: day(3), hora: "11:00", tipo: "llamada" },
  ],
  propiedades: [
    property("f-041", "Casa en Playas de Tijuana", {}),
    property("f-038", "Departamento en Chapultepec", { estado: "apartada", ficha: { construccionM2: 96, recamaras: 2, banos: 2 }, precio: { modalidad: "publico", monto: 3200000, moneda: "MXN" } }),
    property("f-043", "Departamento amueblado en Rosarito centro", { operacion: "renta", estado: "disponible", publicada: false, ficha: { construccionM2: 78, recamaras: 1, banos: 1 }, precio: { modalidad: "publico", monto: 16500, moneda: "MXN", periodo: "mensual" }, galeria: [{ src: "/hero/casa-playa.webp", alt: "" }] }),
  ],
  posts: [], archivos: [], notas: [],
};

async function mockApi(page: Page) {
  const writes: string[] = [];
  await page.route("**/api/**", async route => {
    const req = route.request(), path = new URL(req.url()).pathname;
    if (req.method() !== "GET") { writes.push(path); return route.fulfill({ status: 405, json: { error: "Ensayo sin escrituras" } }); }
    if (path === "/api/auth/session") return route.fulfill({ json: { user: { id: "qa", email: "qa@example.invalid", role: "admin" } } });
    if (path === "/api/admin/mi-asesor") return route.fulfill({ json: { asesorId: adviser.id } });
    if (path === "/api/admin/expedientes") return route.fulfill({ json: { expedientes: [], nextOffset: null } });
    if (path === "/api/admin/apps/runs") return route.fulfill({ json: { runs: [], nextOffset: null } });
    if (path === "/api/admin/entrevistas") return route.fulfill({ json: { entrevistas: [] } });
    if (path === "/api/admin/comercial") return route.fulfill({ json: { carteras: [] } });
    if (path === "/api/admin/asesor-cuentas") return route.fulfill({ json: { cuentas: [] } });
    if (path === "/api/admin/historial") return route.fulfill({ json: { entries: [], hasMore: false } });
    const name = path.split("/")[4];
    return route.fulfill({ json: { records: (data[name] ?? []).map(row => ({ id: row.id ?? row.slug, data: row, version: 1, createdAt: stamp, updatedAt: stamp })) } });
  });
  return writes;
}

const fits = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
async function noAxeViolations(page: Page) {
  const result = await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(result.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(" ")).join(", ")}`)).toEqual([]);
}

for (const width of [320, 390, 768, 1440]) {
  test(`contactos, inmuebles, agenda, herramientas y administración a ${width}`, async ({ page }, info) => {
    test.setTimeout(150000);
    await page.setViewportSize({ width, height: 1000 });
    const errors: string[] = [];
    page.on("pageerror", e => errors.push(e.message));
    const writes = await mockApi(page);
    const shot = async (name: string) => {
      expect(await fits(page), `${name} sin desbordamiento a ${width}`).toBe(true);
      for (const dark of [false, true]) {
        await page.evaluate(value => document.documentElement.classList.toggle("dark", value), dark);
        await page.waitForTimeout(300);
        await page.screenshot({ path: info.outputPath(`${name}-${width}-${dark ? "oscuro" : "claro"}.png`), fullPage: true });
      }
      await page.evaluate(() => document.documentElement.classList.remove("dark"));
      // Espera a que terminen las transiciones de color (150 ms) antes de medir el contraste.
      await page.waitForTimeout(300);
      if (width === 1440) await noAxeViolations(page);
    };

    await page.goto("/admin/contactos");
    await expect(page.getByRole("heading", { level: 1, name: "Contactos" })).toBeVisible();
    const filtros = page.getByRole("group", { name: "Mostrar personas" });
    await expect(filtros.getByRole("button", { name: /^Todas/ })).toHaveAttribute("aria-pressed", "true");
    // Una sola lista de personas en todos los anchos (rediseño del 18/10/2026); en computadora ancha, con vista previa al lado.
    const people = page.getByRole("list", { name: "Contactos" });
    const contact = people.getByRole("link", { name: /Ramón Félix Arce/ });
    await expect(contact).toContainText("Comprar casa");
    await expect(contact).toContainText("Mandarle 3 opciones");
    await expect(people.getByText(/Vencido ·/).first()).toBeVisible();
    if (width >= 1180) await expect(page.getByRole("complementary", { name: /Vista previa de/ }).getByRole("link", { name: /Abrir ficha de/ })).toBeVisible();
    await shot("contactos");
    // DEC-36: la etapa es un filtro de la misma lista; «?tab=clientes» sigue abriendo los clientes.
    await filtros.getByRole("button", { name: /^Clientes/ }).click();
    await expect(filtros.getByRole("button", { name: /^Clientes/ })).toHaveAttribute("aria-pressed", "true");
    await expect(people.getByText("Familia Ortega Ruiz").first()).toBeVisible();
    await expect(people.getByRole("link", { name: /Ramón Félix Arce/ })).toHaveCount(0);
    await page.goto("/admin/contactos?tab=clientes");
    await expect(filtros.getByRole("button", { name: /^Clientes/ })).toHaveAttribute("aria-pressed", "true");
    await expect(people.getByText("Familia Ortega Ruiz").first()).toBeVisible();

    await page.goto("/admin/propiedades");
    await expect(page.getByRole("heading", { level: 1, name: "Inmuebles" })).toBeVisible();
    await expect(page.getByText("3 inmuebles · 2 publicados")).toBeVisible();
    await page.getByRole("radio", { name: "En renta" }).click();
    await expect(page.getByRole("list", { name: "Inmuebles" }).getByRole("listitem")).toHaveCount(1);
    await page.getByRole("radio", { name: "Todos" }).click();
    await expect(page.getByRole("list", { name: "Inmuebles" }).getByRole("listitem")).toHaveCount(3);
    await shot("inmuebles");
    await page.getByLabel("Opciones de Casa en Playas de Tijuana").click();
    await expect(page.getByRole("combobox", { name: "Estado de Casa en Playas de Tijuana" })).toBeVisible();
    expect(await fits(page)).toBe(true);

    await page.goto("/admin/agenda");
    await expect(page.getByRole("heading", { level: 1, name: "Agenda" })).toBeVisible();
    await expect(page.getByText(/^Semana del/)).toBeVisible();
    const week = page.getByRole("region", { name: "Agenda semanal" });
    if (width >= 1024) await expect(week.getByRole("button", { name: "Ver evento: Visita · Local en Tecate" })).toBeVisible();
    await expect(page.locator("#calendar-selected-day")).toBeVisible();
    await shot("agenda");
    await page.getByRole("tab", { name: /Tareas/ }).click();
    await expect(page.getByRole("link", { name: "Mandarle el análisis de renta" })).toBeVisible();
    await shot("tareas");

    await page.goto("/admin/herramientas");
    await expect(page.getByRole("heading", { level: 1, name: "Herramientas" })).toBeVisible();
    await shot("herramientas");

    await page.goto("/admin/contenido");
    await expect(page.getByRole("navigation", { name: "Sitio web" }).getByRole("link", { name: "Textos del sitio" })).toHaveAttribute("aria-current", "page");
    expect(await fits(page)).toBe(true);
    await page.goto("/admin/reportes");
    await expect(page.getByRole("navigation", { name: "Reportes" }).getByRole("link", { name: "Reportes" })).toHaveAttribute("aria-current", "page");
    await shot("reportes");
    await page.goto("/admin/asesores");
    await expect(page.getByRole("heading", { level: 1, name: "Equipo" })).toBeVisible();
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { level: 1, name: "Equipo" })).toBeVisible();
    expect(await fits(page)).toBe(true);

    expect(writes).toEqual([]);
    expect(errors).toEqual([]);
  });
}
