import { test, expect } from "@playwright/test";

for (const width of [390, 1440]) {
  test(`public pages preserve navigation, theme, inventory and contact form at ${width}`, async ({ page }, testInfo) => {
    test.setTimeout(90000);
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const warnings: string[] = [];
    page.on("console", (message) => { if (message.text().includes("data-scroll-behavior")) warnings.push(message.text()); });
    await page.goto("/");
    // Exercise the hydrated controls, not the still-streaming SSR preview.
    await page.waitForLoadState("networkidle");
    await expect(page.locator("html")).toHaveAttribute("data-scroll-behavior", "smooth");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: "Imagen 1", exact: true })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Imagen 2", exact: true }).click();
    await expect(page.getByRole("button", { name: "Imagen 2", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("link", { name: "Ver propiedades", exact: true }).locator("..")).toHaveCSS("opacity", "1");
    await page.screenshot({ path: testInfo.outputPath(`home-light-${width}.png`) });
    await page.getByRole("button", { name: "Cambiar a tema oscuro" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.screenshot({ path: testInfo.outputPath(`home-dark-${width}.png`) });
    await page.getByRole("button", { name: "Abrir menú" }).click();
    const menu = page.getByRole("dialog");
    await expect(menu.locator('a[href="/admin"]')).toHaveCount(0);
    await page.screenshot({ path: testInfo.outputPath(`menu-${width}.png`) });
    await page.keyboard.press("Escape");
    await page.goto("/inventario");
    await expect(page.locator("html")).toHaveClass(/dark/);
    const firstProperty = page.locator('a[href^="/inventario/"]').first();
    await expect(firstProperty).toBeVisible();
    await firstProperty.click();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`detail-${width}.png`) });
    await page.goto("/contacto");
    await page.waitForLoadState("networkidle");
    let saved = false;
    let fail = true;
    await page.route("**/api/leads", async (route) => {
      expect(route.request().method()).toBe("POST");
      if (fail) return route.fulfill({ status: 503, json: { error: "No persistido" } });
      const data = route.request().postDataJSON();
      expect(data.nombre).toBe("Prueba local");
      saved = true;
      return route.fulfill({ status: 201, json: { id: "local-acknowledged" } });
    });
    await page.getByText("Prefiero dejar mis datos en un formulario", { exact: true }).click();
    await page.getByLabel("Nombre", { exact: true }).fill("Prueba local");
    await page.getByLabel("Teléfono o WhatsApp").fill("6641234567");
    await page.getByRole("button", { name: "Solicitar evaluación" }).click();
    await expect(page.locator("form").getByRole("alert")).toContainText("No pudimos enviar tus datos");
    await expect(page.getByLabel("Nombre", { exact: true })).toHaveValue("Prueba local");
    expect(saved).toBe(false);
    await page.screenshot({ path: testInfo.outputPath(`form-error-${width}.png`) });
    fail = false;
    await page.getByRole("button", { name: "Solicitar evaluación" }).click();
    await expect(page.getByRole("heading", { name: "Recibimos tu solicitud." })).toBeVisible();
    expect(saved).toBe(true);
    await expect(page.getByText("WhatsApp: por confirmar")).toBeVisible();
    expect(warnings).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`form-success-${width}.png`) });
  });
}
