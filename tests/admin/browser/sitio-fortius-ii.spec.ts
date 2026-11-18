import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/*
  Sitio público (etapa 7, 17/11/2026; marca del sistema de diseño desde el 17/11/2026). Reemplaza las pruebas del diseño anterior:
  portada por asuntos, frase con filtros, Vender en dos pasos, Contacto con «Hola, quiero…»,
  páginas de error con la cabeza nueva, teléfono sin desbordes y movimiento reducido.
*/

const paginas = [
  "/", "/inventario", "/vender-propiedad", "/comprar-propiedad", "/contacto", "/herramientas",
  "/herramientas/hipoteca", "/herramientas/gastos-de-cierre", "/opinion-de-valor", "/nosotros",
  "/preguntas-frecuentes", "/blog", "/avisos", "/privacidad", "/terminos", "/vender-propiedad/gracias",
  "/ruta-inexistente-mnt",
];

/** Controles fuera de un párrafo que miden menos de 44 px de alto. */
async function controlesChicos(page: Page) {
  return page.evaluate(() => [...document.querySelectorAll<HTMLElement>("main a[href], main button, main input:not([type=hidden]), main select, main textarea, main summary")]
    .filter((el) => {
      // Casillas y opciones se tocan por su etiqueta completa.
      const objetivo = el.matches("input[type=checkbox], input[type=radio]") && el.closest("label") ? el.closest("label")! : el;
      const caja = objetivo.getBoundingClientRect();
      if (!caja.width || !caja.height || el.classList.contains("sr-only")) return false;
      const enTexto = el.tagName === "A" && getComputedStyle(el).display === "inline" && el.closest("p, li, dd, td");
      return !enTexto && caja.height < 43.5;
    })
    .map((el) => `${el.tagName} «${(el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 40)}» ${Math.round(el.getBoundingClientRect().height)}px`));
}

for (const ruta of paginas) {
  test(`${ruta} cabe en el teléfono y sus controles miden 44 px`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(ruta);
    await expect(page.locator("main h1").first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
    expect(await controlesChicos(page)).toEqual([]);
  });
}

