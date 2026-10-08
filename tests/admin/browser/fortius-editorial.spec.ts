import { expect, test } from "@playwright/test";

test("service strip can stay paused while the visitor continues navigating", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const strip = page.getByRole("button", { name: "Pausar banda de servicios" });
  await strip.click();
  await page.getByRole("button", { name: "Abrir menú" }).focus();
  await page.mouse.move(0, 0);
  await expect(page.locator(".hero-marquee-track")).toHaveCSS("animation-play-state", "paused");
  await page.getByRole("button", { name: "Reanudar banda de servicios" }).press("Enter");
  await page.getByRole("button", { name: "Abrir menú" }).focus();
  await expect(page.locator(".hero-marquee-track")).toHaveCSS("animation-play-state", "running");
});

test("dark link hover retains readable ink while buttons remain burgundy", async ({ page }) => {
  await page.goto("/terminos", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Cambiar a tema oscuro" }).click();
  const indexLink = page.locator('main a[href^="#"]').first();
  await indexLink.hover();
  await expect(indexLink).toHaveCSS("color", "rgb(245, 241, 235)");
});

for (const width of [390, 1440]) {
  test(`Fortius preserves brand colors and offers four useful menu routes at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });
    const logo = page.locator('header [role="img"]').first();
    const fills = () => logo.locator("path").evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).fill));
    const original = await fills();
    await page.getByRole("button", { name: "Cambiar a tema oscuro" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    expect(await fills()).toEqual(original);
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--primary").trim())).toBe("#8a1634");
    await page.getByRole("button", { name: "Abrir menú" }).click();
    const menu = page.getByRole("dialog", { name: "Menú", exact: true });
    const primary = menu.getByRole("navigation", { name: "Menú principal", exact: true });
    await expect(primary.getByRole("link")).toHaveCount(6);
    const shortcuts = menu.getByRole("navigation", { name: "Accesos destacados" });
    await expect(shortcuts.getByRole("link")).toHaveCount(4);
    const sell = shortcuts.getByRole("link", { name: /Vender propiedad/ });
    await sell.scrollIntoViewIfNeeded();
    await sell.click();
    await expect(page).toHaveURL(/\/vender-propiedad$/);
    await expect(menu).toBeHidden();
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Abrir menú" })).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });

  test(`home has a moving marquee, six timeline stages and a fixed image at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });
    const marquee = page.locator(".hero-marquee-track");
    await expect(marquee).toHaveCSS("animation-play-state", "running");
    const transform = await marquee.evaluate((node) => getComputedStyle(node).transform);
    await expect.poll(() => marquee.evaluate((node) => getComputedStyle(node).transform)).not.toBe(transform);
    const timeline = page.locator("[data-method-timeline]");
    await expect(timeline.locator("li")).toHaveCount(6);
    await expect(timeline.getByRole("heading", { name: "Cierre y entrega" })).toBeVisible();
    const photo = page.locator(".editorial-fixed-photo");
    await photo.scrollIntoViewIfNeeded();
    await expect(photo).toHaveCSS("position", "fixed");
    const top = await photo.evaluate((node) => node.getBoundingClientRect().top);
    await page.evaluate(() => window.scrollBy({ top: 150, behavior: "instant" }));
    expect(await photo.evaluate((node) => node.getBoundingClientRect().top)).toBe(top);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(marquee).toHaveCSS("animation-name", "none");
    await expect(timeline.locator("li").last()).toHaveCSS("opacity", "1");
    await expect(page.locator(".editorial-cover-title")).toBeVisible();
  });

  test(`property photographs use editorial proportions across the catalog at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/", "/inventario"]) {
      await page.goto(route);
      const photo = page.locator("[data-property-card] img").first();
      await expect(photo).toBeVisible();
      const box = await photo.boundingBox();
      expect(box!.width / box!.height).toBeCloseTo(30 / 41, 1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await page.locator("[data-property-card] a").first().click();
    await expect(page.locator(".property-gallery-photos")).toBeVisible();
    await expect(page.getByRole("link", { name: /Ficha técnica/ })).toBeVisible();
    const second = page.getByRole("button", { name: "Ver imagen 2", exact: true });
    if (await second.count()) {
      await second.click();
      await expect(second).toHaveAttribute("aria-pressed", "true");
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
