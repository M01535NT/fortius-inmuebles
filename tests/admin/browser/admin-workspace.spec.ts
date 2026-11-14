import { test, expect, type Page } from "@playwright/test";
import { mobilePanelData, panelRecords } from "./fixtures/mobile-panel-data";
test.beforeEach(async ({ page }) => {
  const data = mobilePanelData("2026-10-08");
  data.propiedades[0].publicada = false;
  data.leads[0].propiedadSlug = "audit-casa";
  data.leads[0].perfil = { proximoContacto: "2026-10-08" };
  data.eventos[0].propiedadSlug = "audit-casa";
  data.tareas[0].propiedadSlug = "audit-casa";
  // UX-02: las vistas guardadas y Recientes viven en las preferencias del usuario en el servidor;
  // aquí se simulan en memoria para que una vista sobreviva a recargar la página.
  let preferences: { panel?: Record<string, unknown> } = {};
  let preferencesVersion = 0;
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/admin/preferencias") {
      if (route.request().method() === "PATCH") {
        const patch = (route.request().postDataJSON() as { panel: Record<string, unknown> }).panel;
        preferences = { ...preferences, panel: { ...preferences.panel, ...patch } };
        preferencesVersion += 1;
      }
      return route.fulfill({ json: { preferencias: { data: preferences, version: preferencesVersion } } });
    }
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
      return route.fulfill({ json: { expedientes: [], nextOffset: null } });
    if (path === "/api/admin/apps/runs")
      return route.fulfill({ json: { runs: [], nextOffset: null } });
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

test("la barra superior guía por cinco secciones y «Más»; «Nuevo» y la cuenta abren sus menús", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/admin");
  const nav = page.getByRole("navigation", { name: "Módulos del panel", exact: true });
  for (const name of ["Hoy", "Operaciones", "Contactos", "Inmuebles", "Trámites", "Agenda", "Más"]) await expect(nav.getByRole("link", { name: new RegExp(`^${name}`) })).toBeVisible();
  await expect(nav.getByRole("link", { name: /^Hoy/ })).toHaveAttribute("aria-current", "page");
  for (const gone of ["Organizar módulos", "Abrir aplicaciones"]) await expect(page.getByRole("button", { name: gone, exact: true })).toHaveCount(0);
  await expect(nav.getByRole("button", { name: /Administración/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Nuevo", exact: true }).click();
  const menu = page.getByRole("menu", { name: "Qué quieres crear" });
  await expect(menu.getByRole("menuitem", { name: "Atender a alguien" })).toHaveAttribute("href", "/admin/operaciones/nueva");
  await expect(menu.getByRole("menuitem", { name: "Nueva operación" })).toHaveAttribute("href", "/admin/operaciones/nueva?intencion=vender");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: /Cuenta y sesión/ }).click();
  for (const name of ["Mi perfil", "Administración", "Ver sitio"]) await expect(page.getByRole("link", { name, exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await nav.getByRole("link", { name: "Más" }).click();
  await expect(page).toHaveURL(/\/admin\/herramientas$/);
  await expect(page.locator("main h1")).toHaveText("Más");
  await expect(nav.getByRole("link", { name: "Más" })).toHaveAttribute("aria-current", "page");
  await fits(page);
});

test("un asesor no ve Administración y conserva las 17 herramientas", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.route("**/api/auth/session", route => route.fulfill({ json: { user: { id: "editor-apps-test", email: "editor@example.invalid", role: "editor" } } }));
  await page.goto("/admin/herramientas");
  await page.getByRole("button", { name: /Cuenta y sesión/ }).click();
  await expect(page.getByRole("link", { name: "Administración", exact: true })).toHaveCount(0);
  await expect(page.getByText("Asesor", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  // HER-01 (12/11/2026): catálogo depurado en tres grupos.
  await expect(page.locator("main article")).toHaveCount(9);
});

test("en celular la barra inferior y el menú llevan a todas las secciones", async ({ page }) => {
  for (const width of [320, 375]) {
    await page.setViewportSize({ width, height: 812 });
    await page.goto("/admin");
    await expect(page.getByRole("heading", { level: 1, name: /^(Buenos días|Buenas tardes|Buenas noches|Hola)/ })).toBeVisible();
    const tabs = page.getByRole("navigation", { name: "Secciones principales" });
    for (const name of ["Hoy", "Operaciones", "Contactos"]) await expect(tabs.getByRole("link", { name: new RegExp(`^${name}`) })).toBeVisible();
    await fits(page);
    // El sitio usa desplazamiento suave; se mide al llegar al final, no a mitad de la animación.
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
    const clearance = await page.evaluate(() => {
      const last = document.querySelector("main")!.lastElementChild!.getBoundingClientRect().bottom;
      return document.querySelector('nav[aria-label="Secciones principales"]')!.getBoundingClientRect().top - last;
    });
    expect(clearance, "el final del contenido queda por encima de la barra inferior").toBeGreaterThanOrEqual(0);
    const trigger = page.getByRole("button", { name: "Menú del panel" });
    await trigger.click();
    const menu = page.getByRole("navigation", { name: "Módulos móviles" });
    for (const name of ["Inmuebles", "Trámites", "Agenda y tareas", "Herramientas"]) await expect(menu.getByRole("link", { name, exact: true })).toBeVisible();
    const admin = menu.getByRole("button", { name: /Administración/ });
    await expect(admin).toHaveAttribute("aria-expanded", "false");
    await admin.click();
    await expect(menu.getByRole("link", { name: "Configuración", exact: true })).toBeVisible();
    await expect(menu.getByRole("button", { name: "Cerrar sesión" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await trigger.click();
    await menu.getByRole("button", { name: /Administración/ }).click();
    await menu.getByRole("link", { name: "Configuración", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/configuracion$/);
    await trigger.click();
    await expect(page.getByRole("navigation", { name: "Módulos móviles" }).getByRole("link", { name: "Configuración", exact: true })).toHaveAttribute("aria-current", "page");
    await fits(page);
  }
});
test("form controls have readable contrast in both themes", async ({ page }, info) => {
  await page.goto("/admin/propiedades/audit-casa/editar");
  await expect(page.locator("main h1")).toBeVisible();
  // SIM-19 pliega secciones; se abren todas para medir también sus campos (el contenido plegado no se repinta).
  await page.evaluate(() => document.querySelectorAll("main details").forEach((d) => { (d as HTMLDetailsElement).open = true; }));
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
// SIM-17: el buscador solo busca; las altas salen de «+ Nuevo», también repetidas en el mismo módulo.
test("quick creation works repeatedly from the current module", async ({
  page,
}) => {
  await page.goto("/admin/agenda?tab=tareas");
  for (let i = 0; i < 2; i++) {
    await page.getByRole("button", { name: "Nuevo", exact: true }).click();
    await page.getByRole("menu", { name: "Qué quieres crear" }).getByRole("menuitem", { name: "Nueva tarea" }).click();
    await expect(page.getByLabel("Título", { exact: true })).toBeVisible();
    if (i === 0) await page.getByRole("button", { name: "Cerrar captura", exact: true }).click();
  }
  await page.getByRole("button", { name: "Buscar en el panel" }).click();
  await expect(page.getByRole("dialog").getByText("Crear rápidamente")).toHaveCount(0);
});
for (const width of [320, 390, 1440]) {
  test(`workspace views and draft preview fit at ${width}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of [
      "/admin",
      "/admin/propiedades",
      "/admin/contactos",
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
test("inventory saved view, related tasks and global search navigate with context", async ({
  page,
}) => {
  await page.goto("/admin/propiedades");
  await page.getByText("Más filtros").click();
  await page.getByText(/Filtros y vistas guardadas/).click();
  await page
    .getByLabel("Publicación", { exact: true })
    .selectOption("borrador");
  await page.getByLabel("Nombre de la vista").fill("Pendientes");
  await page
    .getByRole("button", { name: "Guardar vista", exact: true })
    .click();
  await page.reload();
  await page.getByText("Más filtros").click();
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
  // SIM-17: el inmueble llega como vínculo elegido en «¿Con quién o sobre qué?».
  await expect(page.getByRole("list", { name: "Vínculos elegidos" })).toContainText("Inmueble:");
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
  await page.getByRole("banner").getByRole("button",{name:/Cuenta y sesión/}).click();
  await page.getByRole("banner").getByRole("link",{name:"Mi perfil"}).click();
  await page.getByLabel("Nombre visible").fill("Moisés Núñez");
  await page.getByLabel("Seleccionar fotografía").setInputFiles({
    name:"foto.png",mimeType:"image/png",
    buffer:Buffer.from(await page.evaluate(() => { const canvas=document.createElement("canvas");canvas.width=canvas.height=32;const ctx=canvas.getContext("2d")!;ctx.fillStyle="#173655";ctx.fillRect(0,0,32,32);return canvas.toDataURL("image/png").split(",")[1]; }),"base64"),
  });
  await expect(page.getByAltText("Vista previa de tu fotografía")).toBeVisible();
  await page.getByRole("button",{name:"Guardar perfil",exact:true}).click();
  await expect(page.getByText("Perfil guardado en tu cuenta.")).toBeVisible();
  expect(profile.avatar).toMatch(/^data:image\/jpeg;base64,/);
  await page.reload();
  await expect(page.getByLabel("Nombre visible")).toHaveValue("Moisés Núñez");
  await page.screenshot({path:info.outputPath("profile.png"),fullPage:true});
});
test("failed Blog loading does not block inventory navigation", async ({page}) => {
  await page.route("**/api/admin/collections/posts", route => route.fulfill({status:503,json:{error:"Blog temporalmente no disponible"}}));
  await page.goto("/admin/blog");
  await expect(page.getByText(/No se pudo cargar este módulo/)).toBeVisible();
  await page.getByRole("navigation",{name:"Módulos del panel",exact:true}).getByRole("link",{name:"Inmuebles",exact:true}).click();
  await expect(page.locator("main h1")).toHaveText("Inmuebles");
  await expect(page.getByRole("link",{name:/Casa de prueba/}).first()).toBeVisible();
});
// SIM-17: el buscador ya no crea; se sale con cambios sin guardar desde el «+» del celular.
test("mobile editor reveals collapsed sections and confirms leaving through the new menu", async ({page}, info) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto("/admin/propiedades/audit-casa/editar");
  await expect(page.locator("#pf-basicos")).toHaveAttribute("open","");
  await expect(page.locator("#pf-precio")).not.toHaveAttribute("open","");
  await page.locator("#pf-precio summary").click();
  await expect(page.getByLabel("Monto",{exact:true})).toBeVisible();
  await page.getByLabel("Título",{exact:true}).fill("Casa con cambios");
  const newTask = async () => { await page.getByRole("button",{name:"Nuevo",exact:true}).click(); await page.getByRole("menu",{name:"Qué quieres crear"}).getByRole("menuitem",{name:"Nueva tarea"}).click(); };
  await newTask();
  await page.getByRole("dialog",{name:"Confirmar acción"}).getByRole("button",{name:"Cancelar",exact:true}).click();
  await expect(page).toHaveURL(/audit-casa/);
  await newTask();
  await page.getByRole("dialog",{name:"Confirmar acción"}).getByRole("button",{name:"Confirmar",exact:true}).click();
  await expect(page).toHaveURL(/admin\/agenda\?tab=tareas/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.screenshot({path:info.outputPath("mobile-task.png"),fullPage:true});
});
test("Herramientas es solo el catálogo y la dirección anterior de Documentos lleva a él (C45)", async ({ page }) => {
  await page.goto("/admin/documentos");
  await expect(page).toHaveURL(/\/admin\/herramientas$/);
  await expect(page.getByRole("tab", { name: "Documentos" })).toHaveCount(0);
  for (const name of ["Documentos", "Calcular", "Presentar"]) await expect(page.getByRole("heading", { name, level: 2 })).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Buscar herramienta" })).toHaveCount(0);
});
test("Hoy muestra lo que espera, las tareas, la agenda y los próximos 7 días sin desbordar", async ({ page }) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/admin");
    await expect(page.getByRole("heading", { level: 1, name: /^(Buenos días|Buenas tardes|Buenas noches|Hola)/ })).toBeVisible();
    // SIM-16: tres bloques, «Lo siguiente» (portada y cola), «Hoy» (citas y tareas) y «Esta semana».
    await expect(page.getByRole("region", { name: "Lo siguiente" })).toBeVisible();
    for (const name of [/^Hoy/, /^Esta semana/]) await expect(page.getByRole("heading", { level: 2, name })).toBeVisible();
    for (const name of [/Operaciones en curso/, /Tareas de hoy/, /Agenda de hoy/, /Esperan algo de ti/]) await expect(page.getByRole("heading", { level: 2, name })).toHaveCount(0);
    const today = page.getByRole("region", { name: "Hoy" });
    await expect(today.getByRole("checkbox").first()).toBeVisible();
    await expect(today.getByRole("link", { name: "Agregar tarea" })).toHaveAttribute("href", "/admin/agenda?tab=tareas&nueva=1");
    await fits(page);
  }
});
