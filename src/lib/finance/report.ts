import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, PDFName, PDFString, StandardFonts } from "pdf-lib";
import { FinancialLayout } from "./report-layout";
import type { FinancialReport, ReportAssets } from "./report-model";
export type { FinancialReport, ReportAssets } from "./report-model";
/** Financial inputs stay in memory; PDF generation never uploads them. */
export async function createFinancialPdf(
  report: FinancialReport,
  assets?: ReportAssets,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Mint | ${report.title}`);
  pdf.setAuthor("Mint Inmuebles");
  pdf.setCreator("Mint · Herramientas inmobiliarias");
  pdf.catalog.set(PDFName.of("Lang"), PDFString.of("es-MX"));
  pdf.registerFontkit(fontkit);
  const [regular, bold, mono, leaf] = assets
    ? await Promise.all([
        pdf.embedFont(assets.regular, { subset: true }),
        pdf.embedFont(assets.bold, { subset: true }),
        pdf.embedFont(assets.mono, { subset: true }),
        pdf.embedPng(assets.leaf),
      ])
    : await Promise.all([
        pdf.embedFont(StandardFonts.Helvetica),
        pdf.embedFont(StandardFonts.HelveticaBold),
        pdf.embedFont(StandardFonts.Courier),
        Promise.resolve(undefined),
      ]);
  new FinancialLayout(pdf, { regular, bold, mono }, report, leaf).render();
  return pdf.save();
}
let assetPromise: Promise<ReportAssets> | undefined;
function reportAssets(): Promise<ReportAssets> {
  // Only public, static brand assets are requested. Financial data is never sent.
  assetPromise ??= Promise.all(
    [
      "/fonts/Archivo-Regular.ttf",
      "/fonts/Archivo-SemiBold.ttf",
      "/fonts/IBMPlexMono-Medium.ttf",
      "/brand/mint-leaf.png",
    ].map(async (path) => {
      const response = await fetch(path);
      if (!response.ok)
        throw new Error(
          "No se pudieron cargar los recursos del PDF. Intenta de nuevo.",
        );
      return new Uint8Array(await response.arrayBuffer());
    }),
  )
    .then(([regular, bold, mono, leaf]) => ({ regular, bold, mono, leaf }))
    .catch((error: unknown) => {
      assetPromise = undefined;
      throw error;
    });
  return assetPromise;
}
export async function downloadFinancialReport(
  report: FinancialReport,
  filename: string,
): Promise<void> {
  const bytes = await createFinancialPdf(report, await reportAssets());
  const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
