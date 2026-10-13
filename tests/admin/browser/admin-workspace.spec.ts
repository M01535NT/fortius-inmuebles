import { test, expect, type Page } from "@playwright/test";
import { mobilePanelData, panelRecords } from "./fixtures/mobile-panel-data";
test.beforeEach(async ({ page }) => {
  const data = mobilePanelData("2026-10-08");
  data.propiedades[0].publicada = false;
  data.leads[0].propiedadSlug = "audit-casa";
  data.leads[0].perfil = { proximoContacto: "2026-10-08" };
  data.eventos[0].propiedadSlug = "audit-casa";
  data.tareas[0].propiedadSlug = "audit-casa";
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (route.request().method() !== "GET")
      return route.fulfill({
        status: 405,
        json: { error: "Prueba sin escrituras reales" },
      });
    if (path === "/api/auth/session")
      return route.fulfill({
        json: {
          user: {
            id: "workspace-test",
            email: "prueba@example.invalid",
            role: "admin",
          },
        },
      });
    if (path === "/api/admin/mi-asesor")
      return route.fulfill({ json: { asesorId: "asesor-prueba" } });
    if (path === "/api/admin/expedientes")
      return route.fulfill({ json: { expedientes: [] } });
    if (path === "/api/admin/comercial")
      return route.fulfill({ json: { carteras: [] } });
    if (path === "/api/admin/historial")
      return route.fulfill({ json: { entries: [], hasMore: false } });
    return route.fulfill({
      json: { records: panelRecords(data, path.split("/")[4]) },
    });
  });
});
async function fits(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}
test("sidebar resizes, collapses and remembers its width", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/admin");
  const sidebar = page.locator("#admin-desktop-sidebar");
  const resize = page.getByRole("separator", { name: "Ancho de la barra lateral" });
  await expect(resize).toHaveAttribute("aria-valuenow", "232");
  await resize.focus();
  await page.keyboard.press("ArrowRight");
  await expect(resize).toHaveAttribute("aria-valuenow", "248");
  const box = await resize.boundingBox();
  await page.mouse.move(box!.x + 5, box!.y + 100);
  await page.mouse.down();
  await page.mouse.move(box!.x + 45, box!.y + 100);
  await page.mouse.up();
  await expect(resize).toHaveAttribute("aria-valuenow", "288");
  await page.getByRole("button", { name: "Contraer barra lateral" }).click();
  await expect(sidebar).toHaveAttribute("data-collapsed", "true");
  await expect(sidebar.getByRole("link", { name: "Inmuebles", exact: true })).toBeVisible();
  await fits(page);
  await page.reload();
  await expect(sidebar).toHaveAttribute("data-collapsed", "true");
  await page.getByRole("button", { name: "Expandir barra lateral" }).click();
  await expect(resize).toHaveAttribute("aria-valuenow", "288");
  await resize.focus();
  await page.keyboard.press("End");
  await expect(resize).toHaveAttribute("aria-valuenow", "360");
  await page.keyboard.press("Home");
  await expect(resize).toHaveAttribute("aria-valuenow", "224");
  await fits(page);
});
test("form controls have readable contrast in both themes", async ({ page }, info) => {
  await page.goto("/admin/propiedades/audit-casa/editar");
  await expect(page.locator("main h1")).toBeVisible();
  for (const dark of [false, true]) {
    await page.evaluate((value) => document.documentElement.classList.toggle("dark", value), dark);
    // Allow surface transitions to reach their final colors.
    await page.waitForTimeout(200);
    const results = await page.evaluate(() => {
      const luminance = (color: string) => {
        const values = color.match(/[\d.]+/g)!.slice(0, 3).map(Number).map((value) => {
          const channel = value / 255;
          return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
        });
        return values[0] * .2126 + values[1] * .7152 + values[2] * .0722;
      };
      const contrast = (a: string, b: string) => {
        const x = luminance(a), y = luminance(b);
        return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
      };
      return Array.from(document.querySelectorAll("main input:not([type=hidden]):not([type=checkbox]):not([type=radio]), main textarea, main select, main .admin-button-primary, main .admin-button-secondary"))
        .filter((element) => (element as HTMLElement).offsetWidth > 0 && !(element as HTMLInputElement).disabled)
        .map((element) => {
          const style = getComputedStyle(element);
          return { text: contrast(style.color, style.backgroundColor), edge: contrast(style.borderTopColor, style.backgroundColor), field: element.matches("input,textarea,select") };
        });
    });
    expect(results.length).toBeGreaterThan(5);
    for (const result of results) {
      expect(result.text).toBeGreaterThanOrEqual(4.5);
      if (result.field) expect(result.edge).toBeGreaterThanOrEqual(3);
    }
    await page.screenshot({ path: info.outputPath(`form-${dark ? "dark" : "light"}.png`) });
  }
});
test("quick creation works repeatedly from the current module", async ({
  page,
}) => {
  for (const [path, label, field, close] of [
    ["/admin/leads", "Nuevo prospecto", "Nombre", "Cerrar captura"],
    ["/admin/tareas", "Nueva tarea", "Título", "Cerrar captura"],
  ]) {
    await page.goto(path);
    for (let i = 0; i < 2; i++) {
      await page.getByRole("button", { name: "Buscar en el panel" }).click();
      await page
        .getByRole("dialog")
        .getByRole("link", { name: label, exact: true })
        .click();
      await expect(page.getByLabel(field, { exact: true })).toBeVisible();
      if (i === 0)
        await page.getByRole("button", { name: close, exact: true }).click();
    }
  }
});
for (const width of [320, 390, 1440]) {
  test(`workspace views and draft preview fit at ${width}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of [
      "/admin",
      "/admin/propiedades",
      "/admin/leads",
      "/admin/reportes",
      "/admin/historial",
    ]) {
      await page.goto(path);
      await expect(page.locator("main h1")).toBeVisible();
      await fits(page);
    }
    await page.goto("/admin/propiedades/audit-casa/editar");
    await expect(
      page.getByRole("button", { name: "Guardar y publicar" }),
    ).toBeVisible();
    await fits(page);
    await page
      .getByLabel("Título", { exact: true })
      .fill("Casa pendiente de guardar");
    await page.getByRole("button", { name: "Guardar copia temporal" }).click();
    await page
      .getByRole("button", { name: "Vista previa", exact: true })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "Vista previa del inmueble",
    });
    await expect(
      dialog.getByText("Casa pendiente de guardar", { exact: true }),
    ).toBeVisible();
    await dialog.getByRole("button", { name: "Ver móvil" }).click();
    await fits(page);
    await page.screenshot({
      path: info.outputPath(`editor-preview-${width}.png`),
    });
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
  });
}
test("reorders navigation by drag and touch controls, persists and restores", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/admin");
  const desktop = page.getByRole("navigation", {
    name: "Módulos del panel",
    exact: true,
  });
  await desktop.getByRole("button", { name: "Organizar módulos" }).click();
  await desktop
    .getByTitle("Arrastrar Inmuebles")
    .dragTo(desktop.getByRole("link", { name: "Resumen", exact: true }));
  await expect(desktop.getByRole("link").first()).toHaveText("Inmuebles");
  await page.reload();
  await expect(desktop.getByRole("link").first()).toHaveText("Inmuebles");
  await page.setViewportSize({ width: 390, height: 900 });
  await page.getByRole("button", { name: "Menú del panel" }).click();
  const mobile = page.getByRole("navigation", { name: "Módulos móviles" });
  await mobile.getByRole("button", { name: "Organizar módulos" }).click();
  await mobile
    .getByRole("button", { name: "Subir Resumen", exact: true })
    .click();
  await expect(mobile.getByRole("link").first()).toHaveText("Resumen");
  await fits(page);
});
test("inventory saved view, related tasks and global search navigate with context", async ({
  page,
}) => {
  await page.goto("/admin/propiedades");
  await page.getByText(/Filtros y vistas guardadas/).click();
  await page
    .getByLabel("Publicación", { exact: true })
    .selectOption("borrador");
  await page.getByLabel("Nombre de la vista").fill("Pendientes");
  await page
    .getByRole("button", { name: "Guardar vista", exact: true })
    .click();
  await page.reload();
  await page.getByText(/Filtros y vistas guardadas/).click();
  await page.getByRole("button", { name: "Pendientes", exact: true }).click();
  await expect(page.getByLabel("Publicación", { exact: true })).toHaveValue(
    "borrador",
  );
  await page.getByRole("button", { name: "Buscar en el panel" }).click();
  await page
    .getByRole("searchbox", { name: "Buscar personas, inmuebles o folios" })
    .fill("MNT-PRUEBA");
  await page.getByRole("dialog").getByRole("link").first().click();
  await expect(page).toHaveURL(/audit-casa\/editar/);
  await page.getByRole("link", { name: "Crear tarea relacionada" }).click();
  await expect(page).toHaveURL(/propiedadSlug=audit-casa/);
  await page
    .getByText("Descripción, categoría y vínculos", { exact: true })
    .click();
  await expect(
    page.getByLabel("Inmueble relacionado", { exact: true }),
  ).toHaveValue("audit-casa");
});
test("profile menu persists identity, photo and reading preferences", async ({ page }, info) => {
  let profile = {name:"",avatar:""};
  await page.route("**/api/auth/session", route => route.fulfill({json:{user:{id:"workspace-test",email:"prueba@example.invalid",role:"admin",...profile}}}));
  await page.route("**/api/auth/profile", async route => {
    expect(route.request().method()).toBe("PATCH");
    profile = route.request().postDataJSON();
    return route.fulfill({json:{ok:true}});
  });
  await page.goto("/admin");
  const menu = page.getByRole("button", {name:/Menú de usuario/});
  await menu.click();
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();
  await expect(menu).toHaveAttribute("aria-expanded","false");
  await menu.click();
  await page.getByRole("link",{name:"Mi perfil y fotografía"}).click();
  await page.getByLabel("Nombre visible").fill("Moisés Núñez");
  await page.getByLabel("Seleccionar fotografía").setInputFiles({
    name:"foto.png",mimeType:"image/png",
    buffer:Buffer.from(await page.evaluate(() => { const canvas=document.createElement("canvas");canvas.width=canvas.height=32;const ctx=canvas.getContext("2d")!;ctx.fillStyle="#173655";ctx.fillRect(0,0,32,32);return canvas.toDataURL("image/png").split(",")[1]; }),"base64"),
  });
  await expect(page.getByAltText("Vista previa de tu fotografía")).toBeVisible();
  await page.getByRole("button",{name:"Guardar perfil",exact:true}).click();
  await expect(page.getByText("Perfil guardado en tu cuenta.")).toBeVisible();
  expect(profile.avatar).toMatch(/^data:image\/jpeg;base64,/);
  await page.getByRole("button",{name:"Compacta",exact:true}).click();
  await expect(page.locator(".admin-workspace")).toHaveAttribute("data-density","compact");
  await page.reload();
  await expect(page.getByLabel("Nombre visible")).toHaveValue("Moisés Núñez");
  await expect(page.locator(".admin-workspace")).toHaveAttribute("data-density","compact");
  await page.screenshot({path:info.outputPath("profile.png"),fullPage:true});
});
test("failed Blog loading does not block inventory navigation", async ({page}) => {
  await page.route("**/api/admin/collections/posts", route => route.fulfill({status:503,json:{error:"Blog temporalmente no disponible"}}));
  await page.goto("/admin/blog");
  await expect(page.getByText(/No se pudo cargar este módulo/)).toBeVisible();
  await page.locator("#admin-desktop-sidebar").getByRole("link",{name:"Inmuebles",exact:true}).click();
  await expect(page.locator("main h1")).toHaveText("Cartera de inmuebles");
  await expect(page.getByRole("link",{name:/Casa de prueba/}).first()).toBeVisible();
});
test("mobile editor reveals collapsed sections and confirms leaving through search", async ({page}, info) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto("/admin/propiedades/audit-casa/editar");
  await expect(page.locator("#pf-basicos")).toHaveAttribute("open","");
  await expect(page.locator("#pf-precio")).not.toHaveAttribute("open","");
  await page.locator("#pf-precio summary").click();
  await expect(page.getByLabel("Monto",{exact:true})).toBeVisible();
  await page.getByLabel("Título",{exact:true}).fill("Casa con cambios");
  await page.getByRole("button",{name:"Buscar en el panel"}).click();
  await page.getByRole("dialog").getByRole("link",{name:"Nueva tarea",exact:true}).click();
  await page.getByRole("dialog",{name:"Confirmar acción"}).getByRole("button",{name:"Cancelar",exact:true}).click();
  await expect(page).toHaveURL(/audit-casa/);
  await page.getByRole("dialog").getByRole("link",{name:"Nueva tarea",exact:true}).click();
  await page.getByRole("dialog",{name:"Confirmar acción"}).getByRole("button",{name:"Confirmar",exact:true}).click();
  await expect(page).toHaveURL(/admin\/tareas/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.screenshot({path:info.outputPath("mobile-task.png"),fullPage:true});
});
