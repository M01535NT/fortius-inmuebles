import { expect, test } from "@playwright/test";

const sections = [
  "/", "/inventario", "/residencial", "/comercial", "/industrial",
  "/vender-propiedad", "/comprar-propiedad", "/due-diligence-inmobiliaria",
  "/blog", "/herramientas", "/zonas", "/nosotros", "/contacto",
  "/privacidad", "/terminos",
];
const pages = [
  ...sections, "/herramientas/hipoteca", "/herramientas/gastos-de-cierre",
  "/zonas/zona-rio", "/inventario/residencia-vista-al-mar-playas",
  "/blog/cuanto-vale-mi-casa-tijuana", "/vender-propiedad/gracias",
  "/ruta-inexistente-mnt",
];

for (const width of [375, 1440]) {
  test(`every public page keeps a working menu at ${width}px`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width, height: width === 375 ? 667 : 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const path of pages) {
      const response = await page.goto(path, { waitUntil: "domcontentloaded" });
      expect(response?.status(), path).toBe(path === "/ruta-inexistente-mnt" ? 404 : 200);
      const trigger = page.getByRole("button", { name: "Abrir menú" });
      await expect(trigger, path).toBeVisible();
      await trigger.click();
      const menu = page.getByRole("dialog", { name: "Menú", exact: true });
      await expect(menu, path).toBeVisible();
      for (const destination of sections) {
        await expect(menu.locator(`a[href="${destination}"]`), `${path} → ${destination}`).toHaveCount(1);
      }
      if (sections.includes(path)) await expect(menu.locator(`a[href="${path}"]`)).toHaveAttribute("aria-current", "page");
      await menu.getByRole("button", { name: "Cerrar menú" }).click();
      await expect(menu).toBeHidden();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), path).toBe(true);
    }
    expect(errors).toEqual([]);
  });
}

test("leaving an initially loaded admin page restores public navigation", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.route("**/api/**", (route) => {
    if (new URL(route.request().url()).pathname === "/api/auth/session") {
      return route.fulfill({ json: { user: { id: "navigation-fixture", email: "staff@example.com", role: "admin" } } });
    }
    return route.fulfill({ json: { records: [] } });
  });
  await page.goto("/admin");
  await page.getByRole("button", { name: "Menú del panel" }).click();
  await page.getByRole("link", { name: "Ver sitio", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("button", { name: "Abrir menú" })).toBeVisible();
  await page.getByRole("link", { name: "Ver propiedades", exact: true }).click();
  await expect(page).toHaveURL(/\/inventario$/);
  await page.getByRole("button", { name: "Abrir menú" }).click();
  const menu = page.getByRole("dialog", { name: "Menú", exact: true });
  await menu.locator('a[href="/contacto"]').click();
  await expect(page).toHaveURL(/\/contacto$/);
  await expect(menu).toBeHidden();
  await expect(page.getByRole("button", { name: "Abrir menú" })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/inventario$/);
  await expect(page.getByRole("button", { name: "Abrir menú" })).toBeVisible();
});

test("login offers a way back to the public site without signing in", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Acceso al panel" })).toBeVisible();
  await page.getByRole("link", { name: "Volver al sitio" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("button", { name: "Abrir menú" })).toBeVisible();
});

test("public and admin not-found pages return to the complete public site", async ({ page }) => {
  for (const path of ["/ruta-inexistente-mnt", "/admin/ruta-inexistente-mnt"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: "Página no encontrada." })).toBeVisible();
    await page.getByRole("link", { name: "Volver al inicio", exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("button", { name: "Abrir menú" })).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
  }
});

