import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const width of [375, 414, 768, 1024, 1440]) {
  test(`magazine, filters and separated cards work at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 950 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/blog");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Blog");
    await expect(page.getByRole("region", { name: "Artículo destacado" })).toBeVisible();
    const cards = page.getByRole("region", { name: "Para seguir leyendo" }).locator("article");
    const a = await cards.nth(0).boundingBox();
    const b = await cards.nth(1).boundingBox();
    expect(a).not.toBeNull(); expect(b).not.toBeNull();
    expect(b!.x >= a!.x + a!.width + 16 || b!.y >= a!.y + a!.height + 16).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`mercado-${width}.png`), fullPage: true });
    await page.screenshot({ path: testInfo.outputPath(`portada-${width}.png`) });
    if (width === 375 || width === 1440) {
      const axe = await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      expect(axe.violations).toEqual([]);
    }
    await page.getByRole("navigation", { name: "Tipo de contenido" }).getByRole("link", { name: "Actualidad" }).click();
    await expect(page.getByRole("navigation", { name: "Tipo de contenido" }).getByRole("link", { name: "Actualidad" })).toHaveAttribute("aria-current", "page");
    await page.getByLabel("Buscar un tema").fill("CREDITO");
    await page.getByLabel("Tema", { exact: true }).selectOption("mercado");
    await page.getByRole("button", { name: "Buscar", exact: true }).click();
    // The unsearched Actualidad fixture also has one result. Wait for the submitted
    // URL before reloading, otherwise the reload can cancel the pending navigation.
    await expect(page).toHaveURL((url) => url.pathname === "/blog" && url.searchParams.get("tipo") === "actualidad" && url.searchParams.get("q") === "CREDITO" && url.searchParams.get("tema") === "mercado");
    await expect(page.getByRole("status")).toContainText("1 artículo");
    await expect(page.locator("main article")).toHaveCount(1);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    const filteredUrl = page.url();
    await page.reload();
    await expect(page.getByLabel("Buscar un tema")).toHaveValue("CREDITO");
    await page.locator("main article a").click();
    await expect(page.getByRole("link", { name: "Fuente de prueba" })).toHaveAttribute("href", "https://example.com/informe");
    await expect(page.getByText("Publicado el", { exact: false })).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(filteredUrl);
    await page.getByLabel("Buscar un tema").fill("sin-coincidencias");
    await page.getByRole("button", { name: "Buscar", exact: true }).click();
    await expect(page.getByRole("heading", { name: "No encontramos artículos con esos filtros." })).toBeVisible();
    await page.getByRole("link", { name: "Limpiar filtros" }).first().click();
    await expect(page.getByRole("region", { name: "Artículo destacado" })).toBeVisible();
    await expect(page.getByLabel("Buscar un tema")).toHaveValue("");
    await expect(page.getByLabel("Tema", { exact: true })).toHaveValue("");
    await page.getByRole("link", { name: "Siguiente", exact: true }).click();
    await expect(page.getByText("Página 2 de 2")).toBeVisible();
    await page.goto("/blog");
    await page.getByRole("button", { name: "Cambiar a tema oscuro" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    if (width === 375 || width === 1440) {
      await page.screenshot({ path: testInfo.outputPath(`mercado-oscuro-${width}.png`), fullPage: true });
      const axe = await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      expect(axe.violations).toEqual([]);
    }
    expect(errors).toEqual([]);
  });
}

test("search and filters also work without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3100/blog?tipo=actualidad");
  await page.getByRole("link", { name: "Vista de lista", exact: true }).click();
  await page.getByLabel("Buscar un tema").fill("credito");
  await page.getByLabel("Desde", { exact: true }).fill("2026-09-23");
  await page.getByLabel("Hasta", { exact: true }).fill("2026-09-23");
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(page.locator("main article")).toHaveCount(1);
  await expect(page.getByRole("status")).toContainText("1 artículo");
  await expect(page.getByRole("link", { name: "Vista de lista", exact: true })).toHaveAttribute("aria-current", "page");
  await context.close();
});

for (const width of [375, 1440]) {
  test(`date range, ordering and view switching preserve results at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 950 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/blog");
    await page.getByLabel("Desde", { exact: true }).fill("2026-09-18");
    await page.getByLabel("Hasta", { exact: true }).fill("2026-09-20");
    await page.getByLabel("Ordenar por").selectOption("antiguos");
    await page.getByRole("button", { name: "Buscar", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("3 artículos · Más antiguos primero");
    const cards = page.locator("main article");
    const dates = async () => cards.locator("time").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("datetime")));
    expect(await dates()).toEqual(["2026-09-18T18:00:00Z", "2026-09-19T18:00:00Z", "2026-09-20T18:00:00Z"]);
    const titles = await cards.locator("h2").allTextContents();
    await page.getByRole("link", { name: "Vista de lista", exact: true }).click();
    await expect(page.getByRole("link", { name: "Vista de lista", exact: true })).toHaveAttribute("aria-current", "page");
    expect(await cards.locator("h2").allTextContents()).toEqual(titles);
    expect(await dates()).toEqual(["2026-09-18T18:00:00Z", "2026-09-19T18:00:00Z", "2026-09-20T18:00:00Z"]);
    const first = await cards.nth(0).boundingBox();
    const second = await cards.nth(1).boundingBox();
    expect(first).not.toBeNull(); expect(second).not.toBeNull();
    expect(second!.x).toBe(first!.x);
    expect(second!.y).toBeGreaterThanOrEqual(first!.y + first!.height + 8);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`lista-${width}.png`), fullPage: true });
    const axe = await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(axe.violations).toEqual([]);
    const listUrl = page.url();
    const articleHref = await cards.first().locator("a").getAttribute("href");
    await cards.first().locator("a").click();
    await expect(page).toHaveURL((url) => url.pathname === articleHref);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(titles[0]);
    await page.goBack();
    await expect(page).toHaveURL(listUrl);
    await expect(page.getByLabel("Desde", { exact: true })).toHaveValue("2026-09-18");
    await expect(page.getByLabel("Hasta", { exact: true })).toHaveValue("2026-09-20");
    await expect(page.getByLabel("Ordenar por")).toHaveValue("antiguos");
    await page.getByRole("link", { name: "Vista de cuadrícula", exact: true }).click();
    await expect(page.getByRole("link", { name: "Vista de cuadrícula", exact: true })).toHaveAttribute("aria-current", "page");
    expect(await cards.locator("h2").allTextContents()).toEqual(titles);
    await page.getByRole("link", { name: "Vista de lista", exact: true }).click();
    await page.getByRole("link", { name: "Limpiar filtros" }).first().click();
    await expect(page.getByRole("status")).toContainText("13 artículos");
    await expect(page.getByRole("link", { name: "Vista de lista", exact: true })).toHaveAttribute("aria-current", "page");
    await page.getByLabel("Desde", { exact: true }).fill("2026-09-09");
    await page.getByLabel("Hasta", { exact: true }).fill("2026-09-23");
    await page.getByLabel("Ordenar por").selectOption("antiguos");
    await page.getByRole("button", { name: "Buscar", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("13 artículos · Más antiguos primero");
    await page.getByRole("link", { name: "Siguiente", exact: true }).click();
    await expect(page.getByText("Página 2 de 2")).toBeVisible();
    await expect(page.getByRole("link", { name: "Vista de lista", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(page.locator("main article")).toHaveCount(4);
    await expect(page.getByLabel("Desde", { exact: true })).toHaveValue("2026-09-09");
    await expect(page.getByLabel("Hasta", { exact: true })).toHaveValue("2026-09-23");
    await expect(page.getByLabel("Ordenar por")).toHaveValue("antiguos");
    await page.goto("/blog?desde=2026-09-30&hasta=2026-09-01&vista=lista");
    await expect(page.locator("main").getByRole("alert")).toHaveText("La fecha desde debe ser anterior o igual a la fecha hasta.");
    await expect(page.getByLabel("Desde", { exact: true })).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("main article")).toHaveCount(0);
    await page.getByLabel("Hasta", { exact: true }).fill("2026-10-01");
    await page.getByLabel("Desde", { exact: true }).fill("2026-09-23");
    await page.getByRole("button", { name: "Buscar", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("1 artículo");
    await expect(page.locator("main").getByRole("alert")).toHaveCount(0);
    await page.getByRole("button", { name: "Cambiar a tema oscuro" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    const darkAxe = await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(darkAxe.violations).toEqual([]);
  });
}
