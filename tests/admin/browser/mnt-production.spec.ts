import { expect, test } from "@playwright/test";

test("production security headers use a nonce without browser CSP violations", async ({ page }) => {
  const violations: string[] = [];
  page.on("console", (message) => {
    if (/content security policy|refused to (execute|load|apply)/i.test(message.text())) violations.push(message.text());
  });
  const response = await page.goto("/contacto");
  expect(response?.headers()["content-security-policy"]).toMatch(/script-src 'self' 'nonce-[^']+' 'strict-dynamic'/);
  expect(response?.headers()["x-frame-options"]).toBe("DENY");
  expect(response?.headers()["x-content-type-options"]).toBe("nosniff");
  await expect(page).toHaveTitle(/MNT Inmuebles/);
  expect((await page.locator("head script").allTextContents()).join(" ")).toContain("mnt-theme");
  await page.waitForLoadState("networkidle");
  expect(violations).toEqual([]);
});

test("disabled public leads remain explicit after hydration", async ({ page }) => {
  await page.goto("/contacto");
  await page.getByText("Prefiero dejar mis datos en un formulario", { exact: true }).click();
  await expect(page.getByText("Recepción de solicitudes no disponible en este momento.").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Solicitar evaluación" })).toBeDisabled();
});

test("admin renders independently while the public backend is unavailable", async ({ page }) => {
  const response = await page.goto("/admin");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Acceso al panel" })).toBeVisible();
});

test("MNT fullscreen menu traps keyboard focus and restores its trigger", async ({ page }) => {
  await page.goto("/contacto");
  const trigger = page.getByRole("button", { name: "Abrir menú" });
  await trigger.focus();
  await trigger.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Menú" });
  await expect(dialog.getByRole("img", { name: "MNT Inmuebles" })).toBeVisible();
  const close = dialog.getByRole("button", { name: "Cerrar menú" });
  await expect(close).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("link", { name: "Privacidad" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});

test("health and inventory expose backend unavailability without a false empty result", async ({ page }) => {
  const health = await page.request.get("/api/health");
  expect(health.status()).toBe(503);
  expect(await health.json()).toEqual({ status: "unavailable" });
  await page.goto("/inventario");
  await expect(page.getByRole("heading", { name: "No pudimos cargar esta página." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Reintentar" })).toBeVisible();
  await expect(page.getByText(/00 resultados/i)).toHaveCount(0);
});

test("global not-found state provides useful navigation", async ({ page }) => {
  const response = await page.goto("/ruta-inexistente-mnt");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Página no encontrada." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Volver al inicio" })).toHaveAttribute("href", "/");
});

test("calculators preserve editing and reject invalid output in production", async ({ page }) => {
  await page.goto("/herramientas/gastos-de-cierre");
  await page.getByRole("button", { name: "Voy a vender" }).click();
  await page.getByLabel("Comisión pactada (%)").fill("0");
  await expect(page.getByText(/Comisión de intermediación \(0%\)/)).toBeVisible();
  await page.getByLabel("Comisión pactada (%)").fill("");
  await expect(page.getByText(/Ingresa una comisión válida/)).toBeVisible();
  await expect(page.getByText("Total estimado")).toHaveCount(0);

  await page.goto("/herramientas/hipoteca");
  await page.getByLabel(/Precio de la propiedad/).fill("");
  await expect(page.getByText(/Ingresa un precio válido entre \$100,000 y \$10,000,000,000,000/)).toBeVisible();
  await expect(page.locator("dl").getByText("Mensualidad", { exact: true })).toHaveCount(0);
  await page.getByLabel(/Precio de la propiedad/).fill("1e308");
  await expect(page.getByText(/Ingresa un precio válido entre .*10,000,000,000,000/)).toBeVisible();
  await expect(page.locator("dl").getByText("Mensualidad", { exact: true })).toHaveCount(0);
});

test("inventory and contact retain one H1", async ({ page }) => {
  await page.goto("/contacto");
  await expect(page.locator("h1")).toHaveCount(1);
  await page.goto("/inventario");
  await expect(page.locator("h1")).toHaveCount(1);
});
