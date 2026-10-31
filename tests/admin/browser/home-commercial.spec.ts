import { expect, test } from "@playwright/test";

for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1000 }]) {
  test(`commercial home order and buyer/seller journeys at ${viewport.width}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const order = await page.locator("main section").evaluateAll((nodes) => nodes.map((node) =>
      node.id || (node.classList.contains("nx-hero") ? "hero" : "unknown")));
    expect(order).toEqual(["hero", "que-hacemos", "metodo", "por-que-fortius", "comprar", "destacadas", "equipo", "recursos", "respuestas"]);
    // The hero carries the video, one sentence and the two journeys; owners start from «Quiero vender».
    await expect(page.locator(".nx-hero").getByRole("search")).toHaveCount(0);
    const seller = page.locator(".nx-hero").getByRole("link", { name: "Quiero vender" });
    await expect(seller).toHaveAttribute("href", "/vender-propiedad");
    await expect(page.locator(".nx-hero").getByRole("link", { name: "Quiero comprar" })).toHaveAttribute("href", "/inventario");
    await expect(page.locator("#destacadas [data-property-card]")).toHaveCount(3);
    await expect(page.locator("#destacadas").getByText(/de ejemplo$/)).toHaveCount(3);
    await expect(page.locator("#destacadas").getByText("Apartada de ejemplo", { exact: true })).toBeVisible();
    await expect(page.locator("[data-method-timeline] li")).toHaveCount(4);
    await expect(page.locator("#entregables article")).toHaveCount(6);
    await expect(page.locator("main .editorial-tools")).toHaveCount(0);
    await expect(page.locator("footer").getByRole("heading", { name: "¿Vendes o compras? Hablemos." })).toBeVisible();

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
    await page.getByRole("link", { name: "Empezar evaluación" }).click();
    await expect(page).toHaveURL(/\/vender-propiedad\/?#diagnostico$/);
    await expect(page.locator("#diagnostico form")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
