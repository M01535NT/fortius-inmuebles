import { AlignmentType, BorderStyle, Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import type { FormatoDefinition, FormatoField } from "./catalog";
import { ENTREVISTA_TABLES, mostrarCampoEntrevista } from "./entrevista";
import { DOCUMENTOS } from "./documento";
import { documentoDocxBlob } from "./documento/docx";
import { imagen, type ImagenDocumento } from "./documento/imagen";

/*
  Copia editable en Word de un formato capturado (decisión del titular, 16/10/2026).
  Se arma con las mismas preguntas y respuestas del borrador; no es el PDF emitido,
  no lleva huella SHA-256 ni sustituye la revisión o la firma del documento.
*/

const TABLE_COLUMNS: Record<string, readonly { key: string; label: string }[]> = { ...Object.fromEntries(Object.entries(ENTREVISTA_TABLES).map(([key, table]) => [key, table.columns])) };
const money = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Preguntas que aplican con las respuestas actuales (las condicionales ocultas no se imprimen). */
export function shownFields(definition: FormatoDefinition, values: Record<string, unknown>): FormatoField[] {
  if (definition.id === "02") return definition.fields.filter(field => mostrarCampoEntrevista(field.key, values));
  return definition.fields;
}

/** Texto de una respuesta: la etiqueta de la opción, la cifra con centavos o la fecha tal cual. */
export function answerText(field: FormatoField, value: unknown): string {
  if (value === undefined || value === null || value === "") return "";
  if (field.options) return field.options.find(option => option.value === value)?.label ?? String(value);
  if (field.type === "money" && typeof value === "number") return `$${money.format(value)}`;
  if (field.type === "date" && typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-");
    return `${d}/${m}/${y}`;
  }
  return typeof value === "object" ? "" : String(value);
}

const border = { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" };
const borders = { top: border, bottom: border, left: border, right: border };
const cell = (text: string, bold = false) => new TableCell({ borders, children: [new Paragraph({ children: [new TextRun({ text, bold, size: 20 })] })] });

function rowsTable(field: FormatoField, rows: Record<string, unknown>[]) {
  const columns = TABLE_COLUMNS[field.key] ?? [...new Set(rows.flatMap(row => Object.keys(row)))].map(key => ({ key, label: key }));
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ tableHeader: true, children: columns.map(column => cell(column.label, true)) }),
      ...rows.map(row => new TableRow({ children: columns.map(column => cell(String(row[column.key] ?? ""))) })),
    ],
  });
}

export function formatoDocument(definition: FormatoDefinition, values: Record<string, unknown>, context: { folio: string; cliente?: string }) {
  const children: Array<Paragraph | Table> = [
    new Paragraph({ heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${definition.id} · ${definition.title}` })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 }, children: [new TextRun({ text: `Fortius Inmuebles · Operación ${context.folio}${context.cliente ? ` · ${context.cliente}` : ""}`, size: 20, color: "595959" })] }),
  ];
  let section: string | undefined;
  for (const field of shownFields(definition, values)) {
    if (field.section && field.section !== section) {
      section = field.section;
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 280, after: 120 }, children: [new TextRun({ text: section })] }));
    }
    const value = values[field.key];
    if (Array.isArray(value)) {
      children.push(new Paragraph({ spacing: { before: 120, after: 60 }, children: [new TextRun({ text: field.label, bold: true, size: 22 })] }));
      children.push(value.length ? rowsTable(field, value as Record<string, unknown>[]) : new Paragraph({ children: [new TextRun({ text: "Sin registros.", size: 22, color: "595959" })] }));
      continue;
    }
    const text = answerText(field, value);
    children.push(new Paragraph({ spacing: { after: 80 }, children: [
      new TextRun({ text: `${field.label}: `, bold: true, size: 22 }),
      new TextRun({ text: text || "Sin respuesta", size: 22, color: text ? undefined : "8C8C8C" }),
    ] }));
  }
  children.push(new Paragraph({ spacing: { before: 360 }, children: [new TextRun({ text: "Copia editable generada desde el panel con los datos del borrador. Los datos declarados deben comprobarse; este archivo no registra consentimiento, aprobación ni firmas.", italics: true, size: 18, color: "595959" })] }));
  return new Document({ creator: "Fortius Inmuebles", title: `${definition.id} · ${definition.title}`, styles: { default: { document: { run: { font: "Calibri" } } } }, sections: [{ children }] });
}

async function bytes(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`No se pudo preparar el Word (${url})`);
  return new Uint8Array(await response.arrayBuffer());
}

/** Word del formato: con el diseño de su plantilla si ya está reproducido; si no, la copia genérica. */
export async function formatoDocxBlob(definition: FormatoDefinition, values: Record<string, unknown>, context: { folio: string; cliente?: string }): Promise<Blob> {
  const documento = DOCUMENTOS[definition.id];
  if (documento) {
    const [logo, pie, regular] = await Promise.all([bytes("/brand/fortius-logo.png"), bytes("/brand/pie-documento.png"), bytes("/fonts/Archivo-Regular.ttf")]);
    // Foto principal y croquis elegidos en el borrador (levantamientos); si no se pueden leer, queda el recuadro.
    const imagenes: Record<string, ImagenDocumento> = {};
    for (const key of ["fotoPrincipalId", "croquisId"]) {
      const assetId = values[key];
      if (typeof assetId !== "string" || !assetId) continue;
      const image = await bytes(`/api/admin/adjuntos/${encodeURIComponent(assetId)}/descargar`).then(data => imagen(data)).catch(() => undefined);
      if (image) imagenes[assetId] = image;
    }
    return documentoDocxBlob(documento(values, { imagenes }), { logo, logoSize: { width: 2550, height: 648 }, pie, regular });
  }
  return Packer.toBlob(formatoDocument(definition, values, context));
}
