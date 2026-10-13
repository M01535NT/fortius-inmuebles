import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

test("mobile performance budget across three cold loads", async () => {
  test.skip(process.env.FORTIUS_INMUEBLES_RUN_LIGHTHOUSE !== "true", "Opt-in measurement; run with FORTIUS_INMUEBLES_RUN_LIGHTHOUSE=true.");
  test.setTimeout(240000);
  try {
    await promisify(execFile)(process.execPath, ["tools/public-performance.mjs", "http://127.0.0.1:3100"], { windowsHide: true });
  } catch (error) {
    const failure = error as Error & { stdout?: string; stderr?: string };
    throw new Error(`${failure.message}\n${failure.stdout ?? ""}\n${failure.stderr ?? ""}`);
  }
});

for (const width of [320, 375, 390, 768, 1024, 1280, 1440]) {
  test(`animated homepage remains readable and usable at ${width}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("La venta empieza antes del anuncio.");
    await expect(page.getByRole("button", { name: /Pausar imágenes|Reanudar imágenes/ })).toHaveCount(0);
    const hero = page.locator(".editorial-hero");
    await expect(hero.locator("h1")).toHaveCount(1);
    await expect(hero.locator("button, .hero-marquee")).toHaveCount(0);
    await expect(hero.locator(".editorial-cover-eyebrow")).toHaveText("INMOBILIARIA EN BAJA CALIFORNIA");
    await expect(hero.locator(".editorial-cover-description")).toHaveText("Analizamos el mercado, revisamos la documentación y coordinamos contigo cada etapa de la comercialización de tu propiedad.");
    await expect(hero.locator(".editorial-cover-window")).toHaveCSS("opacity", "1");
    await expect(hero.locator("img")).toHaveCount(1);
    expect(await hero.locator("img").evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    const primary = hero.getByRole("link", { name: "Quiero vender mi propiedad", exact: true });
    const secondary = hero.getByRole("link", { name: "Ver propiedades", exact: true });
    await expect(primary).toHaveAttribute("href", "/vender-propiedad");
    await expect(secondary).toHaveAttribute("href", "/inventario");
    await expect(primary).toHaveCSS("opacity", "1");
    await expect(secondary).toHaveCSS("opacity", "1");
    const copy = (await hero.locator(".editorial-cover-copy").boundingBox())!;
    const photo = (await hero.locator("figure").boundingBox())!;
    expect(photo.y).toBeGreaterThanOrEqual(copy.y + copy.height);
    if (width >= 768) expect((await primary.boundingBox())!.y + (await primary.boundingBox())!.height).toBeLessThanOrEqual(900);
    for (const link of [primary, secondary]) {
      const box = (await link.boundingBox())!;
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
    }
    await primary.focus();
    await expect(primary).toHaveCSS("outline-style", "solid");
    await page.keyboard.press("Tab");
    await expect(secondary).toBeFocused();
    await secondary.hover();
    await page.screenshot({ path: testInfo.outputPath(`hero-${width}.png`) });
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    // Closing must remain animated, and an interrupted entrance must reopen fully.
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByRole("button", { name: "Abrir menú" })).toBeFocused();
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await expect(page.locator("[data-menu-item]").last()).toHaveCSS("opacity", "1");
    await expect(page.locator("[data-menu-item]").last()).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await page.getByRole("dialog").getByRole("link", { name: /Método/ }).click();
    await expect(page.locator("#metodo")).toBeInViewport();
    await expect(page.locator("#evaluar")).toHaveCount(0);
    await expect(page.locator('a[href$="#evaluar"]')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(hero.locator(".editorial-cover-photo")).toHaveCSS("transform", "none");
    await expect(hero.locator(".editorial-cover-window")).toHaveCSS("clip-path", "none");
    await expect(page.getByRole("button", { name: /Pausar imágenes|Reanudar imágenes/ })).toHaveCount(0);
    await page.getByRole("button", { name: "Cambiar a tema oscuro" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.getByRole("link", { name: "Fortius Inmuebles, inicio" }).click();
    await page.screenshot({ path: testInfo.outputPath(`dark-reduced-${width}.png`) });
    await page.getByRole("link", { name: "Acceso al panel" }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("heading", { name: "Acceso al panel" })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("public homepage passes automatic WCAG AA checks in both themes", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  for (const theme of ["light", "dark"]) {
    if (theme === "dark") await page.getByRole("button", { name: "Cambiar a tema oscuro" }).click();
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(result.violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) }))).toEqual([]);
  }
});

test("hero remains readable before hydration with reduced motion and without JavaScript", async ({ browser }) => {
  for (const javaScriptEnabled of [false, true]) {
    const context = await browser.newContext({ javaScriptEnabled, reducedMotion: "reduce", viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("/");
    const hero = page.locator(".editorial-hero");
    await expect(hero.locator("h1")).toHaveCSS("opacity", "1");
    await expect(hero.locator(".editorial-cover-window")).toHaveCSS("opacity", "1");
    await expect(hero.locator(".editorial-cover-photo")).toHaveCSS("transform", "none");
    await hero.getByRole("link", { name: "Quiero vender mi propiedad", exact: true }).click();
    await expect(page).toHaveURL(/\/vender-propiedad$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Prepara tu propiedad para vender");
    await page.goto("/");
    await hero.getByRole("link", { name: "Ver propiedades", exact: true }).click();
    await expect(page).toHaveURL(/\/inventario$/);
    expect(errors).toEqual([]);
    await context.close();
  }
});
