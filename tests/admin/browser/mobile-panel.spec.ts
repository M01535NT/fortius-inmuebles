import { test, expect, type Page } from "@playwright/test";
import { longLeadName, longPropertyTitle, mobilePanelData, panelRecords } from "./fixtures/mobile-panel-data";

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date("2026-09-23T05:24:00Z") });
  const data = mobilePanelData();
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    if (request.method() !== "GET") return route.fulfill({ status: 405, json: { error: "Prueba sin escrituras" } });
    if (pathname === "/api/auth/session") return route.fulfill({ json: { user: { id: "mobile-audit", email: "auditoria@example.invalid", role: "admin" } } });
    return route.fulfill({ json: { records: panelRecords(data, pathname.split("/")[4]) } });
  });
});

async function fitsPage(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

for (const width of [320, 360, 390, 430, 768, 1440]) {
  test(`populated panel, calendar and lists fit at ${width}`, async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height: 844 });
    for (const [path, heading] of [["", "Panel."], ["/leads", "Leads."], ["/propiedades", "Inmuebles."], ["/calendario", "Calendario."]] as const) {
      await page.goto("/admin" + path);
      await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
      await fitsPage(page);
      if (path === "") {
        await expect(page.getByRole("link", { name: "08 Eventos próximos" })).toBeVisible();
        if (width === 390) {
          const tasks = await page.getByRole("heading", { name: "Tareas pendientes" }).boundingBox();
          expect(tasks!.y).toBeLessThan(844);
        }
      }
      if (path === "/leads") {
        await expect(page.getByRole("link", { name: new RegExp(longLeadName) })).toBeVisible();
        const control = page.getByRole("combobox", { name: "Estado de " + longLeadName });
        await expect(control).toBeVisible();
        if (width < 768) {
          const box = await control.boundingBox();
          expect(box!.x + box!.width).toBeLessThanOrEqual(width);
          await page.getByRole("button", { name: "Nuevo lead", exact: true }).click();
          await expect(page.getByRole("textbox", { name: "Nombre", exact: true })).toBeVisible();
          await fitsPage(page);
        }
      }
      if (path === "/propiedades" && width < 768) {
        const edit = page.getByRole("link", { name: "Editar " + longPropertyTitle });
        await expect(edit).toBeVisible();
        const box = await edit.boundingBox();
        expect(box!.x + box!.width).toBeLessThanOrEqual(width);
        expect(box!.height).toBeGreaterThanOrEqual(44);
      }
      if (path === "/calendario") {
        const dates = page.getByRole("button", { name: /^\d+ de septiembre de 2026/ });
        expect(await dates.count()).toBe(30);
        const dayRects = await dates.evaluateAll(buttons => buttons.map(button => {
          const r = button.getBoundingClientRect();
          return { x: r.x, right: r.right, top: r.top, bottom: r.bottom };
        }));
        expect(dayRects.every(r => r.x >= 0 && r.right <= width)).toBe(true);
        expect(dayRects.some((r, i) => dayRects.slice(i + 1).some(n => r.x < n.right && r.right > n.x && r.top < n.bottom && r.bottom > n.top))).toBe(false);
        await page.getByRole("button", { name: /^23 de septiembre de 2026/ }).click();
        await expect(page.getByText("Sin eventos este día.")).toBeVisible();
        await fitsPage(page);
      }
      await page.screenshot({ path: testInfo.outputPath(`${heading.replace(".", "")}-${width}.png`), fullPage: true });
    }
  });
}

test("mobile navigation closes with Escape and dark populated views still fit", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/admin");
  const trigger = page.getByRole("button", { name: "Menú del panel" });
  await trigger.click();
  const nav = page.getByRole("navigation", { name: "Módulos móviles" });
  await expect(nav.getByText("auditoria@example.invalid")).toBeVisible();
  await expect(nav.getByRole("link", { name: "Panel", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(nav.getByRole("link", { name: "Inmuebles", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(nav).toBeHidden();
  await expect(trigger).toBeFocused();
  await page.getByRole("button", { name: "Cambiar a tema oscuro" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await fitsPage(page);
  for (const path of ["leads", "propiedades", "calendario"]) {
    await page.goto("/admin/" + path);
    await expect(page.getByRole("main").getByRole("heading").first()).toBeVisible();
    await fitsPage(page);
  }
});

for (const width of [320, 390, 768]) {
  test(`property actions, invalid fields and save errors stay reachable at ${width}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/admin/propiedades/nueva");
    const save = page.getByRole("button", { name: "Crear inmueble", exact: true });
    const sections = page.getByRole("combobox", { name: "Ir a sección" });
    await expect(save).toBeInViewport();
    await expect(sections).toBeInViewport();
    await expect(page.getByLabel("Fecha de publicación", { exact: true })).toHaveValue("2026-09-22");
    await fitsPage(page);
    await sections.selectOption("pf-documentos");
    await expect(page.getByRole("region", { name: "Documentos descargables (PDF)", exact: true })).toBeFocused();
    await save.click();
    const title = page.getByLabel("Título", { exact: true });
    await expect(title).toBeFocused();
    await expect.poll(async () => {
      const field = await title.boundingBox();
      const controls = await sections.boundingBox();
      return field!.y >= 64 && field!.y + field!.height < controls!.y;
    }).toBe(true);
    await title.fill("Borrador conservado");
    await page.getByLabel("Zona", { exact: true }).fill("Centro");
    await page.getByLabel("Referencia (nunca dirección exacta)", { exact: true }).fill("Referencia ficticia");
    await page.getByLabel("Descripción", { exact: true }).fill("Descripción de prueba");
    await save.click();
    const error = page.getByRole("main").getByRole("alert");
    await expect(error).toContainText("Prueba sin escrituras");
    await expect(error).toBeInViewport();
    await expect(title).toHaveValue("Borrador conservado");
    await expect(save).toBeEnabled();
    await fitsPage(page);
    await page.screenshot({ path: testInfo.outputPath(`property-feedback-${width}.png`), fullPage: false });
  });
}
