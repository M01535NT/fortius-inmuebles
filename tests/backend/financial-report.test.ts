import { expect, test } from "vitest";
import {
  decodePDFRawStream,
  PDFArray,
  PDFDocument,
  PDFRawStream,
} from "pdf-lib";
import { createFinancialPdf } from "@/lib/finance/report";
test("local financial PDF paginates and preserves first/last schedule amounts and missing fees", async () => {
  const pdf = await PDFDocument.load(
    await createFinancialPdf({
      title: "Hipoteca de prueba",
      sections: [
        {
          title: "Costos",
          lines: [
            "Seguro mensual: Pendiente",
            "Intereses: $2,123,456.78",
            "Tasa fija: 10.5%",
          ],
        },
        {
          title: "Amortización",
          lines: Array.from(
            { length: 360 },
            (_, i) => `Mes ${i + 1} saldo ${i === 359 ? "0.00" : "2400000.00"}`,
          ),
        },
      ],
    }),
  );
  expect(pdf.getPageCount()).toBeGreaterThan(5);
  expect(pdf.getTitle()).toBe("Fortius | Hipoteca de prueba");
  expect(pdf.getSubject()).toContain("2026.10.04");
  const content = pdf
    .getPages()
    .flatMap((page) => {
      const contents = page.node.Contents();
      const streams =
        contents instanceof PDFArray
          ? contents.asArray().map((s) => pdf.context.lookup(s))
          : [contents];
      return streams
        .filter((s): s is PDFRawStream => s instanceof PDFRawStream)
        .map((s) => new TextDecoder().decode(decodePDFRawStream(s).decode()));
    })
    .join("\n");
  const decoded = [...content.matchAll(/<([0-9A-F]+)>\s*Tj/g)]
    .map((m) => Buffer.from(m[1], "hex").toString("latin1"))
    .join("\n");
  expect(decoded).toContain("Seguro mensual: Pendiente");
  expect(decoded).toContain("$2,123,456.78");
  expect(decoded).toContain("Mes 1 saldo 2400000.00");
  expect(decoded).toContain("Mes 360 saldo 0.00");
});
