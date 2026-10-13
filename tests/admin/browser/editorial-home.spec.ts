import { expect, test } from "@playwright/test";

for (const viewport of [{ width: 375, height: 667 }, { width: 1440, height: 900 }]) {
  test(`editorial cover stays composed on scroll and keeps document and calculator routes usable at ${viewport.width}`, async ({ browser }) => {
    const context = await browser.newContext({ viewport, isMobile: viewport.width < 500, hasTouch: viewport.width < 500 });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.locator(".editorial-home h1")).toBeVisible();
    const sellerHeroLink = page.locator(".editorial-cover-actions").getByRole("link", { name: "Quiero vender mi propiedad" });
    await expect(sellerHeroLink).toHaveAttribute("href", "/vender-propiedad");
    const sellerGateway = page.locator(".editorial-seller-gateway");
    await expect(sellerGateway.getByRole("heading", { name: "¿Qué necesitas hacer?" })).toBeVisible();
    await sellerGateway.getByRole("link", { name: /Soy propietario/ }).click();
    await expect(page).toHaveURL(/\/vender-propiedad$/);
    await expect(page.getByRole("heading", { name: "Prepara tu propiedad para vender" })).toBeVisible();
    await page.goBack();
    await expect(page.locator("h1")).toHaveCSS("font-family", /Archivo/);
    const photo = page.locator(".editorial-cover-photo");
    await expect(page.locator(".editorial-cover-window")).toHaveCSS("opacity", "1");
    await expect(photo).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
    const before = await photo.evaluate((node) => getComputedStyle(node).transform);
    await page.evaluate(() => window.scrollTo({ top: 280, behavior: "instant" }));
    expect(await photo.evaluate((node) => getComputedStyle(node).transform)).toBe(before);
    await page.locator("#entregables").scrollIntoViewIfNeeded();
    await expect(page.locator("#entregables")).toBeInViewport();
    await expect(page.locator("#entregables article")).toHaveCount(6);
    await page.locator('footer a[href="/herramientas/hipoteca"]').click();
    await expect(page).toHaveURL(/\/herramientas\/hipoteca$/);
    await expect(page.getByRole("heading", { name: "Calculadora de hipoteca.", exact: true })).toBeVisible();
    await expect(page.locator("[data-page-curtain]")).toBeHidden();
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator(".editorial-home")).toBeAttached();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(photo).toHaveCSS("transform", "none");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await context.close();
  });
}