test("la portada cambia el texto y el botón al elegir un asunto", async ({ page }) => {
  await page.goto("/");
  const asuntos = page.getByRole("group", { name: /trae por aquí/i });
  await expect(asuntos.getByRole("button", { name: "Vender" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("link", { name: "Quiero vender" })).toHaveAttribute("href", "/vender-propiedad");
  await asuntos.getByRole("button", { name: "Rentar" }).click();
  await expect(asuntos.getByRole("button", { name: "Rentar" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("link", { name: "Ver rentas" })).toHaveAttribute("href", "/inventario?op=renta");
  await expect(page.getByRole("heading", { name: "Cuéntanos tu asunto" })).toBeVisible();
});

test("la frase del inventario filtra y deja el filtro en la dirección", async ({ page }) => {
  await page.goto("/inventario");
  const operacion = page.getByRole("button", { name: /^Operación:/ });
  await operacion.click();
  const lista = page.getByRole("listbox", { name: "Operación" });
  await expect(lista).toBeVisible();
  await lista.getByRole("option", { name: "rentar", exact: true }).click();
  await expect(lista).toBeHidden();
  await expect(page).toHaveURL(/op=renta/);
  await expect(operacion).toBeFocused();
  await operacion.click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("listbox", { name: "Operación" })).toBeHidden();
  await expect(operacion).toBeFocused();
});

test("Vender pide la entrevista en dos pasos y «Volver» conserva lo escrito", async ({ page }) => {
  await page.goto("/vender-propiedad");
  await expect(page.getByRole("heading", { name: "¿Qué quieres vender?" })).toBeVisible();
  await page.getByLabel("Tipo de propiedad").selectOption({ label: "Departamento" });
  await page.getByLabel("Zona o colonia").fill("Zona Río");
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByRole("heading", { name: "¿Cómo te contactamos?" })).toBeFocused();
  await expect(page.getByText("Departamento en Zona Río · lo anotamos para la entrevista.")).toBeVisible();
  await page.getByRole("button", { name: "← Volver", exact: true }).click();
  await expect(page.getByLabel("Zona o colonia")).toHaveValue("Zona Río");
  await expect(page.getByRole("heading", { name: "Antes de publicar." })).toHaveCount(0);
});

test("Contacto cambia el formulario según «Hola, quiero…»", async ({ page }) => {
  await page.goto("/contacto");
  const motivo = page.getByRole("button", { name: /^Motivo:/ });
  await expect(motivo).toContainText("vender");
  await motivo.click();
  await page.getByRole("listbox", { name: "Motivo" }).getByRole("option", { name: "rentar", exact: true }).click();
  await expect(motivo).toContainText("rentar");
  await expect(page.getByLabel("Qué rentas o buscas rentar")).toBeVisible();
  await expect(page.getByText("¿Compras o vendes? Hablemos.")).toHaveCount(0);
});

test("las páginas de error usan la cabeza nueva", async ({ page }) => {
  await page.goto("/ruta-inexistente-mnt");
  await expect(page.getByRole("heading", { level: 1, name: "Página no encontrada." })).toBeVisible();
  await expect(page.getByRole("main").getByRole("link", { name: "Ver propiedades" })).toHaveAttribute("href", "/inventario");
  await expect(page.locator(".pg-page, .nocturno-home")).toHaveCount(0);
});

test("la imagen para compartir y el aviso de privacidad cargan", async ({ page }) => {
  expect((await page.request.get("/opengraph-image.png")).status()).toBe(200);
  await page.goto("/privacidad");
  await expect(page.getByRole("heading", { level: 1, name: "Aviso de privacidad." })).toBeVisible();
});

test("el blog filtra con sus listas y la búsqueda, y la dirección conserva los filtros", async ({ page }) => {
  await page.goto("/blog");
  await page.locator("select[name=tema]").selectOption("mercado");
  await page.locator("select[name=tipo]").selectOption("actualidad");
  await page.getByLabel("Buscar un tema").fill("CREDITO");
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(page).toHaveURL((url) => url.searchParams.get("tema") === "mercado" && url.searchParams.get("tipo") === "actualidad" && url.searchParams.get("q") === "CREDITO");
  await expect(page.getByRole("status")).toContainText("1 artículo");
  await page.reload();
  await expect(page.locator("select[name=tema]")).toHaveValue("mercado");
  await expect(page.getByLabel("Buscar un tema")).toHaveValue("CREDITO");
});

const paginasAxe = ["/", "/inventario", "/inventario/residencia-vista-al-mar-playas", "/vender-propiedad", "/contacto", "/blog", "/herramientas/hipoteca"];
for (const tema of ["light", "dark"] as const) {
  test(`sin fallas de accesibilidad WCAG AA en tema ${tema === "dark" ? "oscuro" : "claro"}`, async ({ page }) => {
    await page.addInitScript((valor) => { try { localStorage.setItem("fortius-inmuebles-theme", valor); } catch {} }, tema);
    await page.emulateMedia({ colorScheme: tema, reducedMotion: "reduce" });
    for (const ruta of paginasAxe) {
      await page.goto(ruta);
      await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(tema === "dark");
      const axe = await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      expect(axe.violations.map((v) => `${ruta}: ${v.id}`)).toEqual([]);
    }
  });
}

test.describe("con movimiento reducido", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("la tira del inicio no se mueve sola y los videos se quedan en su póster", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const pista = page.locator(".tp-pista");
    if (await pista.count()) {
      await pista.scrollIntoViewIfNeeded();
      await page.mouse.wheel(0, 600);
      await expect.poll(() => pista.evaluate((el) => getComputedStyle(el).transform)).toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
    }
    const reproduciendo = await page.locator("video").evaluateAll((videos) => videos.filter((v) => !(v as HTMLVideoElement).paused).length);
    expect(reproduciendo).toBe(0);
  });
});
