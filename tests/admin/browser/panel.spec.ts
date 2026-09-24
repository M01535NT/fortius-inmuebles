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
test("MNT Inmuebles mark remains visible through email login and sidebar", async ({ page }, testInfo) => {
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
  const loginMark = page.getByRole("main").getByRole("img", { name: "MNT Inmuebles" });
  await expect(loginMark).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("mnt-login.png"), fullPage: true });
  await page.getByLabel("Correo").fill("staff@example.com");
  await page.getByLabel("Contraseña", { exact: true }).fill("local-fixture-password");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Panel.", exact: true })).toBeVisible();
  const sidebarMark = page.getByRole("complementary").getByRole("img", { name: "MNT Inmuebles" });
  await expect(sidebarMark).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("mnt-sidebar.png"), fullPage: true });
});
for (const width of [375, 414, 768, 1024, 1440]) {
  test(
    "panel modules fit and remain reachable at " + width,
    async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/admin");
      await expect(
        page.getByRole("heading", { name: "Panel.", exact: true }),
      ).toBeVisible();
      const nav =
        width < 768
          ? page.getByRole("navigation", { name: "Módulos móviles" })
          : page.getByRole("navigation", { name: "Módulos del panel" });
      if (width < 768)
        await page.getByRole("button", { name: "Menú del panel" }).click();
      for (const name of [
        "Inmuebles",
        "Leads",
        "Clientes",
        "Calendario",
        "Notas",
        "Mercado inmobiliario",
        "Asesores",
        "Archivos",
        "Contenido",
        "Configuración",
      ])
        await expect(
          nav.getByRole("link", { name, exact: true }),
        ).toBeVisible();
      if (width < 768)
        await expect(nav.getByRole("button", { name: "Salir" })).toBeVisible();
      await page.screenshot({
        path: testInfo.outputPath("navigation-" + width + ".png"),
        fullPage: true,
      });
      await nav.getByRole("link", { name: "Clientes", exact: true }).click();
      await page.getByRole("button", { name: "Nuevo cliente" }).click();
      await expect(page.getByLabel("Teléfono")).toBeVisible();
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
      await expect(page.getByLabel("Publicar en el sitio")).toBeVisible();
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
    page.getByRole("heading", { name: "Panel.", exact: true }),
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
  await page.getByLabel("Contenido", { exact: true }).fill("Seguimiento real");
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
