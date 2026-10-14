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
    for (const [path, heading] of [["", "¿Qué vas a hacer hoy?"], ["/leads", "CRM · Relaciones comerciales"], ["/propiedades", "Cartera de inmuebles"], ["/calendario", "Calendario"]] as const) {
      await page.goto("/admin" + path);
      await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
      await fitsPage(page);
      if (path === "") {
        await expect(page.getByRole("link", { name: "08 Eventos próximos" })).toBeVisible();
        if (width === 390) {
          await page.getByText("Seguimiento del equipo", { exact: true }).click();
          const tasks = await page.getByRole("heading", { name: /Tareas prioritarias/ }).boundingBox();
          expect(tasks!.height).toBeGreaterThan(0);
        }
      }
      if (path === "/leads") {
        await page.getByRole("button", { name: "Lista", exact: true }).click();
        await expect(page.getByRole("link", { name: new RegExp(longLeadName) })).toBeVisible();
        const control = page.getByRole("combobox", { name: "Estado de " + longLeadName });
        await expect(control).toBeVisible();
        if (width < 768) {
          const box = await control.boundingBox();
          expect(box!.x + box!.width).toBeLessThanOrEqual(width);
          await page.getByRole("button", { name: "Nuevo prospecto", exact: true }).click();
          await expect(page.getByRole("textbox", { name: "Nombre", exact: true })).toBeVisible();
          await fitsPage(page);
        }
      }
      if (path === "/propiedades" && width < 768) {
        await page.getByLabel("Opciones de " + longPropertyTitle, { exact: true }).click();
        const edit = page.getByRole("link", { name: "Editar " + longPropertyTitle });
        await expect(edit).toBeVisible();
        const box = await edit.boundingBox();
        expect(box!.x + box!.width).toBeLessThanOrEqual(width);
        expect(box!.height).toBeGreaterThanOrEqual(44);
      }
      if (path === "/propiedades" && width >= 1024) {
        await page.getByRole("button", { name: "Lista", exact: true }).click();
        const title = page.locator("table p[title]").first();
        const star = page.locator("table").getByRole("button", {name:/destacada/}).first();
        const titleBox = await title.boundingBox(), starBox = await star.boundingBox();
        expect(starBox!.x + starBox!.width).toBeLessThanOrEqual(titleBox!.x);

        const status = page.getByRole("combobox", { name: "Estado de " + longPropertyTitle }).filter({ visible: true });
        expect(await status.evaluate(select => {
          const control = select as HTMLSelectElement;
          const style = getComputedStyle(control);
          const context = document.createElement("canvas").getContext("2d")!;
          context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
          const available = control.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) - 24;
          return context.measureText(control.selectedOptions[0].text).width <= available;
        }), "the selected property status must be readable without opening the menu").toBe(true);
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
  await expect(nav.getByRole("link", { name: "Resumen", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(nav.getByRole("link", { name: "CRM", exact: true })).toBeFocused();
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
    await sections.selectOption("pf-ubicacion");
    await page.getByLabel("Zona", { exact: true }).fill("Centro");
    await page.getByLabel("Referencia (nunca dirección exacta)", { exact: true }).fill("Referencia ficticia");
    await sections.selectOption("pf-contenido");
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