test("an admin render error offers a working exit to public navigation", async ({ page }) => {
  await page.route("**/api/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/auth/session") {
      return route.fulfill({ json: { user: { id: "navigation-fixture", email: "staff@example.com", role: "admin" } } });
    }
    // A malformed response exercises the actual shared error boundary without server writes.
    const records = path === "/api/admin/collections/leads"
      ? [{ id: "invalid", version: 1, data: { id: "invalid", estado: "nuevo", nombre: { invalid: "record" }, origen: "web" } }]
      : [];
    return route.fulfill({ json: { records } });
  });
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "No pudimos cargar esta página." })).toBeVisible();
  await page.getByRole("link", { name: "Volver al inicio", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("button", { name: "Abrir menú" })).toBeVisible();
  await expect(page.locator("footer")).toBeVisible();
});

test("short phone screens can reach the first footer navigation link", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/inventario");
  const link = page.locator("footer").getByRole("link", { name: "Mercado inmobiliario", exact: true });
  await link.scrollIntoViewIfNeeded();
  await expect.poll(() => link.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    return document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)?.closest("a") === node;
  })).toBe(true);
  await link.click();
  await expect(page).toHaveURL(/\/blog$/);
});

test("inventory menu can reach every section and close after scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/inventario");
  await page.getByRole("button", { name: "Abrir menú" }).click();
  const menu = page.getByRole("dialog", { name: "Menú", exact: true });
  for (const destination of sections) await expect(menu.locator(`a[href="${destination}"]`)).toHaveCount(1);
  await expect(menu.locator("[data-menu-item]").last()).toHaveCSS("opacity", "1");
  const terms = menu.getByRole("link", { name: "Términos y condiciones", exact: true });
  await terms.scrollIntoViewIfNeeded();
  const close = menu.getByRole("button", { name: "Cerrar menú" });
  await expect(close).toBeInViewport();
  await close.focus();
  await page.keyboard.press("Tab");
  const firstLink = menu.locator('a[href="/"]');
  await expect(firstLink).toBeFocused();
  await expect.poll(() => firstLink.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    return document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)?.closest("a") === node;
  })).toBe(true);
  await close.click();
  await expect(menu).toBeHidden();
  await expect(page.getByRole("button", { name: "Abrir menú" })).toBeFocused();
  await page.getByRole("button", { name: "Abrir menú" }).click();
  await menu.getByRole("link", { name: "Nosotros", exact: true }).click();
  await expect(page).toHaveURL(/\/nosotros$/);
  await expect(menu).toBeHidden();
  await expect(page.getByRole("button", { name: "Abrir menú" })).toBeVisible();
});

test("property, article, zone and calculator pages return to their catalogs", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/inventario");
  await page.locator('main a[href="/inventario/residencia-vista-al-mar-playas"]').first().click();
  await expect(page).toHaveURL(/\/inventario\/residencia-vista-al-mar-playas$/);
  await page.getByRole("link", { name: "Volver al inventario" }).click();
  await expect(page).toHaveURL(/\/inventario$/);

  await page.goto("/blog");
  await page.locator('main a[href="/blog/cuanto-vale-mi-casa-tijuana"]').first().click();
  await expect(page).toHaveURL(/\/blog\/cuanto-vale-mi-casa-tijuana$/);
  await page.getByRole("link", { name: "Volver a Mercado inmobiliario" }).click();
  await expect(page).toHaveURL(/\/blog$/);

  await page.goto("/zonas");
  await page.locator('main a[href="/zonas/zona-rio"]').click();
  await expect(page).toHaveURL(/\/zonas\/zona-rio$/);
  await page.getByRole("navigation", { name: "Miga de pan" }).getByRole("link", { name: "Zonas", exact: true }).click();
  await expect(page).toHaveURL(/\/zonas$/);

  for (const calculator of ["hipoteca", "gastos-de-cierre"]) {
    await page.goto("/herramientas");
    await page.locator(`main a[href="/herramientas/${calculator}"]`).click();
    await expect(page).toHaveURL(new RegExp(`/herramientas/${calculator}$`));
    await page.getByRole("main").getByRole("link", { name: "Herramientas", exact: true }).click();
    await expect(page).toHaveURL(/\/herramientas$/);
  }
});
