import {
  AlignmentType, BorderStyle, Document, PageBreak, Footer, Header, HorizontalPositionRelativeFrom, ImageRun, Packer, PageNumber,
  Paragraph, ShadingType, Table, TableCell, TableLayoutType, TableRow, TextRun, VerticalPositionRelativeFrom, WidthType,
} from "docx";
import { COLORS, type Block, type Documento } from "./modelo";

/*
  Word con el diseño de las plantillas: carta, márgenes 1008/1512/1080, logotipo en el
  encabezado, títulos azul marino, subtítulos verdes, tablas con encabezado azul y franja
  de marca en el pie (imagen). Las fuentes Archivo se incrustan cuando se pueden leer.
*/

export type DocumentoDocxAssets = { logo: Uint8Array; logoSize: { width: number; height: number }; pie: Uint8Array; regular?: Uint8Array; bold?: Uint8Array };

let FONT = "Archivo", INK: string = COLORS.navy, BODY = 11;
const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const borders = { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none };
const TWIP_WIDTH = 10224;

const run = (text: string, opts: { size: number; color?: string; bold?: boolean }) =>
  text.split("\n").map((line, i) => new TextRun({ text: line, break: i > 0 ? 1 : undefined, font: FONT, size: opts.size * 2, color: opts.color ?? INK, bold: opts.bold ?? false }));

function table(widths: number[], header: string[] | undefined, rows: string[][], band = false, labels = false, dark = false, small = false) {
  const total = widths.reduce((a, b) => a + b, 0), cols = widths.map(w => Math.round(w / total * TWIP_WIDTH));
  const size = labels ? BODY : small ? 7.5 : 9.5;
  const cell = (text: string, i: number, fill: string, color: string, bold: boolean) => new TableCell({
    width: { size: cols[i], type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, color: "auto", fill },
    margins: { top: labels ? 30 : 75, bottom: labels ? 30 : 75, left: 75, right: 75 },
    children: [new Paragraph({ alignment: labels && i > 0 ? AlignmentType.JUSTIFIED : undefined, spacing: { before: labels ? 0 : 60, after: labels ? 20 : 80 }, children: run(text, { size, color, bold }) })],
  });
  const fills = [COLORS.band2, COLORS.band1];
  return new Table({
    width: { size: TWIP_WIDTH, type: WidthType.DXA }, columnWidths: cols, layout: TableLayoutType.FIXED, borders,
    rows: [
      ...(header ? [new TableRow({ tableHeader: true, cantSplit: true, children: header.map((h, i) => cell(h, i, COLORS.navy, COLORS.white, true)) })] : []),
      ...rows.map((row, index) => new TableRow({ cantSplit: true, children: row.map((c, i) => labels ? (dark ? cell(i === 0 ? c.toUpperCase() : c, i, i === 0 ? COLORS.ink2 : COLORS.value2, i === 0 ? COLORS.white : INK, i === 0) : cell(c, i, i === 0 ? COLORS.band2 : COLORS.band3, INK, i === 0)) : cell(c, i, fills[(band ? index + 1 : index) % 2], INK, false)) })),
    ],
  });
}

const rule = { style: BorderStyle.SINGLE, size: 4, color: COLORS.rule };
function form(label: string | undefined, rows: Array<Array<{ q: string; a: string; w: number }>>, filled = false): Array<Paragraph | Table> {
  const white = { style: BorderStyle.SINGLE, size: 24, color: COLORS.white };
  // Cuadrícula común de 60 columnas: cada renglón reparte sus celdas en proporción a w.
  const unit = TWIP_WIDTH / 60;
  const table = new Table({
    width: { size: TWIP_WIDTH, type: WidthType.DXA }, columnWidths: Array(60).fill(Math.floor(unit)), layout: TableLayoutType.FIXED,
    borders: filled ? { top: white, bottom: white, left: white, right: white, insideHorizontal: white, insideVertical: white } : { top: rule, bottom: rule, left: rule, right: rule, insideHorizontal: rule, insideVertical: rule },
    rows: rows.map(row => {
      const total = row.reduce((s, c) => s + c.w, 0);
      let left = 60;
      return new TableRow({ cantSplit: true, height: { value: 600, rule: "atLeast" }, children: row.map((c, i) => {
        const span = i === row.length - 1 ? left : Math.round(c.w / total * 60); left -= span;
        return new TableCell({ columnSpan: span, width: { size: Math.round(span * unit), type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 80, right: 80 }, ...(filled ? { shading: { type: ShadingType.CLEAR, color: "auto", fill: COLORS.cell } } : {}), children: [
          new Paragraph({ spacing: { after: 40 }, children: run(c.q, { size: filled ? 8 : 9, bold: !filled }) }),
          ...(c.a ? [new Paragraph({ children: run(c.a, { size: 10 }) })] : []),
        ] });
      }) });
    }),
  });
  return [...(label ? [new Paragraph({ keepNext: true, spacing: { before: 160, after: 60 }, children: run(label, { size: 10, bold: true }) })] : []), ...(rows.length ? [table] : [])];
}

