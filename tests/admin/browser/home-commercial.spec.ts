import { expect, test } from "@playwright/test";

for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1000 }]) {
  test(`commercial home order and buyer/seller journeys at ${viewport.width}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const hero = page.locator(".nx-hero");
    const order = await page.locator("main section").evaluateAll((nodes) => nodes.map((node) =>
      node.id || (node.classList.contains("nx-hero") ? "hero" : "unknown")));
    expect(order).toEqual(["hero", "por-que-fortius", "metodo", "revision", "opinion", "promocion", "destacadas", "segmentos", "comprar", "equipo", "recursos", "respuestas"]);
    // Buyers start with the search; owners with the valuation link.
    await expect(hero.getByRole("search", { name: "Buscar propiedades" })).toHaveAttribute("action", "/inventario");
    const seller = hero.getByRole("link", { name: /Pide tu opinión de valor/ });
    await expect(seller).toHaveAttribute("href", "/vender-propiedad#diagnostico");
    await expect(page.locator("#destacadas [data-property-card]")).toHaveCount(3);
    await expect(page.locator("#destacadas").getByText(/de ejemplo$/)).toHaveCount(3);
    await expect(page.locator("#destacadas").getByText("Apartada de ejemplo", { exact: true })).toBeVisible();
    await expect(page.locator("[data-method-timeline] li")).toHaveCount(6);
    await expect(page.locator("#entregables article")).toHaveCount(6);
    await expect(page.locator("main .editorial-tools")).toHaveCount(0);
    await expect(page.locator("footer").getByRole("heading", { name: "Hablemos de tu próxima operación." })).toBeVisible();

    const costs = page.locator("#respuestas").getByRole("button", { name: "¿Qué gastos debo considerar al vender?" });
    await costs.click();
    await expect(costs).toHaveAttribute("aria-expanded", "true");
    const calculator = page.locator("#respuestas").getByRole("link", { name: "Estimar gastos de cierre" });
    await expect(calculator).toBeVisible();
    await expect(calculator).toHaveAttribute("href", "/herramientas/gastos-de-cierre");
    await costs.click();
    await expect(calculator).toBeHidden();

    await page.locator("#respuestas").getByRole("button", { name: "¿Dónde consulto las propiedades?" }).click();
    await page.locator("#respuestas").getByRole("link", { name: "Explorar propiedades" }).click();
    await expect(page).toHaveURL(/\/inventario$/);
    await expect(page.locator("[data-page-curtain]")).toBeHidden();
    await page.goBack();
    await seller.click();
    await expect(page).toHaveURL(/\/vender-propiedad$/);
    await expect(page.locator("#diagnostico form")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
