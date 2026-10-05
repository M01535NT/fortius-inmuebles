import { expect, test } from "@playwright/test";

test("theme nonce survives browser hiding without hydration errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", message => { if (/hydration|hydrated|didn't match/i.test(message.text())) errors.push(message.text()); });
  await page.setViewportSize({ width: 419, height: 912 });
  const response = await page.goto("/inventario/residencia-vista-al-mar-renta");
  await page.waitForLoadState("networkidle");
  const nonce = response!.headers()["content-security-policy"].match(/'nonce-([^']+)'/)![1];
  expect(await page.evaluate(() => Array.from(document.scripts).find(el => el.textContent?.includes("fortius-inmuebles-theme"))?.nonce)).toBe(nonce);
  await page.getByRole("button", { name: "Cambiar a tema oscuro" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  const dock = page.locator('[aria-label="Contacto del inmueble"]');
  await expect(dock.getByRole("button", { name: /Llamar/ })).toBeDisabled();
  await expect(dock.getByRole("button", { name: /WhatsApp/ })).toBeDisabled();
  await expect(dock.getByText("Agendar visita")).toHaveCount(0);
  expect(errors).toEqual([]);
});
