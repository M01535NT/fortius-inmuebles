import "server-only";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { formatoById, validateFormato, type FormatoField } from "./catalog";

const ink = rgb(0.09, 0.12, 0.16);
const muted = rgb(0.38, 0.42, 0.45);
const accent = rgb(0.39, 0.09, 0.16);
const a4: [number, number] = [595.28, 841.89];
const margin = 45;

function displayValue(field: FormatoField, value: unknown): string {
  if (field.type === "money" && typeof value === "number") return new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(value);
  return String(value ?? "").trim();
}

export function receiptParagraphs(data: Record<string, unknown>): string[] {
  const value = (key: string) => String(data[key] ?? "").trim();
  const date = (key: string) => {
    const raw = value(key);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    return new Intl.DateTimeFormat("es-MX", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${raw}T00:00:00Z`));
  };
  const money = (key: string) => typeof data[key] === "number"
    ? new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(data[key] as number)
    : value(key);
  return [
    `Número de recibo: ${value("numeroRecibo")} · Lugar de emisión: ${value("lugarEmision")}`,
    `Con fecha de recepción ${date("fechaPago")}, recibí de ${value("pagador")} la cantidad de ${money("importeRecibido")} ${value("moneda")}, equivalente a ${value("importeLetra")}, por concepto de ${value("concepto")}.`,
    `Los honorarios corresponden a los servicios pactados en ${value("contratoFecha")}, relativos al inmueble ubicado en ${value("inmueble")}, expediente ${value("folio")}.`,
    `El beneficiario del pago es ${value("beneficiario")}. Quien suscribe recibe ${value("representacionBeneficiario")}, en carácter de ${value("caracter")}.`,
    `Medio de pago · ${value("medioPago")} · Referencia: ${value("referenciaPago")}. El importe indicado corresponde al pago efectivamente recibido. Su comprobante se identifica en ${value("soporteRecepcion")}.`,
    `Saldo de los honorarios · Este pago es ${value("pagoParcialTotal")}. El saldo pendiente del concepto indicado, después de aplicar este pago, es ${money("saldo")} ${value("monedaSaldo")}. Su importe se sustenta en ${value("soporteSaldo")}.`,
    "Si el saldo no está comprobado, indique por confirmar. Este recibo reconoce únicamente el pago señalado y no libera otros conceptos u obligaciones.",
    `Observaciones · ${value("observaciones")}. Referencia del CFDI, si se emitió: ${value("cfdiEstado")}. Este recibo no sustituye el CFDI ni el complemento de pagos que corresponda.`,
    `Quien recibe · ${value("receptor")}`,
  ];
}

export async function createFormatoPdf(id: string, data: Record<string, unknown>): Promise<Uint8Array> {
  const definition = formatoById(id);
  if (!definition.readyForEmission) throw new Error("Formato pendiente de cotejo con el original");
  const missing = validateFormato(id, data);
  if (missing.length) throw new Error(`Faltan datos obligatorios: ${missing.join(", ")}`);
  const pdf = await PDFDocument.create();
  pdf.setTitle(definition.title);
  pdf.setAuthor("Fortius Inmuebles");
  pdf.setCreator("Panel Fortius · Formatos exclusivos");
  pdf.registerFontkit(fontkit);
  const [regular, bold, logo] = await Promise.all([
    pdf.embedFont(await readFile(join(process.cwd(), "public/fonts/Archivo-Regular.ttf")), { subset: true }),
    pdf.embedFont(await readFile(join(process.cwd(), "public/fonts/Archivo-SemiBold.ttf")), { subset: true }),
    pdf.embedPng(await readFile(join(process.cwd(), "public/brand/fortius-logo.png"))),
  ]);
  const supported = new Set(regular.getCharacterSet());
  const clean = (value: string) => [...value.normalize("NFC")].map((character) => supported.has(character.codePointAt(0)!) ? character : " ").join("");
  let page: PDFPage = pdf.addPage(a4);
  let y = a4[1] - 115;
  const startPage = () => {
    page.drawImage(logo, { x: margin, y: a4[1] - 72, width: 138, height: 40 });
    page.drawLine({ start: { x: margin, y: a4[1] - 85 }, end: { x: a4[0] - margin, y: a4[1] - 85 }, color: accent, thickness: 1 });
    y = a4[1] - 115;
  };
  startPage();
  const ensure = (height: number) => { if (y - height < 72) { page = pdf.addPage(a4); startPage(); } };
  const wrap = (content: string, font: PDFFont, size: number, width = a4[0] - 2 * margin): string[] => {
    const result: string[] = [];
    for (const paragraph of content.split(/\r?\n/)) {
      let line = "";
      for (const word of clean(paragraph).split(/\s+/)) {
        if (line && font.widthOfTextAtSize(`${line} ${word}`, size) > width) { result.push(line); line = ""; }
        if (font.widthOfTextAtSize(word, size) > width) {
          let piece = "";
          for (const character of word) {
            if (piece && font.widthOfTextAtSize(piece + character, size) > width) { result.push(piece); piece = ""; }
            piece += character;
          }
          line = piece;
        } else line = line ? `${line} ${word}` : word;
      }
      result.push(line);
    }
    return result;
  };
  const write = (content: string, size: number, font: PDFFont, color = ink, gap = 4) => {
    for (const line of wrap(content, font, size)) {
      ensure(size * 1.5);
      page.drawText(line, { x: margin, y, size, font, color });
      y -= size * 1.5;
    }
    y -= gap;
  };
  write(definition.title, 19, bold, accent, 10);
  write(`Expediente ${String(data.folio ?? "")} · Formato ${definition.id}`, 8.5, regular, muted, 14);
  if (id === "18") {
    for (const paragraph of receiptParagraphs(data)) write(paragraph, 10, regular, ink, 12);
  } else for (const field of definition.fields) {
      ensure(48);
      write(field.label.toUpperCase(), 8, bold, muted, 2);
      write(displayValue(field, data[field.key]), 11, regular, ink, 11);
      page.drawLine({ start: { x: margin, y: y + 5 }, end: { x: a4[0] - margin, y: y + 5 }, thickness: 0.35, color: rgb(0.82, 0.84, 0.85) });
      y -= 10;
    }
  if (["09", "14", "15", "16", "18"].includes(id)) {
    ensure(86);
    y -= 28;
    page.drawLine({ start: { x: margin, y }, end: { x: margin + 200, y }, thickness: 0.7, color: ink });
    if (id !== "18") page.drawLine({ start: { x: a4[0] - margin - 200, y }, end: { x: a4[0] - margin, y }, thickness: 0.7, color: ink });
    y -= 15;
    page.drawText(id === "18" ? "Firma de quien recibe" : "Firma", { x: margin, y, size: 8, font: regular, color: muted });
    if (id !== "18") page.drawText("Firma", { x: a4[0] - margin - 200, y, size: 8, font: regular, color: muted });
  }
  for (const [index, item] of pdf.getPages().entries()) item.drawText(`${index + 1} / ${pdf.getPageCount()}`, { x: a4[0] - margin - 30, y: 35, size: 8, font: regular, color: muted });
  return pdf.save();
}

export async function prepareFormatoEmission(id: string, data: Record<string, unknown>) {
  const bytes = await createFormatoPdf(id, data);
  return { bytes, sha256: createHash("sha256").update(bytes).digest("hex") };
}
