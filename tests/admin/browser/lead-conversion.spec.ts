import { test, expect } from "@playwright/test";

for (const width of [320, 1440]) {
  test(`lead converts once and preserves its client profile at ${width}px`, async ({ page }, testInfo) => {
    const original = { id: "qa-lead", nombre: "Persona de prueba con apellidos extensos", telefono: "6641234567", email: "persona@example.invalid", origen: "manual", estado: "contactado", asesorId: "a1", creadoEl: "2026-10-04", notas: [{ id: "n1", texto: "Seguimiento previo conservado", fecha: "2026-10-04" }], zona: "Otay", tipoPropiedad: "casa", mensaje: "Consulta inicial de prueba", perfil: { operacion: "comprar", presupuestoMax: 250000, moneda: "USD", formaPago: "credito", requisitos: "Acceso sin escalones" } };
    let lead: Record<string, unknown> = original;
    let customer: Record<string, unknown> | null = null;
    let posts = 0;
    const record = (data: Record<string, unknown>, version: number) => ({ id: data.id, data, version, createdAt: "2026-10-04", updatedAt: "2026-10-05" });
    await page.setViewportSize({ width, height: 900 });
    await page.route("**/api/**", async route => {
      const req = route.request(); const path = new URL(req.url()).pathname;
      if (path === "/api/auth/session") return route.fulfill({ json: { user: { id: "qa-user", email: "qa@example.invalid", role: "admin" } } });
      if (path.endsWith("/convertir")) {
        posts++;
        expect(req.postDataJSON()).toEqual({ version: 7 });
        lead = { ...original, clienteId: "qa-client", convertidoEl: "2026-10-05" };
        customer = { ...original, id: "qa-client", tipo: "comprador", notas: "", leadId: "qa-lead", leadOriginal: original, convertidoEl: "2026-10-05", actualizadoEl: "2026-10-05" };
        return route.fulfill({ json: { cliente: record(customer, 1), lead: record(lead, 8) } });
      }
      if (req.method() === "PUT") {
        const body = req.postDataJSON(); customer = body.data;
        return route.fulfill({ json: { record: record(body.data, body.version + 1) } });
      }
      const records = path.endsWith("/leads") ? [record(lead, customer ? 8 : 7)] : path.endsWith("/clientes") ? customer ? [record(customer, 1)] : [] : path.endsWith("/asesores") ? [record({ id: "a1", nombre: "Ana Asesora", activo: true }, 1)] : [];
      return route.fulfill({ json: { records } });
    });
    await page.goto("/admin/leads/qa-lead");
    const convert = page.getByRole("button", { name: "Convertir en cliente", exact: true });
    await expect(convert).toBeVisible();
    await page.getByRole("button", { name: "Editar ficha" }).click();
    await page.getByLabel("Nombre", { exact: true }).fill("Borrador sin guardar");
    await expect(convert).toBeDisabled();
    await page.getByRole("button", { name: "Cancelar edición" }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`lead-button-${width}.png`), fullPage: true });
    await convert.click();
    await expect(page).toHaveURL(/\/admin\/clientes\/qa-client$/);
    await expect(page.getByRole("heading", { name: original.nombre, exact: true })).toBeVisible();
    await expect(page.getByText("250,000 USD", { exact: true })).toBeVisible();
    await expect(page.getByText("Ana Asesora", { exact: true })).toBeVisible();
    await expect(page.getByText("Seguimiento previo conservado", { exact: true })).toBeVisible();
    await expect(page.getByText("Acceso sin escalones", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`converted-client-${width}.png`), fullPage: true });
    await page.reload();
    await expect(page.getByText("250,000 USD", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Editar cliente" }).click();
    await expect(page.getByLabel("Correo electrónico", { exact: true })).toHaveValue(original.email);
    await page.getByText("Presupuesto y financiamiento", { exact: true }).click();
    await page.getByLabel("Presupuesto máximo", { exact: true }).fill("260000");
    await page.getByLabel("Notas", { exact: true }).fill("Nota de cliente");
    await page.getByRole("button", { name: "Guardar cliente" }).click();
    await expect(page.getByText("260,000 USD", { exact: true })).toBeVisible();
    const readCustomer = () => customer;
    expect(readCustomer()?.leadOriginal).toEqual(original);
    await page.goto("/admin/leads");
    await expect(page.getByRole("button", { name: "Convertidos (1)" })).toBeVisible();
    await expect(page.getByRole("link", { name: original.nombre, exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Convertidos (1)" }).click();
    await page.getByRole("link", { name: "Ver cliente", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/clientes\/qa-client$/);
    expect(posts).toBe(1);
  });
}
