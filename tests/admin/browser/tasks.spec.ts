import { test, expect } from "@playwright/test";
import { mobilePanelData, panelRecords } from "./fixtures/mobile-panel-data";

for (const width of [320, 390, 768, 1440]) {
  test(`tasks create, reload, checklist and calendar fit at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    const fixtures = mobilePanelData("2026-09-23");
    const records = new Map(panelRecords(fixtures, "tareas").map(record => [record.id, record]));
    await page.route("**/api/**", async route => {
      const request = route.request();
      const pathname = new URL(request.url()).pathname;
      if (pathname === "/api/auth/session") return route.fulfill({json:{user:{id:"test",email:"test@example.invalid",role:"admin"}}});
      if (request.method() === "PUT" && pathname.includes("/tareas/")) {
        const body = request.postDataJSON();
        const record = {id:body.data.id,data:body.data,version:(body.version ?? 0)+1,createdAt:"2026-09-23",updatedAt:"2026-09-23"};
        records.set(record.id,record);
        return route.fulfill({json:{record}});
      }
      if (request.method() !== "GET") return route.fulfill({status:405,json:{}});
      return route.fulfill({json:{records:pathname.endsWith("/tareas") ? [...records.values()] : panelRecords(fixtures,pathname.split("/")[4])}});
    });
    await page.goto("/admin/tareas");
    const firstTask = page.getByRole("link", {name:"Revisar documentos del inmueble y confirmar siguientes pasos con el propietario",exact:true});
    await expect(firstTask).toBeVisible();
    if (width === 390) expect((await firstTask.boundingBox())!.y).toBeLessThan(844);
    await page.getByRole("button", {name:"Nueva tarea",exact:true}).click();
    await page.getByLabel("Plantilla opcional").selectOption("captacion");
    await page.getByLabel("Título",{exact:true}).fill("Seguimiento de prueba desde móvil");
    await page.getByLabel("Fecha límite (opcional)").fill("2026-09-23");
    await page.getByLabel("Responsable",{exact:true}).first().selectOption("asesor-prueba");
    await page.getByLabel("Completar paso 1").check();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({path:testInfo.outputPath(`tarea-${width}.png`),fullPage:true});
    await page.getByRole("button",{name:"Guardar tarea",exact:true}).click();
    await expect(page).toHaveURL(/\/admin\/tareas\/[^/?]+$/);
    await page.reload();
    await expect(page.getByLabel("Título",{exact:true})).toHaveValue("Seguimiento de prueba desde móvil");
    await expect(page.getByLabel("Completar paso 1")).toBeChecked();
    await page.getByLabel("Estado",{exact:true}).selectOption("en-espera");
    await page.getByLabel("Motivo de espera").fill("Confirmación del propietario");
    await page.getByLabel("Añadir nota al historial").fill("Contacto realizado");
    await page.getByRole("button",{name:"Guardar tarea",exact:true}).click();
    await expect(page.getByRole("status")).toContainText("Tarea guardada");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.goto("/admin/calendario");
    await page.getByRole("button",{name:/^23 de septiembre de 2026/}).click();
    await expect(page.getByRole("link",{name:/Seguimiento de prueba desde móvil/})).toBeVisible();
    await page.getByRole("link",{name:/Seguimiento de prueba desde móvil/}).click();
    await page.getByRole("button",{name:"Completar tarea",exact:true}).click();
    await expect(page.getByLabel("Estado",{exact:true})).toHaveValue("completada");
    await page.getByRole("button",{name:"Reabrir tarea",exact:true}).click();
    await expect(page.getByLabel("Estado",{exact:true})).toHaveValue("pendiente");
  });
}
