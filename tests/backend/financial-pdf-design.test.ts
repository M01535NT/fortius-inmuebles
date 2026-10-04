import { readFile } from "node:fs/promises";
import { expect, test } from "vitest";
import { PDFDocument, PDFName } from "pdf-lib";
import { calculateMortgage } from "@/lib/finance/mortgage";
import { calculateClosingBudget } from "@/lib/finance/closing";
import { mortgageReport, closingReport } from "@/lib/finance/report-content";
import { createFinancialPdf } from "@/lib/finance/report";
import { financialPdfPages } from "../helpers/financial-pdf";
const input = {
  price: 3000000,
  downPercent: 20,
  annualRate: 10.5,
  months: 240,
  firstPayment: "2026-11-01",
  insurance: null,
  monthlyFee: 0,
  openingFee: 24000,
  extraMonthly: 0,
  extraOnce: 0,
  extraMonth: 12,
  prepaymentFee: 0,
  prepaymentMode: "term" as const,
};
async function assets() {
  const [regular, bold, mono, leaf] = await Promise.all(
    [
      "public/fonts/Archivo-Regular.ttf",
      "public/fonts/Archivo-SemiBold.ttf",
      "public/fonts/IBMPlexMono-Medium.ttf",
      "public/brand/mint-leaf.png",
    ].map((path) => readFile(path)),
  );
  return { regular, bold, mono, leaf };
}
test("branded mortgage PDF has a financial overview, language, outline and repeated landscape payment headers", async () => {
  const result = calculateMortgage(input);
  const report = mortgageReport({
    input,
    result,
    saved: [],
    bank: "Banco de prueba · México",
    quotedCat: "12.5",
    quoteDate: "2026-10-03",
  });
  const pdf = await PDFDocument.load(
    await createFinancialPdf(report, await assets()),
  );
  expect(pdf.getAuthor()).toBe("Mint Inmuebles");
  expect(pdf.catalog.get(PDFName.of("Lang"))?.toString()).toContain("es-MX");
  expect(pdf.catalog.get(PDFName.of("Outlines"))).toBeTruthy();
  const pages = financialPdfPages(pdf);
  expect(pages[0]).toContain("$23,961.12 MXN");
  expect(pages[0]).toContain("Evolución del saldo");
  expect(pages.join("\n")).toContain("Banco de prueba · México");
  expect(pages.join("\n")).toMatch(/Seguro mensual\s+Pendiente/);
  const landscape = pdf
    .getPages()
    .map((p, i) => (p.getWidth() > p.getHeight() ? pages[i] : ""))
    .filter(Boolean);
  expect(landscape.length).toBeGreaterThan(2);
  for (const p of landscape) {
    expect(p).toContain("Capital +");
    expect(p).toContain("Egreso");
    expect(p).toContain("Saldo");
  }
  expect(landscape[0]).toMatch(/1\s+2026-11-01/);
  expect(landscape.at(-1)).toMatch(/240\s+2046-10-01/);
});
test("buyer PDF preserves quoted overrides, assumed base and a visibly partial result", async () => {
  const i = {
    profile: "buyer" as const,
    municipality: "rosarito" as const,
    date: "2026-10-03",
    price: 3000000,
    taxBase: 3000000,
    baseIsAssumed: true,
    downPayment: 600000,
    loan: 2400000,
    registrationQuote: 15000,
    notary: null,
    appraisal: 5000,
    openingFee: 24000,
    other: 0,
  };
  const report = closingReport({ input: i, result: calculateClosingBudget(i) });
  const pdf = await PDFDocument.load(
    await createFinancialPdf(report, await assets()),
  );
  const pages = financialPdfPages(pdf);
  expect(pages[0]).toContain("Efectivo inicial parcial");
  expect(pages[0]).toContain("$720,500.00 MXN");
  expect(pages[0]).toContain("Honorarios y gestión notarial");
  expect(pages.join("\n")).toContain("precio usado como supuesto");
  expect(pages.join("\n")).toContain("$15,000.00");
  expect(pages.join("\n")).toContain("Cotización capturada");
});

test("comparison keeps every digit of large amounts together and each scheduled month survives pagination", async () => {
  const large = {
    ...input,
    price: 10000000000,
    annualRate: 25,
    months: 360,
    insurance: 10000000000,
    monthlyFee: 10000000000,
    openingFee: 10000000000,
  };
  const result = calculateMortgage(large);
  const scenario = {
    input: large,
    result,
    bank: "Crédito de prueba",
    quotedCat: "",
    quoteDate: "",
  };
  const pdf = await PDFDocument.load(
    await createFinancialPdf(
      mortgageReport({ ...scenario, saved: [scenario, scenario, scenario] }),
      await assets(),
    ),
  );
  const pages = financialPdfPages(pdf),
    all = pages.join("\n");
  const comparison = pages
    .find((text) => text.includes("Comparación de escenarios"))!
    .split("Datos del escenario guardado 1")[0];
  expect(comparison.match(/\$10,000,000,000\.00/g)).toHaveLength(4);
  expect(comparison.match(/\$8,000,000,000\.00/g)).toHaveLength(4);
  expect(comparison.match(/\$7,270,035,864,898\.55/g)).toHaveLength(4);
  const schedule = pages
    .filter(
      (_, i) => pdf.getPages()[i].getWidth() > pdf.getPages()[i].getHeight(),
    )
    .join("\n");
  for (const row of result.schedule) {
    expect(schedule.match(new RegExp(`${row.date}`, "g"))).toHaveLength(1);
  }
  expect(all).toContain("Saldo");
});

test("cash purchase has no fictitious amortization appendix or monthly credit charges", async () => {
  const cash = { ...input, downPercent: 100 };
  const result = calculateMortgage(cash);
  const report = mortgageReport({
    input: cash,
    result,
    bank: "",
    quotedCat: "",
    quoteDate: "",
    saved: [],
  });
  const pdf = await PDFDocument.load(
    await createFinancialPdf(report, await assets()),
  );
  const text = financialPdfPages(pdf).join("\n");
  expect(text).toContain("Compra de contado. No hay crédito que amortizar.");
  expect(text).not.toContain("Calendario de pagos");
  expect(text).not.toContain("Evolución del saldo");
  expect(
    pdf.getPages().every((page) => page.getWidth() < page.getHeight()),
  ).toBe(true);
});
