import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/auth/session")
      return route.fulfill({
        json: {
          user: {
            id: "staff-browser",
            email: "staff@example.com",
            role: "admin",
          },
        },
      });
    if (url.pathname.startsWith("/api/auth/"))
      return route.fulfill({ json: { ok: true } });
    return route.fulfill({ json: { records: [] } });
  });
});
test("Fortius Inmuebles mark remains visible through email login and sidebar", async ({ page }, testInfo) => {
  let logged = false;
  await page.route("**/api/auth/**", (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === "/api/auth/session")
      return route.fulfill(logged
        ? { json: { user: { id: "staff-browser", email: "staff@example.com", role: "admin" } } }
        : { status: 401, json: { error: "Sin sesión" } });
    if (pathname === "/api/auth/login") logged = true;
    return route.fulfill({ json: { ok: true } });
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Acceso al panel" })).toBeVisible();
  const loginMark = page.getByRole("main").getByRole("img", { name: "Fortius Inmuebles" });
  await expect(loginMark).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("fortius-inmuebles-login.png"), fullPage: true });
  await page.getByLabel("Correo").fill("staff@example.com");
  await page.getByLabel("Contraseña", { exact: true }).fill("local-fixture-password");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: /^(Buenos días|Buenas tardes|Buenas noches|Hola)/ })).toBeVisible();
  const sidebarMark = page.getByRole("complementary").getByRole("img", { name: "Fortius Inmuebles" });
  await expect(sidebarMark).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("fortius-inmuebles-sidebar.png"), fullPage: true });
});
for (const width of [375, 414, 768, 1024, 1440]) {
  test(
    "panel modules fit and remain reachable at " + width,
    async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/admin");
      await expect(
        page.getByRole("heading", { level: 1, name: /^(Buenos días|Buenas tardes|Buenas noches|Hola)/ }),
      ).toBeVisible();
      if (width < 768) {
        const tabs = page.getByRole("navigation", { name: "Secciones principales" });
        for (const name of ["Hoy", "Operaciones", "Contactos"]) await expect(tabs.getByRole("link", { name: new RegExp(`^${name}`) })).toBeVisible();
        await page.getByRole("button", { name: "Menú del panel" }).click();
        const menu = page.getByRole("navigation", { name: "Módulos móviles" });
        await menu.getByRole("button", { name: /Administración/ }).click();
        for (const name of ["Inmuebles", "Agenda", "Ver las 16 herramientas", "Equipo", "Sitio web", "Reportes", "Historial", "Configuración"])
          await expect(menu.getByRole("link", { name, exact: true })).toBeVisible();
        await expect(menu.getByRole("button", { name: "Cerrar sesión" })).toBeVisible();
        await page.screenshot({ path: testInfo.outputPath("navigation-" + width + ".png"), fullPage: true });
        await page.keyboard.press("Escape");
        await tabs.getByRole("link", { name: "Contactos" }).click();
      } else {
        const nav = page.getByRole("navigation", { name: "Módulos del panel", exact: true });
        for (const name of ["Hoy", "Operaciones", "Contactos", "Inmuebles", "Agenda", "Herramientas"])
          await expect(nav.getByRole("link", { name: new RegExp(`^${name}`) })).toBeVisible();
        await nav.getByRole("button", { name: /Administración/ }).click();
        for (const name of ["Equipo", "Sitio web", "Reportes", "Historial", "Configuración"])
          await expect(nav.getByRole("link", { name, exact: true })).toBeVisible();
        await page.screenshot({ path: testInfo.outputPath("navigation-" + width + ".png"), fullPage: true });
        await nav.getByRole("link", { name: "Contactos" }).click();
      }
      await page.getByRole("tab", { name: "Clientes" }).click();
      await page.getByRole("button", { name: "Agregar contacto" }).filter({ visible: true }).click();
      await expect(page.getByLabel("Teléfono", { exact: true })).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: testInfo.outputPath("clients-" + width + ".png"),
        fullPage: true,
      });
      await page.goto("/admin/propiedades/nueva");
      await expect(page.getByRole("button", { name: "Crear inmueble", exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: "Guardar y publicar", exact: true })).toHaveCount(0);
      await expect(page.getByLabel("Folio del inmueble", { exact: true })).toHaveAttribute("readonly", "");
      await expect(page.getByText("Borrador · no visible en el sitio", { exact: true })).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: testInfo.outputPath("property-" + width + ".png"),
        fullPage: true,
      });
    },
  );
}
test("failed initial load is explicit and does not render an empty-success dashboard", async ({
  page,
}) => {
  await page.route("**/api/admin/collections/**", (route) =>
    route.fulfill({
      status: 503,
      json: { error: "Servidor temporalmente no disponible" },
    }),
  );
  await page.goto("/admin");
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Servidor temporalmente no disponible",
  );
  await expect(
    page.getByRole("heading", { level: 1, name: /^(Buenos días|Buenas tardes|Buenas noches|Hola)/ }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Reintentar carga" }),
  ).toBeVisible();
});
for (const width of [375, 768]) {
  test(
    "all operating modules avoid page overflow at " + width,
    async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      for (const moduleName of [
        "propiedades",
        "leads",
        "clientes",
        "calendario",
        "notas",
        "blog",
        "asesores",
        "archivos",
        "contenido",
        "configuracion",
      ]) {
        await page.goto("/admin/" + moduleName);
        await expect(
          page.getByRole("main").getByRole("heading").first(),
        ).toBeVisible();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
          moduleName,
        ).toBe(true);
        if (moduleName === "calendario") {
          await page.screenshot({
            path: testInfo.outputPath("calendar-" + width + ".png"),
            fullPage: true,
          });
          const overlaps = await page
            .locator("button[aria-pressed]")
            .evaluateAll((buttons) =>
              buttons.some((b, i) => {
                const r = b.getBoundingClientRect(),
                  n = buttons[i + 1]?.getBoundingClientRect();
                return n && Math.abs(r.top - n.top) < 1 && r.right > n.left;
              }),
            );
          expect(overlaps, "calendar dates must not overlap").toBe(false);
        }
      }
    },
  );
}
test("real browser forms retain failed drafts and reload acknowledged notes", async ({
  page,
}) => {
  let fail = true;
  let note: Record<string, unknown> | null = null;
  await page.route("**/api/admin/collections/notas**", async (route) => {
    if (route.request().method() === "PUT") {
      if (fail)
        return route.fulfill({
          status: 503,
          json: { error: "No se guardó la nota" },
        });
      note = route.request().postDataJSON().data;
      return route.fulfill({
        json: {
          record: {
            id: note!.id,
            data: note,
            version: 1,
            createdAt: "2026-09-03",
            updatedAt: "2026-09-03",
          },
        },
      });
    }
    return route.fulfill({
      json: {
        records: note
          ? [
              {
                id: note.id,
                data: note,
                version: 1,
                createdAt: "2026-09-03",
                updatedAt: "2026-09-03",
              },
            ]
          : [],
      },
    });
  });
  await page.goto("/admin/notas");
  await page.getByLabel("Título", { exact: true }).fill("Acuerdo registrado");
  await page.getByRole("textbox", { name: "Contenido", exact: true }).fill("Seguimiento real");
  await page.getByRole("button", { name: "Nueva nota" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "No se guardó",
  );
  await expect(page.getByLabel("Título", { exact: true })).toHaveValue(
    "Acuerdo registrado",
  );
  fail = false;
  await page.getByRole("button", { name: "Nueva nota" }).click();
  await expect(page.getByLabel("Título", { exact: true })).toHaveValue("");
  await page.reload();
  await expect(page.getByLabel("Título de la nota")).toHaveValue(
    "Acuerdo registrado",
  );
});
