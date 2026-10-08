import { expect, test } from "@playwright/test";

for (const viewport of [{ width: 375, height: 667 }, { width: 1440, height: 900 }]) {
  test(`editorial cover responds to scroll and keeps document and calculator routes usable at ${viewport.width}`, async ({ browser }) => {
    const context = await browser.newContext({ viewport, isMobile: viewport.width < 500, hasTouch: viewport.width < 500 });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.locator(".editorial-home h1")).toBeVisible();
    const sellerHeroLink = page.locator(".editorial-cover-actions").getByRole("link", { name: "Quiero vender mi propiedad" });
    await expect(sellerHeroLink).toHaveAttribute("href", "/vender-propiedad");
    const sellerGateway = page.locator(".editorial-seller-gateway");
    await expect(sellerGateway.getByRole("heading", { name: "¿Tienes una propiedad para vender?" })).toBeVisible();
    await sellerGateway.getByRole("link", { name: "Ver cómo vender mi propiedad" }).click();
    await expect(page).toHaveURL(/\/vender-propiedad$/);
    await expect(page.getByRole("heading", { name: "Antes de publicar." })).toBeVisible();
    await page.goBack();
    await expect(page.locator("h1")).toHaveCSS("font-family", /Archivo/);
    const photo = page.locator(".editorial-cover-depth");
    const before = await photo.evaluate((node) => getComputedStyle(node).transform);
    await page.evaluate(() => window.scrollTo({ top: 280, behavior: "instant" }));
    await expect.poll(() => photo.evaluate((node) => getComputedStyle(node).transform)).not.toBe(before);
    await page.locator("footer").getByRole("link", { name: "Entregables", exact: true }).click();
    await expect(page.locator("#entregables")).toBeInViewport();
    await expect(page.locator("#entregables article")).toHaveCount(6);
    await page.locator('main a[href="/herramientas/hipoteca"]').click();
    await expect(page).toHaveURL(/\/herramientas\/hipoteca$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.goBack();
    await expect(page.locator(".editorial-home")).toBeAttached();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(photo).toHaveCSS("transform", "none");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await context.close();
  });
}
