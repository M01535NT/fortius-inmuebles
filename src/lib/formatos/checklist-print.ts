import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import type { ChecklistItem } from "./checklist-documentos";
import { fetchLetterhead, letterheadBounds } from "@/lib/letterhead";
import { drawFortiusLetterhead, embedFortiusLetterhead } from "@/lib/pdf-letterhead";
import { fortiusDocxSection } from "@/lib/docx-letterhead";

/*
  Checklist de documentos para entregar al propietario, en PDF o Word. Lista simple
  con casillas; marca los ya recibidos. No es un formato emitido ni lleva huella.
*/

type Context = { folio: string; cliente?: string; recibidos?: string[] };
const INTRO = "Para revisar su inmueble y preparar el dictamen jurídico necesitamos copia de estos documentos. Si alguno no aplica o no lo tiene, coméntelo con su asesor.";

function wrap(text: string, width: number, measure: (t: string) => number) {
  const lines: string[] = []; let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (measure(next) > width && line) { lines.push(line); line = word; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

export async function checklistPdf(items: ChecklistItem[], context: Context): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica), bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const art = await embedFortiusLetterhead(pdf, await fetchLetterhead());
  const body = letterheadBounds();
  const navy = rgb(0.09, 0.16, 0.29), grey = rgb(0.35, 0.35, 0.35), wine = rgb(0.55, 0.1, 0.2);
  let page = pdf.addPage([612, 792]); let y = body.bodyTop - 22;
  const margin = 56, width = 612 - margin * 2;
  const room = (height: number) => { if (y-height<body.bottom) {page=pdf.addPage([612,792]);y=body.bodyTop-12;} };
  page.drawText("Checklist de documentos", { x: margin, y, size: 22, font: bold, color: navy }); y -= 20;
  for(const line of wrap(`Operación ${context.folio}${context.cliente ? ` · ${context.cliente}` : ""}`,width,t=>regular.widthOfTextAtSize(t,10))) { room(14);page.drawText(line, { x: margin, y, size: 10, font: regular, color: grey }); y-=14; } y-=12;
  for (const line of wrap(INTRO, width, t => regular.widthOfTextAtSize(t, 11))) { page.drawText(line, { x: margin, y, size: 11, font: regular, color: grey }); y -= 15; }
  y -= 12;
  for (const item of items) {
    const lines = wrap(item.texto, width - 24, t => regular.widthOfTextAtSize(t, 11.5));
    room(Math.min(lines.length*15+12,body.bodyTop-body.bottom-12));
    const done = context.recibidos?.includes(item.id);
    page.drawRectangle({ x: margin, y: y - 3, width: 11, height: 11, borderColor: wine, borderWidth: 1 });
    if (done) page.drawText("X", { x: margin + 2.5, y: y - 1, size: 9, font: bold, color: wine });
    for(const line of lines) {room(15);page.drawText(line, { x: margin + 22, y, size: 11.5, font: regular, color: navy });y-=15;}
    y -= 12;
  }
  room(18);
  page.drawText("Las copias se usan solo para revisar la operación, conforme al aviso de privacidad.", { x: margin, y, size: 8.5, font: regular, color: grey });
  pdf.getPages().forEach((p,i)=>drawFortiusLetterhead(p,art,bold,'Checklist de documentos',i+1,pdf.getPageCount()));
  return pdf.save();
}

export async function checklistDocx(items: ChecklistItem[], context: Context): Promise<Blob> {
  const assets = await fetchLetterhead();
  const document = new Document({ creator: "Fortius Inmuebles", title: "Checklist de documentos", styles: { default: { document: { run: { font: "Calibri" } } } }, sections: [{ ...fortiusDocxSection(assets,'Checklist de documentos'), children: [
    new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun({ text: "Checklist de documentos" })] }),
    new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: `Fortius Inmuebles · Operación ${context.folio}${context.cliente ? ` · ${context.cliente}` : ""}`, size: 20, color: "595959" })] }),
    new Paragraph({ spacing: { after: 240 }, children: [new TextRun({ text: INTRO, size: 22 })] }),
    ...items.map(item => new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: `${context.recibidos?.includes(item.id) ? "☒" : "☐"}  ${item.texto}`, size: 24 })] })),
    new Paragraph({ alignment: AlignmentType.LEFT, spacing: { before: 360 }, children: [new TextRun({ text: "Las copias se usan solo para revisar la operación, conforme al aviso de privacidad.", italics: true, size: 18, color: "595959" })] }),
  ] }] });
  return Packer.toBlob(document);
}
