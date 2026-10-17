import { expect, test } from "@playwright/test";

const sections = [
  "/", "/inventario", "/residencial", "/comercial", "/industrial",
  "/vender-propiedad", "/comprar-propiedad", "/due-diligence-inmobiliaria",
  "/blog", "/herramientas", "/nosotros", "/contacto",
  "/privacidad", "/terminos",
];
const menuRoutes = ["/", "/inventario", "/#metodo", "/herramientas", "/blog", "/contacto"];
const pages = [
  ...sections, "/herramientas/hipoteca", "/herramientas/gastos-de-cierre",
  "/inventario/residencia-vista-al-mar-playas",
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
      for (const destination of menuRoutes) {
        await expect(menu.locator(`nav[aria-label="Menú principal"] > ol > li > div > a[href="${destination}"]`), `${path} → ${destination}`).toHaveCount(1);
      }
      if (menuRoutes.includes(path)) await expect(menu.locator(`nav[aria-label="Menú principal"] > ol > li > div > a[href="${path}"]`)).toHaveAttribute("aria-current", "page");
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
  await page.locator(".editorial-cover-actions").getByRole("link", { name: "Ver propiedades", exact: true }).click();
  await expect(page).toHaveURL(/\/inventario$/);
  await page.getByRole("button", { name: "Abrir menú" }).click();
  const menu = page.getByRole("dialog", { name: "Menú", exact: true });
  await menu.locator('nav[aria-label="Menú principal"] > ol > li > div > a[href="/contacto"]').click();
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
  // Contactos muestra los prospectos; Hoy ya no lista prospectos y no se rompe con este dato.
  await page.goto("/admin/contactos");
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
  const link = page.locator("footer").getByRole("link", { name: "Blog", exact: true });
  await link.scrollIntoViewIfNeeded();
  await expect.poll(() => link.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    return document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)?.closest("a") === node;
  })).toBe(true);
  await link.click();
  await expect(page).toHaveURL(/\/blog$/);
});

test("inventory menu keeps primary links accessible and restores focus when closing", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/inventario");
  await page.getByRole("button", { name: "Abrir menú" }).click();
  const menu = page.getByRole("dialog", { name: "Menú", exact: true });
  for (const destination of menuRoutes) await expect(menu.locator(`nav[aria-label="Menú principal"] > ol > li > div > a[href="${destination}"]`)).toHaveCount(1);
  await expect(menu.locator("[data-menu-item]").last()).toHaveCSS("opacity", "1");
  const contact = menu.locator('nav[aria-label="Menú principal"] > ol > li > div > a[href="/contacto"]');
  await contact.scrollIntoViewIfNeeded();
  const close = menu.getByRole("button", { name: "Cerrar menú" });
  await expect(close).toBeInViewport();
  const lastFocusable = menu.locator('a[href]:visible, button:not([disabled]):visible').last();
  await lastFocusable.focus();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(lastFocusable).toBeFocused();
  await close.focus();
  await page.keyboard.press("Tab");
  const firstLink = menu.locator('nav[aria-label="Menú principal"] > ol > li > div > a[href="/"]');
  await expect(firstLink).toBeFocused();
  await expect.poll(() => firstLink.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    return document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)?.closest("a") === node;
  })).toBe(true);
  await close.click();
  await expect(menu).toBeHidden();
  await expect(page.getByRole("button", { name: "Abrir menú" })).toBeFocused();
  await page.getByRole("button", { name: "Abrir menú" }).click();
  await contact.click();
  await expect(page).toHaveURL(/\/contacto$/);
  await expect(menu).toBeHidden();
  await expect(page.getByRole("button", { name: "Abrir menú" })).toBeVisible();
});

test("property, article and calculator pages return to their catalogs", async ({ page }) => {
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
  await page.getByRole("link", { name: "Volver al Blog" }).click();
  await expect(page).toHaveURL(/\/blog$/);

  for (const calculator of ["hipoteca", "gastos-de-cierre"]) {
    await page.goto("/herramientas");
    await page.locator(`main a[href="/herramientas/${calculator}"]`).click();
    await expect(page).toHaveURL(new RegExp(`/herramientas/${calculator}$`));
    await page.getByRole("main").getByRole("link", { name: "Herramientas", exact: true }).click();
    await expect(page).toHaveURL(/\/herramientas$/);
  }
});

test("buyers, sellers and segment pages lead to the right next step on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/comprar-propiedad");
  await page.getByRole("link", { name: "Preparar mi búsqueda" }).click();
  await expect(page).toHaveURL(/\/comprar-propiedad#busqueda$/);
  await expect(page.getByRole("heading", { name: "Tres datos para empezar" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Explorar inventario" })).toHaveAttribute("href", "/inventario");

  await page.goto("/vender-propiedad");
  await expect(page.getByRole("heading", { name: "Antes de publicar." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Estimar gastos y neto de venta" })).toHaveAttribute("href", "/herramientas/gastos-de-cierre");

  for (const [route, heading] of [["residencial", "Habitarla"], ["comercial", "Costo de ocupar"], ["industrial", "Capacidad técnica"]]) {
    await page.goto(`/${route}`);
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test("retired zone URLs permanently resolve to inventory", async ({ page }) => {
  for (const route of ["/zonas", "/zonas/zona-rio"]) {
    const response = await page.request.get(route, { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe("/inventario");
  }
});

test("the footer reaches every property type from an interior page", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/blog");
  const footer = page.locator("footer");
  for (const route of ["residencial", "comercial", "industrial"]) {
    await expect(footer.locator(`a[href="/${route}"]`)).toHaveCount(1);
  }
  await footer.getByRole("link", { name: "Comercial", exact: true }).click();
  await expect(page).toHaveURL(/\/comercial$/);
  await expect(page.getByRole("heading", { name: "Costo de ocupar" })).toBeVisible();
});
