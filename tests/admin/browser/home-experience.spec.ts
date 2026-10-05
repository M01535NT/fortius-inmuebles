import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

test("mobile performance budget across three cold loads", async () => {
  test.skip(process.env.FORTIUS_INMUEBLES_RUN_LIGHTHOUSE !== "true", "Opt-in measurement; run with FORTIUS_INMUEBLES_RUN_LIGHTHOUSE=true.");
  test.setTimeout(240000);
  try {
    await promisify(execFile)(process.execPath, ["tools/public-performance.mjs", "http://127.0.0.1:3100"], { windowsHide: true });
  } catch (error) {
    const failure = error as Error & { stdout?: string; stderr?: string };
    throw new Error(`${failure.message}\n${failure.stdout ?? ""}\n${failure.stderr ?? ""}`);
  }
});

for (const width of [375, 414, 768, 1024, 1440]) {
  test(`animated homepage remains readable and usable at ${width}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Vende tu propiedad");
    await expect(page.getByRole("button", { name: /Pausar imágenes|Reanudar imágenes/ })).toHaveCount(0);
    await page.getByRole("button", { name: "Imagen 2", exact: true }).click();
    await expect(page.getByRole("button", { name: "Imagen 2", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".kenburns").last()).toHaveCSS("animation-play-state", "paused");
    await expect(page.locator(".hero-copy-entry").first()).toHaveCSS("opacity", "1");
    await expect(page.locator(".hero-copy-entry").last()).toHaveCSS("opacity", "1");
    await expect.poll(() => page.getByRole("heading", { level: 1 }).evaluate((heading) => {
      const parts = Array.from(heading.querySelectorAll("*"));
      return parts.length > 2 && parts.every((part) => {
        const style = getComputedStyle(part);
        return style.opacity === "1" && (style.filter === "none" || style.filter === "blur(0px)");
      });
    })).toBe(true);
    await expect(page.locator('section[aria-label="Presentación"] img')).toHaveCount(1);
    await page.getByRole("link", { name: "Ver propiedades", exact: true }).hover();
    await page.screenshot({ path: testInfo.outputPath(`hero-${width}.png`) });
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    // Closing must remain animated, and an interrupted entrance must reopen fully.
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByRole("button", { name: "Abrir menú" })).toBeFocused();
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await expect(page.locator("[data-menu-item]").last()).toHaveCSS("opacity", "1");
    await expect(page.locator("[data-menu-item]").last()).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await page.getByRole("dialog").getByRole("link", { name: /Método/ }).click();
    await expect(page.locator("#metodo")).toBeInViewport();
    await page.locator("#evaluar").scrollIntoViewIfNeeded();
    await expect(page.locator("#evaluar")).toContainText("El contacto directo estará disponible próximamente.");
    await expect(page.locator("#evaluar form")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(page.getByRole("button", { name: /Pausar imágenes|Reanudar imágenes/ })).toHaveCount(0);
    await page.getByRole("button", { name: "Cambiar a tema oscuro" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.getByRole("link", { name: "Fortius Inmuebles, inicio" }).click();
    await page.screenshot({ path: testInfo.outputPath(`dark-reduced-${width}.png`) });
    await page.getByRole("link", { name: "Acceso al panel" }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("heading", { name: "Acceso al panel" })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("public homepage passes automatic WCAG AA checks in both themes", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  for (const theme of ["light", "dark"]) {
    if (theme === "dark") await page.getByRole("button", { name: "Cambiar a tema oscuro" }).click();
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(result.violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) }))).toEqual([]);
  }
});