function grid(widths: number[], header: string[], rows: string[][]) {
  const total = widths.reduce((s, w) => s + w, 0), cols = widths.map(w => Math.round(w / total * TWIP_WIDTH));
  const cell = (text: string, i: number, head: boolean) => new TableCell({
    width: { size: cols[i], type: WidthType.DXA }, margins: { top: 40, bottom: 40, left: 80, right: 80 },
    ...(head ? { shading: { type: ShadingType.CLEAR, color: "auto", fill: COLORS.head } } : {}),
    children: [new Paragraph({ children: run(text, { size: 9, bold: head }) })],
  });
  return new Table({
    width: { size: TWIP_WIDTH, type: WidthType.DXA }, columnWidths: cols, layout: TableLayoutType.FIXED,
    borders: { top: rule, bottom: rule, left: rule, right: rule, insideHorizontal: rule, insideVertical: rule },
    rows: [new TableRow({ tableHeader: true, children: header.map((h, i) => cell(h, i, true)) }), ...rows.map(row => new TableRow({ cantSplit: true, height: { value: 360, rule: "atLeast" }, children: row.map((c, i) => cell(c, i, false)) }))],
  });
}
function image(label: string, img: import("./imagen").ImagenDocumento | undefined, height: number) {
  const maxW = 660, maxH = Math.round(height * 96 / 72);
  const scale = img ? Math.min(maxW / img.width, maxH / img.height) : 1;
  return new Table({
    width: { size: TWIP_WIDTH, type: WidthType.DXA }, columnWidths: [TWIP_WIDTH], layout: TableLayoutType.FIXED,
    borders: { top: rule, bottom: rule, left: rule, right: rule, insideHorizontal: rule, insideVertical: rule },
    rows: [
      new TableRow({ height: { value: Math.round(height * 20), rule: "atLeast" }, children: [new TableCell({ verticalAlign: "center", shading: { type: ShadingType.CLEAR, color: "auto", fill: COLORS.head }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: img ? [new ImageRun({ type: img.tipo, data: img.bytes, transformation: { width: Math.round(img.width * scale), height: Math.round(img.height * scale) } })] : run(label.toUpperCase(), { size: 11, bold: true }) })] })] }),
    ],
  });
}

