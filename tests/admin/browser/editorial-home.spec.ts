import { expect, test } from "@playwright/test";

for (const viewport of [{ width: 375, height: 667 }, { width: 1440, height: 900 }]) {
  test(`night home searches the inventory and keeps document and calculator routes usable at ${viewport.width}`, async ({ browser }) => {
    const context = await browser.newContext({ viewport, isMobile: viewport.width < 500, hasTouch: viewport.width < 500 });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.locator(".nocturno-home h1")).toBeVisible();
    await expect(page.locator("h1")).toHaveCSS("font-family", /Archivo/);
    const seller = page.locator(".nx-hero").getByRole("link", { name: /Pide una opinión de valor/ });
    await expect(seller).toHaveAttribute("href", "/vender-propiedad");
    const search = page.getByRole("search", { name: "Buscar propiedades" });
    await search.getByLabel("Operación").selectOption("venta");
    await search.getByRole("button", { name: "Buscar" }).click();
    await expect(page).toHaveURL(/\/inventario\?op=venta$/);
    await expect(page.getByRole("group", { name: "Operación", exact: true }).getByRole("button", { name: "Venta", exact: true })).toHaveAttribute("aria-pressed", "true");
    await page.goBack();
    await expect(page.locator(".nocturno-home")).toBeAttached();
    await page.locator("#entregables").scrollIntoViewIfNeeded();
    await expect(page.locator("#entregables")).toBeInViewport();
    await expect(page.locator("#entregables article")).toHaveCount(6);
    await page.locator('footer a[href="/herramientas/hipoteca"]').click();
    await expect(page).toHaveURL(/\/herramientas\/hipoteca$/);
    await expect(page.getByRole("heading", { name: "Calculadora de hipoteca.", exact: true })).toBeVisible();
    await expect(page.locator("[data-page-curtain]")).toBeHidden();
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(page.locator(".nx-hero-media img")).toHaveCSS("animation-name", "none");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await context.close();
  });
}
