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
    const hero = page.locator(".nx-hero");
    await expect(hero.locator("h1")).toHaveCount(1);
    await expect(hero.locator(".nx-eyebrow")).toHaveText("Inmobiliaria en Baja California");
    await expect(hero.locator("img")).toHaveCount(1);
    expect(await hero.locator("img").evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    // The header floats transparent over the photograph until the page scrolls.
    await expect(page.locator("header").first()).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    const search = hero.getByRole("search", { name: "Buscar propiedades" });
    const submit = search.getByRole("button", { name: "Buscar" });
    const seller = hero.getByRole("link", { name: /Pide una opinión de valor/ });
    await expect(seller).toHaveAttribute("href", "/vender-propiedad");
    await expect(submit).toHaveCSS("opacity", "1");
    for (const control of [search.locator(".nx-field").first(), submit, seller]) {
      const box = (await control.boundingBox())!;
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
    }
    await search.getByLabel("Operación").focus();
    await expect(search.locator(".nx-field").first()).toHaveCSS("outline-style", "solid");
    await page.screenshot({ path: testInfo.outputPath(`hero-${width}.png`) });
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    const menuPanel = page.locator('[role="dialog"][aria-label="Menú"]');
    await page.keyboard.press("Escape");
    // It leaves the accessibility tree at once while the circle closes visually.
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(menuPanel).toBeHidden();
    await expect(page.getByRole("button", { name: "Abrir menú" })).toBeFocused();
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await expect(page.locator("[data-menu-item]").last()).toHaveCSS("opacity", "1");
    await expect.poll(() => page.locator("[data-menu-item]").last().evaluate((node) => getComputedStyle(node).transform)).toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await page.getByRole("dialog").getByRole("link", { name: /Método/ }).click();
    await expect(page.locator("#metodo")).toBeInViewport();
    await expect(page.locator("#evaluar")).toHaveCount(0);
    await expect(page.locator('a[href$="#evaluar"]')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(hero.locator("img")).toHaveCSS("animation-name", "none");
    await expect(hero.locator(".nx-marquee-track")).toHaveCSS("animation-name", "none");
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Cambiar a tema oscuro" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.keyboard.press("Escape");
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
    if (theme === "dark") {
      await page.getByRole("button", { name: "Abrir menú" }).click();
      await page.getByRole("dialog").getByRole("button", { name: "Cambiar a tema oscuro" }).click();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);
    }
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(result.violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) }))).toEqual([]);
  }
});

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
  test(`hero fills the first screen and its marquee can pause at ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const hero = page.locator(".nx-hero");
    const box = (await hero.boundingBox())!;
    expect(box.y).toBe(0);
    expect(box.height).toBeGreaterThanOrEqual(viewport.height);
    const track = hero.locator(".nx-marquee-track");
    await expect(track).toHaveCSS("animation-play-state", "running");
    await hero.getByRole("button", { name: "Pausar el movimiento de zonas" }).click();
    await expect(track).toHaveCSS("animation-play-state", "paused");
    await hero.getByRole("button", { name: "Reanudar el movimiento de zonas" }).click();
    await expect(track).toHaveCSS("animation-play-state", "running");
    await page.screenshot({ path: testInfo.outputPath("cover.png") });
    await page.mouse.wheel(0, 400);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(300);
    await expect(page.locator("header").first()).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(track).toHaveCSS("animation-name", "none");
    await expect(hero.getByRole("button", { name: /movimiento de zonas/ })).toBeHidden();
  });
}

test("touch swipe scrolls past the hero using native scrolling", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const touch = await context.newCDPSession(page);
  await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 190, y: 720 }] });
  for (const y of [680, 640, 600, 560, 520, 480]) {
    await touch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 190, y }] });
    await page.waitForTimeout(40); // Pace physical input; this is not a layout wait.
  }
  await page.waitForTimeout(100);
  await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(100);
  expect((await page.locator(".nx-hero").boundingBox())!.y).toBeLessThan(0);
  await context.close();
});

test("hero remains readable before hydration with reduced motion and without JavaScript", async ({ browser }) => {
  for (const javaScriptEnabled of [false, true]) {
    const context = await browser.newContext({ javaScriptEnabled, reducedMotion: "reduce", viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("/");
    const hero = page.locator(".nx-hero");
    await expect(hero.locator("h1")).toHaveCSS("opacity", "1");
    await expect(hero.locator("img")).toHaveCSS("animation-name", "none");
    await hero.getByRole("link", { name: /Pide una opinión de valor/ }).click();
    await expect(page).toHaveURL(/\/vender-propiedad$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Prepara tu propiedad para vender.");
    await page.goto("/");
    await hero.getByRole("button", { name: "Buscar" }).click();
    // Without JavaScript the native form sends its empty fields; the catalog ignores them.
    await expect(page).toHaveURL(/\/inventario(\?op=&tipo=&zona=)?$/);
    expect(errors).toEqual([]);
    await context.close();
  }
});
