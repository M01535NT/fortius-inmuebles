import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Recorre los cuatro pasos de Nueva operación sin escribir en ninguna base: las respuestas del servidor son de ensayo.
const id = "55000000-0000-4000-8000-000000000001";
const adviser = { id: "qa-adviser", nombre: "Asesor sintético", activo: true };

async function mockApi(page: Page) {
  let interview: Record<string, unknown> | null = null;
  const writes: string[] = [];
  await page.route("**/api/**", async route => {
    const req = route.request(), u = new URL(req.url()), method = req.method();
    if (u.pathname === "/api/auth/session") return route.fulfill({ json: { user: { id: "qa", email: "qa@example.invalid", role: "admin" } } });
    if (u.pathname === "/api/admin/entrevistas/config") return route.fulfill({ json: { administrador: true, asesorId: null } });
    if (u.pathname === "/api/admin/entrevistas" && method === "POST") {
      const body = req.postDataJSON();
      writes.push("inicio");
      interview = { id, intencion: body.intencion, asesor_id: adviser.id, lead_id: "lead-qa", cliente_id: null, expediente_id: null, anterior_id: null, propiedad_slug: null, contacto: { nombre: body.contacto.nombre, telefono: body.contacto.telefono ?? "" }, respuestas: { fecha: "2030-12-01" }, estado: "borrador", version: 1, completed_at: null, updated_at: "2030-12-01" };
      return route.fulfill({ json: { entrevista: interview } });
    }
    if (u.pathname === "/api/admin/entrevistas") return route.fulfill({ json: { entrevistas: [] } });
    if (u.pathname === `/api/admin/entrevistas/${id}`) {
      if (method === "PUT" && interview) {
        const body = req.postDataJSON();
        writes.push(body.completar ? "terminar" : "guardar");
        interview = { ...interview, respuestas: body.respuestas, version: Number(interview.version) + 1, ...(body.completar ? { estado: "completada", expediente_id: "exp-qa", completed_at: "2030-12-01T18:00:00Z" } : {}) };
      }
      return route.fulfill({ json: { entrevista: interview } });
    }
    if (u.pathname === "/api/admin/expedientes") return route.fulfill({ json: { expedientes: [{ id: "exp-qa", folio: "EXP-2030-001" }], nextOffset: null } });
    if (u.pathname === "/api/admin/apps/runs") return route.fulfill({ json: { runs: [], nextOffset: null } });
    if (method !== "GET") { writes.push(`otra:${u.pathname}`); return route.fulfill({ status: 405, json: { error: "Ensayo sin escrituras" } }); }
    const data = u.pathname.endsWith("/asesores") ? [adviser] : [];
    return route.fulfill({ json: { records: data.map(v => ({ id: v.id, data: v, version: 1 })) } });
  });
  return writes;
}

/** Contesta lo que falte en la pantalla: la primera opción de cada grupo y un dato de ensayo en cada campo vacío. */
async function answerScreen(page: Page) {
  for (let round = 0; round < 3; round++) {
    for (const group of await page.locator('[role="radiogroup"][id^="pregunta-"]').all())
      if (!await group.locator('[aria-checked="true"]').count()) await group.getByRole("radio").first().click();
    for (const field of await page.locator('input[id^="pregunta-"]:not([disabled]):not([readonly]), textarea[id^="pregunta-"]:not([disabled]):not([readonly])').all()) {
      if (await field.inputValue()) continue;
      const type = await field.getAttribute("type"), mode = await field.getAttribute("inputmode");
      // Los importes usan el campo de moneda (texto con teclado decimal).
      await field.fill(type === "date" ? "2030-12-31" : type === "number" || mode === "decimal" ? "1500000" : "Dato de ensayo");
    }
  }
}

const fits = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
async function noAxeViolations(page: Page) {
  const result = await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(result.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(" ")).join(", ")}`)).toEqual([]);
}

for (const width of [320, 390, 768, 1440]) {
  test(`nueva operación en cuatro pasos a ${width}`, async ({ page }, info) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", e => errors.push(e.message));
    const writes = await mockApi(page);
    const shot = async (name: string) => {
      expect(await fits(page)).toBe(true);
      for (const dark of [false, true]) {
        await page.evaluate(value => document.documentElement.classList.toggle("dark", value), dark);
        await page.waitForTimeout(400); // deja terminar las transiciones de color
        await page.screenshot({ path: info.outputPath(`${name}-${width}-${dark ? "oscuro" : "claro"}.png`) });
      }
      await page.evaluate(() => document.documentElement.classList.remove("dark"));
      await page.waitForTimeout(400); // vuelve al modo claro antes de medir el contraste
    };

    await page.goto("/admin/operaciones/nueva");
    await expect(page.getByRole("heading", { name: "¿Qué quiere hacer el cliente?" })).toBeVisible();
    await expect(page.getByText("Paso 1 de 4")).toBeVisible();
    await expect(page.getByRole("button", { name: "Continuar", exact: true })).toBeDisabled();
    await page.getByRole("radio", { name: /^Vender su inmueble/ }).click();
    await shot("paso-1");
    if (width === 1440) await noAxeViolations(page);
    await page.getByRole("button", { name: "Continuar", exact: true }).click();

    await expect(page.getByRole("heading", { name: "¿Quién es?" })).toBeVisible();
    await page.getByLabel("Nombre completo").fill("Propietaria de ensayo");
    await page.getByLabel("Teléfono").fill("6640000000");
    await page.getByRole("combobox", { name: "Asesor responsable" }).selectOption(adviser.id);
    await shot("paso-2");
    if (width === 1440) await noAxeViolations(page);
    // El propietario que vende se registra primero como prospecto (decisión del titular, 16/10/2026):
    // una sola pantalla; la entrevista inicial (02) se hace después, desde la operación.
    await page.getByRole("button", { name: /Continuar con los datos del prospecto/ }).click();

    await expect(page).toHaveURL(new RegExp(`entrevista=${id}`));
    await expect(page.getByRole("heading", { name: "Datos del prospecto" })).toBeVisible();
    await expect(page.getByText("Paso 3 de 4")).toBeVisible();
    await answerScreen(page);
    await shot("paso-3");
    if (width === 1440) await noAxeViolations(page);
    await page.getByRole("button", { name: /Guardar prospecto/ }).click();

    await expect(page.getByRole("heading", { name: "Listo, la operación está creada" })).toBeVisible();
    await expect(page.getByText("Paso 4 de 4")).toBeVisible();
    await expect(page.getByText("EXP-2030-001")).toBeVisible();
    await expect(page.getByRole("link", { name: /Abrir la operación/ })).toHaveAttribute("href", "/admin/operaciones/exp-qa");
    await shot("paso-4");
    if (width === 1440) await noAxeViolations(page);

    expect(writes).toEqual(["inicio", "terminar"]);
    expect(errors).toEqual([]);
  });
}