function bar(text: string, right: string | undefined, big: boolean, center = false) {
  const left = right !== undefined ? Math.round(TWIP_WIDTH * 8 / 12) : TWIP_WIDTH;
  const cells = [new TableCell({ width: { size: left, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, color: "auto", fill: COLORS.navy }, margins: { top: 60, bottom: 60, left: 100, right: 100 }, children: [new Paragraph({ alignment: center ? AlignmentType.CENTER : undefined, children: run(text, { size: big ? 13 : 9.5, bold: true, color: COLORS.white }) })] })];
  if (right !== undefined) cells.push(new TableCell({ width: { size: TWIP_WIDTH - left, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, color: "auto", fill: COLORS.band2 }, margins: { top: 60, bottom: 60, left: 100, right: 100 }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: run(right, { size: big ? 15 : 10, bold: big }) })] }));
  return new Table({ width: { size: TWIP_WIDTH, type: WidthType.DXA }, columnWidths: cells.length === 2 ? [left, TWIP_WIDTH - left] : [TWIP_WIDTH], layout: TableLayoutType.FIXED, borders, rows: [new TableRow({ children: cells })] });
}
function sheet(rows: Array<Array<{ label?: string; value?: string; w: number; strong?: boolean; big?: boolean }>>) {
  const unit = TWIP_WIDTH / 12, white = { style: BorderStyle.SINGLE, size: 8, color: COLORS.white };
  return new Table({
    width: { size: TWIP_WIDTH, type: WidthType.DXA }, columnWidths: Array(12).fill(Math.floor(unit)), layout: TableLayoutType.FIXED,
    borders: { top: white, bottom: white, left: white, right: white, insideHorizontal: white, insideVertical: white },
    rows: rows.map(row => new TableRow({ cantSplit: true, children: row.map(c => new TableCell({
      columnSpan: c.w, width: { size: Math.round(c.w * unit), type: WidthType.DXA }, margins: { top: 50, bottom: 50, left: 80, right: 80 },
      ...(c.label === undefined ? { shading: { type: ShadingType.CLEAR, color: "auto", fill: COLORS.band2 } } : {}),
      children: [new Paragraph({ children: run((c.label ?? c.value) ?? "", { size: c.big ? 14 : c.label !== undefined ? 9 : 10, bold: c.label !== undefined || !!c.strong || !!c.big }) })],
    })) })),
  });
}

function block(b: Block): Array<Paragraph | Table> {
  switch (b.kind) {
    case "bar": return [new Paragraph({ spacing: { before: 80 }, children: [] }), bar(b.raw ? b.text : b.text.toUpperCase(), b.right, !!b.big, !!b.center)];
    case "right": return [new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 160 }, children: run(b.text, { size: BODY }) })];
    case "label": return [new Paragraph({ keepNext: true, spacing: { before: 120, after: 60 }, children: run(b.text, { size: b.size ?? BODY, bold: true }) })];
    case "h3": return [new Paragraph({ keepNext: true, spacing: { before: 160, after: 60 }, children: run(b.text, { size: 13 }) })];
    case "sheet": return [sheet(b.rows)];
    case "image": return [image(b.label, b.image, b.height), new Paragraph({ spacing: { after: 60 }, children: [] })];
    case "grid": return [grid(b.widths, b.header, b.rows), new Paragraph({ spacing: { after: 60 }, children: [] })];
    case "pagebreak": return [new Paragraph({ children: [new PageBreak()] })];
    case "title": return [new Paragraph({ keepNext: true, spacing: { after: b.bold ? 100 : 160 }, children: run(b.text, { size: b.size ?? (b.bold ? 22 : 27), bold: !!b.bold }) })];
    case "form": return form(b.label, b.rows, !!b.filled);
    case "checks": return [
      new Paragraph({ keepNext: true, spacing: { before: 80, after: 40 }, children: run(b.q, { size: 9.5 }) }),
      new Paragraph({ spacing: { after: 100 }, children: b.options.flatMap(o => run(`${o.value === b.selected ? "☒" : "☐"} ${o.label}     `, { size: 9.5, bold: o.value === b.selected })) }),
    ];
    case "subtitle": return [new Paragraph({ alignment: AlignmentType.CENTER, keepNext: true, spacing: { before: 200, after: 40 }, children: run(b.text, { size: 12, bold: true }) })];
    case "note": return [new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { before: 60, after: 80 }, children: run(b.text, { size: 8.5 }) })];
    case "h1": return [new Paragraph({ keepNext: true, spacing: { before: 240, after: 120 }, children: run(b.text, { size: 21 }) })];
    case "h2": return [new Paragraph({ keepNext: true, spacing: { before: 160, after: 80 }, children: INK === COLORS.black ? run(b.text, { size: 11, bold: true }) : run(b.text, { size: 13, color: COLORS.green }) })];
    case "p": return [new Paragraph({ alignment: AlignmentType.JUSTIFIED, indent: b.indent ? { firstLine: 360 } : undefined, spacing: { after: BODY === 11 ? 120 : 140 }, children: run(b.text, { size: BODY, bold: !!b.strong }) })];
    case "numbered": return [new Paragraph({ keepNext: true, spacing: { before: 240, after: 100 }, children: [...run(`${b.num}  `, { size: 9, bold: true, color: COLORS.wine }), ...run(b.text.toUpperCase(), { size: 12, bold: true })] })];
    case "caption": return [new Paragraph({ spacing: { after: 160 }, children: run(b.text, { size: 9.5, bold: true, color: COLORS.gray }) })];
    case "clause": return [new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 140, line: 250 }, children: [...run(`${b.lead} `, { size: BODY, bold: true }), ...run(b.text, { size: BODY })] })];
    case "center": return [new Paragraph({ alignment: AlignmentType.CENTER, keepNext: true, spacing: { before: 80, after: 120 }, children: run(b.text, { size: BODY, bold: true }) })];
    case "fields": return [table(b.widths, undefined, b.rows, false, true, !!b.dark), new Paragraph({ spacing: { after: 60 }, children: [] })];
    case "signatures": return [new Table({ width: { size: TWIP_WIDTH, type: WidthType.DXA }, columnWidths: b.parties.map(() => Math.round(TWIP_WIDTH / b.parties.length)), layout: TableLayoutType.FIXED, borders, rows: [new TableRow({ cantSplit: true, children: b.parties.map(p => new TableCell({ width: { size: Math.round(TWIP_WIDTH / b.parties.length), type: WidthType.DXA }, children: [
      ...(b.line ? [new Paragraph({ keepNext: true, alignment: AlignmentType.CENTER, spacing: { before: 720 }, children: run("______________________________", { size: BODY }) })] : []),
      new Paragraph({ keepNext: true, alignment: AlignmentType.CENTER, spacing: { before: b.line ? 40 : 720, after: 60 }, children: run(p.role, { size: BODY, bold: true }) }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: run(p.name, { size: BODY }) }),
    ] })) })] })];
    case "band": return [table(b.widths, undefined, b.rows.map(row => row.map(c => `${c.label.toUpperCase()}\n${c.value}`)), true), new Paragraph({ spacing: { after: 80 }, children: [] })];
    case "table": return [table(b.widths, b.header, b.rows, false, false, false, !!b.small), new Paragraph({ spacing: { after: 80 }, children: [] })];
  }
}

