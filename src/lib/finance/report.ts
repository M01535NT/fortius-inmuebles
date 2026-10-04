import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import {
  FINANCIAL_VERSION,
  FINANCIAL_REVIEW_DATE,
} from "@/data/financial-rules";
export type FinancialReport = {
  title: string;
  sections: { title: string; lines: string[] }[];
};
// Pure local export: no HTTP requests, cookies, storage or financial telemetry.
export async function createFinancialPdf(
  report: FinancialReport,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Mint | ${report.title}`);
  pdf.setAuthor("Mint");
  pdf.setSubject(
    `Motor ${FINANCIAL_VERSION}; fuentes revisadas ${FINANCIAL_REVIEW_DATE}`,
  );
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([595.28, 841.89]),
    y = 755;
  const clean = (s: string) =>
    s
      .replace(/[–—−]/g, "-")
      .replace(/[→↔]/g, "/")
      .replace(/[^\x20-\x7e\xa0-\xff]/g, "");
  function newPage() {
    if (y !== 755) page = pdf.addPage([595.28, 841.89]);
    page.drawText("Mint", {
      x: 42,
      y: 793,
      size: 24,
      font: bold,
      color: rgb(0.08, 0.32, 0.23),
    });
    page.drawLine({
      start: { x: 42, y: 779 },
      end: { x: 553, y: 779 },
      color: rgb(0.35, 0.55, 0.43),
      thickness: 0.7,
    });
    y = 755;
  }
  function line(raw: string, heading = false) {
    const font = heading ? bold : regular,
      size = heading ? 12 : 9;
    const words = clean(raw).split(/\s+/);
    let current = "";
    const flush = () => {
      if (y < 62) {
        y = 0;
        newPage();
      }
      page.drawText(current, {
        x: 42,
        y,
        size,
        font,
        color: rgb(0.12, 0.15, 0.14),
      });
      y -= heading ? 20 : 14;
      current = "";
    };
    for (const word of words) {
      for (const chunk of word.match(/.{1,75}/g) ?? [""]) {
        const candidate = current ? `${current} ${chunk}` : chunk;
        if (current && font.widthOfTextAtSize(candidate, size) > 505) flush();
        current = current ? `${current} ${chunk}` : chunk;
      }
    }
    flush();
  }
  newPage();
  line(report.title, true);
  for (const section of report.sections) {
    y -= 10;
    line(section.title, true);
    section.lines.forEach((s) => line(s));
  }
  pdf
    .getPages()
    .forEach((p, i) =>
      p.drawText(
        `Motor ${FINANCIAL_VERSION} | Revision ${FINANCIAL_REVIEW_DATE} | ${i + 1}/${pdf.getPageCount()}`,
        { x: 42, y: 32, size: 8, font: regular },
      ),
    );
  return pdf.save();
}
export async function downloadFinancialReport(
  report: FinancialReport,
  filename: string,
): Promise<void> {
  const bytes = await createFinancialPdf(report);
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
