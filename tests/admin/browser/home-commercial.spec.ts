import { expect, test } from "@playwright/test";

for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1000 }]) {
  test(`commercial home order and buyer/seller journeys at ${viewport.width}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const order = await page.locator("main section").evaluateAll((nodes) => nodes.map((node) =>
      node.id || (node.classList.contains("nx-hero") ? "hero" : "unknown")));
    expect(order).toEqual(["hero", "que-hacemos", "metodo", "por-que-fortius", "comprar", "destacadas", "equipo", "recursos", "respuestas", "hablemos"]);
    // Clean cover (31/10/2026): video and a headline per scene, no buttons. Owners start from
    // «Qué hacemos», buyers from the «Comprar» band, and the page closes with a contact band.
    await expect(page.locator(".nx-hero").getByRole("search")).toHaveCount(0);
    await expect(page.locator(".nx-hero a")).toHaveCount(0);
    const seller = page.locator('#que-hacemos a[href="/vender-propiedad"]').first();
    await expect(seller).toBeAttached();
    await expect(page.locator("#comprar").getByRole("link", { name: "Ver propiedades" })).toHaveAttribute("href", "/inventario");
    await expect(page.locator("#hablemos").getByRole("link", { name: "Contáctanos" })).toHaveAttribute("href", "/contacto");
    await expect(page.locator("#destacadas [data-property-card]")).toHaveCount(3);
    await expect(page.locator("#destacadas").getByText(/de ejemplo$/)).toHaveCount(3);
    await expect(page.locator("#destacadas").getByText("Apartada de ejemplo", { exact: true })).toBeVisible();
    await expect(page.locator("[data-method-timeline] li")).toHaveCount(5);
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
    await seller.scrollIntoViewIfNeeded();
    await seller.click();
    await expect(page).toHaveURL(/\/vender-propiedad$/);
    await page.getByRole("link", { name: "Agendar entrevista" }).click();
    await expect(page).toHaveURL(/\/vender-propiedad\/?#diagnostico$/);
    await expect(page.locator("#diagnostico form")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
