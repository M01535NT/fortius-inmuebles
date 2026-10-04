import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("the method remains readable on touch screens and shows reading progress", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto("/");
  const progress = page.getByRole("progressbar", { name: "Avance de lectura" });
  await expect(progress).toBeAttached();
  await page.getByRole("button", { name: "Abrir menú" }).click();
  await page.getByRole("dialog").getByRole("link", { name: /Método/ }).click();
  const cards = page.locator("#metodo [data-method-card]");
  await expect(cards).toHaveCount(4);
  for (const title of ["Captación", "Preparación", "Comercialización", "Cierre"]) {
    const card = cards.filter({ has: page.getByRole("heading", { name: title, exact: true }) });
    await card.scrollIntoViewIfNeeded();
    await expect(card.getByRole("heading", { name: title, exact: true })).toBeVisible();
    expect(await card.evaluate((node) => node.scrollHeight <= node.clientHeight + 1)).toBe(true);
  }
  await expect.poll(async () => Number(await progress.getAttribute("aria-valuenow"))).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator("[data-custom-cursor]")).toHaveCount(0);
  await context.close();
});

test("reduced motion keeps all phases in normal reading order and navigation usable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const cards = page.locator("#metodo [data-method-card]");
  await expect(cards).toHaveCount(4);
  for (const card of await cards.all()) {
    expect(await card.evaluate((node) => getComputedStyle(node).position)).not.toBe("sticky");
    await card.scrollIntoViewIfNeeded();
    await expect(card.getByRole("heading")).toBeVisible();
  }
  await expect(page.locator("[data-custom-cursor]")).toHaveCount(0);
  await page.getByRole("link", { name: "Fortius Inmuebles, inicio" }).click();
  await page.getByRole("link", { name: "Ver propiedades", exact: true }).click();
  await expect(page).toHaveURL(/\/inventario$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("desktop property interaction and route curtain preserve functional navigation", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  const property = page.locator("[data-property-card]").first();
  await property.scrollIntoViewIfNeeded();
  const image = property.locator("a").first();
  await image.hover();
  await expect(page.locator("[data-custom-cursor]")).toBeVisible();
  await expect(page.locator("[data-custom-cursor]")).toHaveCSS("opacity", "1");
  await expect(page.locator("[data-custom-cursor]")).toContainText("Ver");
  for (const theme of ["light", "dark"]) {
    if (theme === "dark") await page.getByRole("button", { name: "Cambiar a tema oscuro" }).click();
    await image.hover();
    // GSAP entrances run on ancestors and are separate from native transitions.
    await expect.poll(() => page.locator("[data-property-card]").evaluateAll((cards) => cards.every((card) => {
      for (let node: Element | null = card; node; node = node.parentElement) {
        if (Number(getComputedStyle(node).opacity) < 1) return false;
      }
      return true;
    }))).toBe(true);
    // Changing theme can replace transitions and reject their finished promises.
    await expect.poll(() => property.evaluate((node) =>
      node.getAnimations({ subtree: true }).filter((animation) => animation.pending || animation.playState === "running").length,
    )).toBe(0);
    const hoverResult = await new AxeBuilder({ page }).include("[data-property-card]").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(hoverResult.violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) }))).toEqual([]);
  }
  await image.click();
  await expect(page).toHaveURL(/\/inventario\/.+$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("[data-page-curtain]")).toHaveCSS("visibility", "hidden");
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
});

test("entering admin through a public link removes public motion and restores it on back", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("progressbar", { name: "Avance de lectura" })).toBeAttached();
  await page.getByRole("link", { name: "Acceso al panel", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Acceso al panel", exact: true })).toBeVisible();
  await expect(page.locator(".public-experience, [data-page-curtain], [data-custom-cursor], .reading-progress")).toHaveCount(0);
  await page.goBack();
  await expect(page.getByRole("progressbar", { name: "Avance de lectura" })).toBeAttached();
});

test("reading progress follows the new page height after inventory filtering", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/inventario");
  const progress = page.getByRole("progressbar", { name: "Avance de lectura" });
  await expect(page.locator("[data-property-card]")).toHaveCount(3);
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
  await expect(progress).toHaveAttribute("aria-valuenow", "100");
  await page.getByRole("group", { name: "Operación", exact: true }).getByRole("button", { name: "Renta", exact: true }).click();
  await expect(page.locator("[data-property-card]")).toHaveCount(1);
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
  await expect(progress).toHaveAttribute("aria-valuenow", "100");
});

for (const viewport of [{ width: 375, height: 667 }, { width: 390, height: 844 }]) {
test(`stacked phases keep readable text contrast during animated phone scrolling at ${viewport.width}x${viewport.height}`, async ({ browser }) => {
  const context = await browser.newContext({ viewport, isMobile: true, hasTouch: true, reducedMotion: "no-preference" });
  const page = await context.newPage();
  await page.goto("/");
  const cards = page.locator("#metodo [data-method-card]");
  await expect(cards.first()).toHaveCSS("position", "sticky");
  await cards.nth(1).evaluate((node) => window.scrollTo({ top: window.scrollY + node.getBoundingClientRect().top - 300, behavior: "instant" }));
  await expect.poll(() => cards.first().evaluate((node) => new DOMMatrixReadOnly(getComputedStyle(node).transform).a)).toBeLessThan(1);
  await expect(cards.first().locator(".method-card-content")).toHaveCSS("opacity", "1");
  const result = await new AxeBuilder({ page }).include("#metodo").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(result.violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) }))).toEqual([]);
  await context.close();
});
}