export function documentoDocx(doc: Documento, assets: DocumentoDocxAssets): Document {
  const contrato = doc.estilo === "contrato", opinion = doc.estilo === "opinion";
  FONT = contrato ? "Times New Roman" : "Archivo"; INK = contrato || opinion ? COLORS.black : COLORS.navy; BODY = contrato || opinion ? 10.5 : 11;
  const logoWidth = 240, logoHeight = Math.round(logoWidth * assets.logoSize.height / assets.logoSize.width);
  const header = () => new Header({ children: [new Paragraph({ children: [new ImageRun({ type: "png", data: assets.logo, transformation: { width: logoWidth, height: logoHeight } })] })] });
  const footer = () => new Footer({ children: [new Paragraph({ children: [
    new TextRun({ children: [PageNumber.CURRENT, " / ", PageNumber.TOTAL_PAGES], font: FONT, size: 18, color: COLORS.navy }),
    new ImageRun({ type: "png", data: assets.pie, transformation: { width: 816, height: 53 }, floating: {
      horizontalPosition: { relative: HorizontalPositionRelativeFrom.PAGE, offset: 0 },
      verticalPosition: { relative: VerticalPositionRelativeFrom.PAGE, offset: 752 * 12700 }, behindDocument: true, allowOverlap: true,
    } }),
  ] })] });
  const fonts = !contrato && assets.regular ? [{ name: FONT, data: assets.regular as unknown as Buffer }] : undefined;
  return new Document({
    creator: "Fortius Inmuebles", title: doc.title, subject: doc.subject, ...(fonts ? { fonts } : {}),
    styles: { default: { document: { run: { font: FONT, color: INK, size: BODY * 2 } } } },
    sections: [{
      properties: { titlePage: false, page: { size: { width: 12240, height: 15840 }, margin: { top: 1512, right: 1008, bottom: 1080, left: 1008, header: 331, footer: 691 } } },
      headers: { default: header() }, footers: { default: footer() },
      children: doc.blocks.flatMap(block),
    }],
  });
}

export async function documentoDocxBlob(doc: Documento, assets: DocumentoDocxAssets): Promise<Blob> {
  return Packer.toBlob(documentoDocx(doc, assets));
}
