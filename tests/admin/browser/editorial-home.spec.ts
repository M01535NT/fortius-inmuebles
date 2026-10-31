import { expect, test } from "@playwright/test";

for (const viewport of [{ width: 375, height: 667 }, { width: 1440, height: 900 }]) {
  test(`night home leads to the inventory and keeps document and calculator routes usable at ${viewport.width}`, async ({ browser }) => {
    const context = await browser.newContext({ viewport, isMobile: viewport.width < 500, hasTouch: viewport.width < 500 });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.locator(".nocturno-home h1")).toBeVisible();
    // The public site uses Schibsted Grotesk; the panel keeps Archivo (30/10/2026).
    await expect(page.locator("h1")).toHaveCSS("font-family", /Schibsted Grotesk/);
    // Clean cover (31/10/2026): no buttons on the hero; owners start from «Qué hacemos».
    await expect(page.locator(".nx-hero a")).toHaveCount(0);
    await expect(page.locator('#que-hacemos a[href="/vender-propiedad"]').first()).toBeAttached();
    // The buyer band opens the inventory.
    const inventory = page.locator("#comprar").getByRole("link", { name: "Ver propiedades" });
    await inventory.scrollIntoViewIfNeeded();
    await inventory.click();
    await expect(page).toHaveURL(/\/inventario$/);
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
    await expect.poll(() => page.locator(".nx-hero-media video").evaluate((video: HTMLVideoElement) => video.paused)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await context.close();
  });
}
