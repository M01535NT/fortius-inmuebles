import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { PDFDocument } from "pdf-lib";
import { financialPdfPages } from "../../helpers/financial-pdf";
const pdfText = (pdf: PDFDocument) => financialPdfPages(pdf).join("\n");
for (const width of [375, 414, 768, 1440]) {
  test(`financial tools are accessible and usable at ${width}px`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({
      reducedMotion: "reduce",
      colorScheme: width === 414 || width === 1440 ? "dark" : "light",
    });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/herramientas/hipoteca");
    await expect(
      page.getByRole("heading", { name: "Calculadora de hipoteca." }),
    ).toBeVisible();
    await page.getByLabel("Precio de la propiedad (MXN)").fill("3123456.78");
    await page.getByLabel("Seguro mensual (MXN)", { exact: true }).fill("1250");
    await page.getByLabel("Administración mensual (MXN)").fill("0");
    await page.getByLabel("Comisión de apertura (MXN)").fill("15000");
    await page.getByRole("button", { name: /Guardar escenario/ }).click();
    await page.getByLabel("Tasa %").fill("8");
    await page.getByRole("button", { name: /Guardar escenario/ }).click();
    await expect(
      page.getByRole("region", { name: "Comparación de escenarios" }),
    ).toBeVisible();
    const graph = page.getByLabel("Consultar mes del crédito");
    await graph.focus();
    await page.keyboard.press("ArrowRight");
    await expect(graph).toHaveValue("2");
    await page.getByText("Tabla de amortización", { exact: true }).click();
    await expect(page.getByRole("table")).toBeVisible();
    await page.getByRole("button", { name: "12 meses siguientes" }).click();
    await expect(page.getByRole("caption")).toContainText("Pagos 13 a 24");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const mortgageAxe = await new AxeBuilder({ page })
      .include("main")
      .analyze();
    expect(mortgageAxe.violations).toEqual([]);
    await page.screenshot({
      path: info.outputPath(`hipoteca-${width}.png`),
      fullPage: true,
    });
    await page.goto("/herramientas/gastos-de-cierre");
    await page
      .getByLabel("Municipio", { exact: true })
      .selectOption("ensenada");
    await page
      .getByRole("button", { name: "Usar precio para simular" })
      .click();
    for (const label of [
      "Notario y gestión (MXN)",
      "Avalúo cotizado (MXN)",
      "Otros gastos (MXN)",
    ])
      await page.getByLabel(label, { exact: true }).fill("0");
    await expect(
      page.getByText("Efectivo inicial estimado", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("$76,500.00", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Voy a vender" }).click();
    await page.getByRole("button", { name: "No tengo hipoteca" }).click();
    await page.getByLabel("ISR determinado (MXN)").fill("50000");
    await expect(
      page.getByText("Neto estimado de venta", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Neto estimado de venta", { exact: true }).locator(".."),
    ).toContainText("$2,776,000.00 MXN");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const closingAxe = await new AxeBuilder({ page }).include("main").analyze();
    expect(closingAxe.violations).toEqual([]);
    await page.screenshot({
      path: info.outputPath(`venta-${width}.png`),
      fullPage: true,
    });
    expect(errors).toEqual([]);
  });
}
test("financial PDFs contain the same results, complete schedule and quotes without data uploads", async ({
  page,
}, info) => {
  const requests: string[] = [];
  page.on("request", (r) => requests.push(`${r.url()} ${r.postData() ?? ""}`));
  await page.goto("/herramientas/hipoteca");
  await page.getByLabel("Precio de la propiedad (MXN)").fill("3123456.78");
  await page.getByLabel("Fecha del primer pago").fill("2026-11-01");
  const downloading = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Descargar PDF", exact: true })
    .first()
    .click();
  const download = await downloading;
  await download.saveAs(info.outputPath("hipoteca.pdf"));
  const stream = await download.createReadStream(),
    chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const pdf = await PDFDocument.load(Buffer.concat(chunks));
  expect(pdf.getPageCount()).toBeGreaterThan(5);
  expect(pdfText(pdf)).toContain("$3,123,456.78");
  expect(pdfText(pdf)).toMatch(/Seguro mensual\s+Pendiente/);
  expect(pdfText(pdf)).toMatch(/240\s+2046-10-01/);
  expect(
    requests.some((r) => /3123456|3,123,456|income|extraMonthly/.test(r)),
  ).toBe(false);
  const storage = await page.evaluate(() =>
    JSON.stringify([
      Object.entries(localStorage),
      Object.entries(sessionStorage),
    ]),
  );
  expect(storage).not.toMatch(/3123456|extraMonthly|insurance|downPercent/);
  await page.reload();
  await expect(
    page.getByRole("region", { name: "Comparación de escenarios" }),
  ).toHaveCount(0);
  await page.goto("/herramientas/gastos-de-cierre");
  await page.getByLabel("Municipio", { exact: true }).selectOption("rosarito");
  await page.getByRole("button", { name: "Usar precio para simular" }).click();
  await page.getByText("Determinaciones y registro", { exact: true }).click();
  for (const [label, value] of [
    ["Registro cotizado (MXN)", "15000"],
    ["Notario y gestión (MXN)", "25000"],
    ["Avalúo cotizado (MXN)", "5000"],
    ["Otros gastos (MXN)", "0"],
  ])
    await page.getByLabel(label, { exact: true }).fill(value);
  const closingDownload = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Descargar PDF", exact: true })
    .click();
  const closing = await closingDownload;
  await closing.saveAs(info.outputPath("presupuesto-compra.pdf"));
  const closingChunks: Buffer[] = [];
  for await (const chunk of (await closing.createReadStream())!)
    closingChunks.push(Buffer.from(chunk));
  const closingText = pdfText(
    await PDFDocument.load(Buffer.concat(closingChunks)),
  );
  expect(closingText).toContain("$3,121,500.00");
  expect(closingText).toContain("$76,500.00");
  expect(closingText).toContain("$15,000.00");
  expect(closingText).toContain("precio usado como supuesto");
});
test("property detail retains the compact planner and explicit dollar conversion", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/inventario/residencia-vista-al-mar-playas");
  await page.getByText("Mensualidad con crédito", { exact: true }).click();
  const planner = page.getByRole("region", {
    name: "Simulador de crédito hipotecario",
  });
  await expect(planner).toBeVisible();
  if (await planner.getByLabel("Tipo de cambio (MXN por USD)").count())
    await planner.getByLabel("Tipo de cambio (MXN por USD)").fill("20");
  await expect(
    planner.getByText("Capital e interés mensual", { exact: true }),
  ).toBeVisible();
  await expect(
    planner.getByRole("link", { name: "Abrir simulador completo" }),
  ).toHaveAttribute("href", "/herramientas/hipoteca");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
