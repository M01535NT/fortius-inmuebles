import { expect, test } from "@playwright/test";

for (const width of [390, 1280]) {
  test(`share button copies public property URL at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 912 });
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
      Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (url: string) => { document.documentElement.dataset.copied = url; } } });
    });
    await page.goto("/inventario/residencia-vista-al-mar-renta");
    await page.getByRole("button", { name: "Compartir", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Enlace copiado");
    await expect(page.locator("html")).toHaveAttribute("data-copied", "https://fortiusinmuebles.com/inventario/residencia-vista-al-mar-renta");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Compartir", exact: true })).toHaveCount(0);
  });
}
