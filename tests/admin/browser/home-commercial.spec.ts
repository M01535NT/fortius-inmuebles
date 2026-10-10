import { expect, test } from "@playwright/test";

for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1000 }]) {
  test(`commercial home order and buyer/seller journeys at ${viewport.width}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const journeys = page.locator("#recorridos");
    await expect(journeys.getByRole("heading", { name: "¿Qué necesitas hacer?" })).toBeVisible();
    const order = await page.locator("main section, main .editorial-image-reveal").evaluateAll((nodes) => nodes.map((node) =>
      node.id || (node.classList.contains("editorial-hero") ? "hero" : node.classList.contains("editorial-image-reveal") ? "photo" : "unknown")));
    expect(order).toEqual(["hero", "recorridos", "destacadas", "especialidades", "por-que-fortius", "photo", "metodo", "entregables", "respuestas"]);
    await expect(journeys.getByRole("link", { name: /Soy propietario/ })).toHaveAttribute("href", "/vender-propiedad");
    await expect(journeys.getByRole("link", { name: /Busco un inmueble/ })).toHaveAttribute("href", "/inventario");
    await expect(page.locator("#destacadas [data-property-card]")).toHaveCount(3);
    await expect(page.locator("#destacadas").getByText(/Demostración/)).toHaveCount(3);
    await expect(page.locator("#destacadas").getByText("Apartada · Demostración", { exact: true })).toBeVisible();
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
    await journeys.getByRole("link", { name: /Soy propietario/ }).click();
    await expect(page).toHaveURL(/\/vender-propiedad$/);
    await expect(page.locator("#diagnostico form")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
