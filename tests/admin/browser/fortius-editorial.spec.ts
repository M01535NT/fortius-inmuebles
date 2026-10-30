import { expect, test } from "@playwright/test";

test("the hero has a single image, one search and a pausable coverage marquee", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const hero = page.locator(".nx-hero");
  await expect(hero.locator("img")).toHaveCount(1);
  await expect(hero.getByRole("search")).toHaveCount(1);
  await expect(hero.locator(".hero-marquee, .editorial-photo-controls")).toHaveCount(0);
  await expect(hero.getByRole("list", { name: "Zonas de cobertura" })).toBeVisible();
  const toggle = hero.getByRole("button", { name: "Pausar el movimiento de zonas" });
  await toggle.click();
  await expect(hero.locator(".nx-marquee-track")).toHaveCSS("animation-play-state", "paused");
  await expect(hero.getByRole("button", { name: "Reanudar el movimiento de zonas" })).toBeFocused();
});

test("dark link hover retains readable ink while buttons remain burgundy", async ({ page }) => {
  await page.goto("/terminos", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Cambiar a tema oscuro" }).click();
  const indexLink = page.locator('main a[href^="#"]').first();
  await indexLink.hover();
  await expect(indexLink).toHaveCSS("color", "rgb(245, 241, 235)");
});

for (const width of [390, 1440]) {
  test(`Fortius preserves brand colors and offers four useful menu routes at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });
    const logo = page.locator('header [role="img"]').first();
    const fills = () => logo.locator("path").evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).fill));
    const original = await fills();
    await page.getByRole("button", { name: "Abrir menú" }).click();
    const menu = page.getByRole("dialog", { name: "Menú", exact: true });
    // On the night home the theme switch lives inside the menu.
    await menu.getByRole("button", { name: "Cambiar a tema oscuro" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    expect(await fills()).toEqual(original);
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--primary").trim())).toBe("#8a1634");
    const primary = menu.getByRole("navigation", { name: "Menú principal", exact: true });
    await expect(primary.locator(":scope > ol > li > div > a")).toHaveCount(8);
    const owner = menu.getByRole("region", { name: "Servicios para propietarios" });
    const sell = owner.getByRole("link", { name: "Vender mi propiedad" });
    await expect(sell).toHaveAttribute("href", "/vender-propiedad");
    await expect(owner.getByRole("link", { name: "Opinión de valor" })).toHaveAttribute("href", "/vender-propiedad#precio-y-condiciones");
    await expect(primary.getByRole("link", { name: "Propiedades", exact: true })).toHaveAttribute("href", "/inventario");
    await expect(menu.getByRole("link", { name: "Contacto directo" })).toHaveAttribute("href", "/contacto");
    await sell.scrollIntoViewIfNeeded();
    await sell.click();
    await expect(page).toHaveURL(/\/vender-propiedad$/);
    await expect(menu).toBeHidden();
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Abrir menú" })).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });

  test(`home keeps six method stages that light up while scrolling at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });
    const timeline = page.locator("[data-method-timeline]");
    await expect(timeline.locator("li")).toHaveCount(6);
    await expect(page.getByRole("heading", { name: "Así vendemos tu propiedad." })).toBeAttached();
    await page.locator("#metodo").scrollIntoViewIfNeeded();
    await expect(timeline.locator("li.is-active")).toHaveCount(1);
    for (let step = 0; step < 30 && !(await timeline.locator("li").last().evaluate((node) => node.classList.contains("is-active"))); step++) {
      await page.mouse.wheel(0, 250);
      await page.waitForTimeout(60); // Pace wheel input for the scrubbed timeline; not a layout wait.
    }
    await expect(timeline.locator("li").last()).toHaveClass(/is-active/);
    await expect(timeline.getByRole("heading", { name: "Cierre y entrega" })).toBeInViewport();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(timeline.locator("li").last()).toHaveCSS("opacity", "1");
    await expect(page.locator(".nx-hero-title")).toBeAttached();
  });

  test(`property photographs use editorial proportions across the catalog at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    // The home deck spreads each featured photo across the screen (titular, 30/10/2026).
    await page.goto("/");
    const deckPhoto = page.locator("#destacadas [data-property-card] img").first();
    await deckPhoto.scrollIntoViewIfNeeded();
    await expect(deckPhoto).toBeVisible();
    const deckBox = await deckPhoto.boundingBox();
    expect(Math.abs(deckBox!.width - await page.evaluate(() => document.documentElement.clientWidth))).toBeLessThanOrEqual(1);
    expect(deckBox!.height).toBeGreaterThanOrEqual(520);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    // The catalog uses compact 3:2 cards (titular, 18/10/2026).
    await page.goto("/inventario");
    const photo = page.locator("[data-property-card] img").first();
    await photo.scrollIntoViewIfNeeded();
    await expect(photo).toBeVisible();
    const box = await photo.boundingBox();
    expect(box!.width / box!.height).toBeCloseTo(3 / 2, 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator("[data-property-card] a").first().click();
    await expect(page.locator(".property-gallery-photos")).toBeVisible();
    await expect(page.getByRole("button", { name: "Ficha técnica", exact: true })).toBeVisible();
    const second = page.getByRole("button", { name: "Ver imagen 2", exact: true });
    if (await second.count()) {
      await second.click();
      await expect(second).toHaveAttribute("aria-pressed", "true");
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

for (const width of [390, 1440]) {
  test(`method stages show their descriptions without hidden regions at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const stages = page.locator("[data-method-timeline] li");
    await expect(stages).toHaveCount(6);
    await expect(page.locator("[data-method-timeline] [role=region], [data-method-timeline] button")).toHaveCount(0);
    for (const stage of await stages.all()) {
      await stage.scrollIntoViewIfNeeded();
      await expect(stage.getByRole("heading")).toBeInViewport();
      await expect(stage.locator("p")).toBeVisible();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test("inventory compares chosen properties and restores filtered results after a detail visit", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/inventario', { waitUntil: 'domcontentloaded' });
  const choices = page.getByRole('checkbox', { name: /Comparar / });
  await expect(choices.first()).toBeVisible();
  await choices.nth(0).check();
  await choices.nth(1).check();
  await page.getByRole('button', { name: 'Ver comparación (2)' }).click();
  await expect(page.getByRole('table', { name: 'Comparación de inmuebles' })).toBeVisible();
  await expect(page.getByRole('table')).toContainText('Estacionamientos');
  await page.getByRole('group', { name: 'Operación', exact: true }).getByRole('button', { name: 'Venta', exact: true }).click();
  await expect(page).toHaveURL(/op=venta/);
  await page.locator('.property-card-image').first().click();
  await expect(page.locator('.property-gallery')).toBeVisible();
  await page.getByRole('link', { name: 'Volver al inventario' }).click();
  await expect(page.getByRole('group', { name: 'Operación', exact: true }).getByRole('button', { name: 'Venta', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Ver comparación (2)' })).toBeVisible();
});

test("photo gallery hides absent media and supports full-screen keyboard navigation", async ({ page }) => {
  await page.goto('/inventario', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.property-card-image').first()).toBeVisible();
  await page.locator('.property-card-image').first().click();
  await expect(page.getByRole('button', { name: 'Video', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: /Ampliar fotografía/ }).click();
  const viewer = page.getByRole('dialog', { name: 'Fotografías del inmueble' });
  await expect(viewer).toBeVisible();
  await viewer.press('ArrowRight');
  await expect(viewer.getByRole('status')).toContainText('2 /');
  await viewer.dispatchEvent('touchstart', { touches: [{ identifier: 1, clientX: 280, clientY: 200 }] });
  await viewer.dispatchEvent('touchend', { changedTouches: [{ identifier: 1, clientX: 80, clientY: 205 }] });
  await expect(viewer.getByRole('status')).toContainText('1 /');
  await viewer.press('Escape');
  await expect(viewer).not.toBeVisible();
  await expect(page.getByRole('button', { name: /Ampliar fotografía/ })).toBeFocused();
});

test("stale comparison choices never block current inventory", async ({ page }) => {
  await page.goto('/inventario', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => sessionStorage.setItem('fortius-inventory-comparison', JSON.stringify(['removed-1', 'removed-2', 'removed-3'])));
  await page.reload({ waitUntil: 'domcontentloaded' });
  const choice = page.getByRole('checkbox', { name: /Comparar / }).first();
  await expect(choice).toBeEnabled();
  await choice.check();
  await expect(page.getByRole('button', { name: 'Ver comparación (1)' })).toBeVisible();
});

test("interior routes provide useful next actions and honest media", async ({ page }) => {
  await page.goto('/contacto', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: '¿Compras o vendes? Hablemos.' })).toBeVisible();
  await page.getByLabel('Opciones de contacto').getByText('Quiero vender', { exact: true }).click();
  await expect(page.getByLabel('Quiero vender')).toBeChecked();

  await page.goto('/nosotros', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Personas detrás de cada operación.' })).toBeVisible();
  await expect(page.getByText('Espacio reservado para el video institucional.')).toHaveCount(0);

  await page.goto('/residencial', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('img', { name: /Esquema de vivienda/ })).toBeVisible();
  await page.getByRole('button', { name: 'Descanso' }).click();
  await expect(page.getByRole('img', { name: /Descanso/ })).toBeVisible();
});

test("financial tools expose interactive visual explanations", async ({ page }) => {
  await page.goto('/herramientas/hipoteca', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('img', { name: /Saldo de crédito por mes/ })).toBeVisible();
  await expect(page.getByLabel('Consultar mes del crédito')).toBeVisible();

  await page.goto('/herramientas/gastos-de-cierre', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Cómo se distribuyen los gastos conocidos')).toBeVisible();
});

test("blog articles offer a relevant next action and related reading", async ({ page }) => {
  await page.goto('/blog', { waitUntil: 'domcontentloaded' });
  const article = page.locator('a[href^="/blog/"]').first();
  await expect(article).toBeVisible();
  await article.click();
  await expect(page.getByText('Siguiente paso', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Lecturas relacionadas' })).toBeVisible();
});
