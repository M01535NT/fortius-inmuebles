import { test, expect, type Locator } from "@playwright/test";
import { resolve } from "node:path";
import type { ViteDevServer } from "vite";

let server: ViteDevServer;
let origin: string;
const variants = ["contacto", "evaluar", "checklist", "documentos", "interes-propiedad"];
test.beforeAll(async () => {
  const { createServer } = await import("vite");
  server = await createServer({
    configFile: false,
    root: process.cwd(),
    resolve: { alias: { "@": resolve("src"), "next/navigation": resolve("tests/admin/browser/fixtures/form-router.ts") } },
    server: { host: "127.0.0.1", port: 0, watch: { ignored: ["**/.superpowers/**"] } },
    appType: "custom",
    ssr: { noExternal: ["gsap", "@gsap/react"] },
  });
  server.middlewares.use(async (request, response, next) => {
    if (request.url !== "/") return next();
    try {
      const { render } = await server.ssrLoadModule("/tests/admin/browser/fixtures/forms-server.tsx");
      response.setHeader("Content-Type", "text/html; charset=utf-8");
      response.end(`<!doctype html><html><body><div id="root">${render()}</div><script type="module" src="/tests/admin/browser/fixtures/forms-client.tsx"></script></body></html>`);
    } catch (error) { response.statusCode = 500; response.end(String(error)); }
  });
  await server.listen();
  origin = server.resolvedUrls!.local[0];
});
test.afterAll(async () => { await server?.close(); });

async function fill(form: Locator) {
  await form.getByLabel("Nombre", { exact: true }).fill("Formulario privado");
  await form.getByLabel(/Teléfono/).fill("6641234567");
  if (await form.locator('[name="zona"]').count()) {
    await form.locator('[name="zona"]').fill("Centro");
    await form.locator('[name="tipo"]').selectOption("Casa");
  }
}

for (const mode of ["JavaScript unavailable", "hydration delayed"]) {
  test(`${mode}: all five SSR forms block native click and Enter without leaking URL data`, async ({ browser }) => {
    test.setTimeout(90000);
    const context = await browser.newContext({ javaScriptEnabled: mode !== "JavaScript unavailable", reducedMotion: "reduce" });
    const page = await context.newPage();
    let release!: () => void;
    const gate = new Promise<void>((done) => { release = done; });
    if (mode === "hydration delayed") await page.route("**/fixtures/forms-client.tsx", async (route) => { await gate; await route.continue(); });
    const submissions: string[] = [];
    const queries: string[] = [];
    page.on("request", (request) => {
      if (request.isNavigationRequest() && new URL(request.url()).search) queries.push(request.url());
    });
    await page.route("**/api/leads", async (route) => { submissions.push(route.request().url()); await route.fulfill({ status: 503, json: { error: "No guardado" } }); });
    await page.goto(origin, { waitUntil: "commit" });
    for (const variant of variants) {
      const root = page.locator(`[data-variant="${variant}"]`);
      if (variant === "evaluar") await root.locator("summary").click();
      const form = root.locator("form");
      await expect(form).toBeVisible();
      await expect(form).toHaveAttribute("method", "post");
      const controls = form.locator("input, select, textarea, button");
      for (const control of await controls.all()) await expect(control).toBeDisabled();
      // Simulate browser-restored/autofilled data while native controls remain disabled.
      await form.locator('input[autocomplete="name"]').evaluate((input: HTMLInputElement) => { input.value = "Private fixture"; });
      await form.locator('input[type="tel"]').evaluate((input: HTMLInputElement) => { input.value = "6641234567"; });
      await form.locator('button[type="submit"]').click({ force: true });
      await form.locator('input[type="tel"]').press("Enter");
      expect(new URL(page.url()).search).toBe("");
      await expect(root.locator("a[download]")).toHaveCount(0);
      if (mode === "JavaScript unavailable") {
        // Playwright's text engine deliberately omits NOSCRIPT; inspect its rendered paragraph.
        const notice = root.locator("noscript p");
        await expect(notice).toBeVisible();
        expect(await notice.evaluate((node) => node.textContent)).toContain("No se ha enviado");
      }
    }
    expect(submissions).toEqual([]);
    expect(queries).toEqual([]);
    if (mode === "hydration delayed") {
      release();
      const form = page.locator('[data-variant="contacto"] form');
      await expect(form.getByLabel("Nombre", { exact: true })).toBeEnabled();
      await fill(form);
      await form.locator('input[type="tel"]').press("Enter");
      await expect(form.getByRole("alert")).toBeVisible();
      expect(submissions).toHaveLength(1);
    }
    release();
    await context.close();
  });
}

for (const variant of variants) {
  test(`${variant}: hydrated Enter/click preserve failures and release success only after POST ACK`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    let acknowledge!: () => void;
    let calls = 0;
    await page.route("**/api/leads", async (route) => {
      expect(route.request().method()).toBe("POST");
      expect(route.request().postDataJSON()).toMatchObject({ nombre: "Formulario privado", telefono: "6641234567", website: "" });
      if (++calls === 1) return route.fulfill({ status: 503, json: { error: "No guardado" } });
      await new Promise<void>((resolve) => { acknowledge = resolve; });
      return route.fulfill({ status: 201, json: { id: "acknowledged-fixture" } });
    });
    await page.goto(origin);
    const root = page.locator(`[data-variant="${variant}"]`);
    if (variant === "evaluar") await root.locator("summary").click();
      const form = root.locator("form");
    await expect(form.getByLabel("Nombre", { exact: true })).toBeEnabled();
    await fill(form);
    await form.locator('input[type="tel"]').press("Enter");
    await expect(form.getByRole("alert")).toBeVisible();
    await expect(form.getByLabel("Nombre", { exact: true })).toHaveValue("Formulario privado");
    await form.locator('button[type="submit"]').click();
    await expect.poll(() => calls).toBe(2);
    await expect(form).toBeVisible();
    await expect(root.locator("a[download]")).toHaveCount(0);
    expect(new URL(page.url()).pathname).toBe("/");
    acknowledge();
    if (variant === "evaluar") await expect(page).toHaveURL(/\/vender-propiedad\/gracias$/);
    else await expect(form).toHaveCount(0);
    if (["documentos", "checklist"].includes(variant)) await expect(root.locator("a[download]")).toHaveCount(1);
  });
}
