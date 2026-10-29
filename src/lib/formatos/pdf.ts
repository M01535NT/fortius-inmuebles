import "server-only";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { formatoById, validateFormato, type FormatoField, emiteIncompleto, avisoIncompleto } from "./catalog";
import { calcularPresupuesto, importePartida, type Partida, type Pago } from "./presupuesto";
import { CARGOS_NETO, calcularNeto, type CargoNeto } from "./neto";
import { ENTREGA_TABLAS, type EntregaRow, type EntregaTabla } from "./entrega";
import { respuestaRequiereRatificacion } from "./oferta";

import { calcularPublicidadReporte, REPORTE_TABLES, type ReporteRow, type ReporteTable } from "./reporte";
import { ENTREVISTA_TABLES, mostrarCampoEntrevista, type EntrevistaTable, type EntrevistaRow } from "./entrevista";
import { JURIDICA_TABLES, mostrarColumnaJuridica, type JuridicaRow } from "./juridica";
import sharp from "sharp";
import { isLevantamiento, LEVANTAMIENTO_TITLES, LEVANTAMIENTO_TABLES, type LevantamientoTable, type LevantamientoRow } from "./levantamiento";
import type { FormatoPdfAsset } from "./assets";
import { promesaParagraphs } from "./promesa";
import { formatAmount } from "@/lib/finance/money";
import { DOCUMENTOS } from "./documento";
import { renderDocumentoPdf } from "./documento/pdf";
import { imagen, type ImagenDocumento } from "./documento/imagen";
import { letterheadBounds } from "@/lib/letterhead";
import { loadLetterhead } from "@/lib/letterhead-server";
import { drawFortiusLetterhead, embedFortiusLetterhead } from "@/lib/pdf-letterhead";

const ink = rgb(0.09, 0.12, 0.16);
const muted = rgb(0.38, 0.42, 0.45);
const accent = rgb(0.39, 0.09, 0.16);
const a4: [number, number] = [595.28, 841.89];
const margin = 45;

function displayValue(field: FormatoField, value: unknown): string {
  if (field.type === "money" && typeof value === "number") return formatAmount(value);
  if (field.type === "choice") return field.options?.find((option) => option.value === value)?.label ?? "";
  if (field.type === "date" && typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return new Intl.DateTimeFormat("es-MX", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${value}T00:00:00Z`));
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
    ? formatAmount(data[key] as number)
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

/** «incompleto»: se emite aunque falten datos (si el formato lo admite) y cada hoja lo dice al pie. */
export async function createFormatoPdf(id: string, data: Record<string, unknown>, assets: FormatoPdfAsset[] = [], options: { incompleto?: boolean } = {}): Promise<Uint8Array> {
  const definition = formatoById(id);
  if (!definition.readyForEmission) throw new Error("Formato pendiente de cotejo con el original");
  const missing = validateFormato(id, data);
  const incompleto = missing.length > 0 && !!options.incompleto && emiteIncompleto(id);
  if (missing.length && !incompleto) throw new Error(`Faltan datos obligatorios: ${missing.join(", ")}`);
  if (isLevantamiento(id)) {
    // Sin fotografía elegida, el PDF incompleto deja su recuadro vacío; una elegida debe venir y estar íntegra.
    if ((!incompleto || data.fotoPrincipalId) && !assets.some((asset) => asset.id === data.fotoPrincipalId && asset.kind === "foto")) throw new Error("Falta la fotografía principal del levantamiento");
    if (data.croquisId && !assets.some((asset) => asset.id === data.croquisId && asset.kind === "croquis")) throw new Error("Falta el croquis elegido para el levantamiento");
  }
  // Formatos con el diseño de su plantilla (carta, banda de datos y tablas de marca).
  const documento = DOCUMENTOS[id];
  if (documento) {
    const [regular, bold] = await Promise.all([
      readFile(join(process.cwd(), "public/fonts/Archivo-Regular.ttf")),
      readFile(join(process.cwd(), "public/fonts/Archivo-SemiBold.ttf")),
    ]);
    // Imágenes adjuntas normalizadas (orientación EXIF, JPEG) para la foto principal y el croquis.
    const imagenes: Record<string, ImagenDocumento> = {};
    for (const asset of assets) {
      const bytes = await sharp(asset.bytes, { limitInputPixels: 40_000_000 }).rotate().resize({ width: 1800, height: 1200, fit: "inside", withoutEnlargement: true }).flatten({ background: "#ffffff" }).jpeg({ quality: 88 }).toBuffer();
      const image = imagen(new Uint8Array(bytes), { caption: asset.caption, source: asset.source, date: asset.observed_on });
      if (image) imagenes[asset.id] = image;
    }
    return renderDocumentoPdf({ ...documento(data, { imagenes }), ...(incompleto ? { aviso: avisoIncompleto(missing) } : {}) }, { regular, bold, ...await loadLetterhead() });
  }
  const pdf = await PDFDocument.create();
  const displayTitle = id === "01" ? "Aviso de privacidad" : id === "02" ? "Entrevista inicial" : isLevantamiento(id) ? LEVANTAMIENTO_TITLES[id] : id === "05" ? "Revisión jurídica y control de cierre" : id === "06" ? "Opinión jurídica del inmueble" : id === "07" ? "Opinión de valor comercial" : id === "08" ? "Estimación del neto" : id === "10" ? "Plan de comercialización" : id === "11" ? "Reporte de comercialización" : id === "12" ? "Perfil del comprador" : id === "13" ? "Visita y retroalimentación" : id === "14" ? "Propuesta de compra" : definition.title;
  pdf.setTitle(id === "15" ? "Contrato de promesa bilateral de compraventa" : displayTitle);
  pdf.setAuthor("Fortius Inmuebles");
  pdf.setCreator("Panel Fortius · Formatos exclusivos");
  pdf.registerFontkit(fontkit);
  const [regular, bold, art] = await Promise.all([
    pdf.embedFont(await readFile(join(process.cwd(), "public/fonts/Archivo-Regular.ttf")), { subset: true }),
    pdf.embedFont(await readFile(join(process.cwd(), "public/fonts/Archivo-SemiBold.ttf")), { subset: true }),
    loadLetterhead().then(assets => embedFortiusLetterhead(pdf, assets)),
  ]);
  const supported = new Set(regular.getCharacterSet());
  const clean = (value: string) => [...value.normalize("NFC")].map((character) => supported.has(character.codePointAt(0)!) ? character : " ").join("");
  let page: PDFPage = pdf.addPage(a4);
  const body = letterheadBounds(...a4);
  let y = body.bodyTop - 19;
  const startPage = () => {
    y = body.bodyTop - 19;
  };
  startPage();
  const ensure = (height: number) => { if (y - height < body.bottom) { page = pdf.addPage(a4); startPage(); } };
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
  if (id !== "15") {
    write(displayTitle, 19, bold, accent, 10);
    write(`Expediente ${String(data.folio ?? "")} · Formato ${definition.id}`, 8.5, regular, muted, 14);
  }
  const fieldLine = (field: FormatoField) => {
    const value = displayValue(field, data[field.key]);
    if (!value) return;
    ensure(42);
    write(field.label, 8, bold, muted, 2);
    write(value, 10, regular, ink, 8);
  };
  const picture = async (asset: FormatoPdfAsset) => {
    const bytes = await sharp(asset.bytes, { limitInputPixels: 40_000_000 }).rotate().resize({ width: 1800, height: 1200, fit: "inside", withoutEnlargement: true }).flatten({ background: "#ffffff" }).jpeg({ quality: 88 }).toBuffer();
    const image = await pdf.embedJpg(bytes);
    const fit = Math.min((a4[0] - 2 * margin) / image.width, 235 / image.height);
    const width = image.width * fit; const height = image.height * fit;
    ensure(height + 100);
    page.drawImage(image, { x: margin + (a4[0] - 2 * margin - width) / 2, y: y - height, width, height });
    y -= height + 14;
    write(`${asset.caption} · ID ${asset.id}`, 8, bold, ink, 3);
    write(`Fuente: ${asset.source}${asset.observed_on ? ` · Fecha: ${asset.observed_on}` : ""}`, 8, regular, muted, 10);
  };
  if (id === "15") {
    const width = a4[0] - 2 * margin;
    const contractParagraph = (content: string) => {
      for (const paragraph of content.split(/\r?\n/)) {
        const lines = wrap(paragraph, regular, 10);
        for (const [index, line] of lines.entries()) {
          ensure(15);
          const words = line.split(" "); const justify = index < lines.length - 1 && words.length > 1;
          if (justify) {
            const space = (width - words.reduce((sum, word) => sum + regular.widthOfTextAtSize(word, 10), 0)) / (words.length - 1);
            let x = margin;
            for (const word of words) { page.drawText(word, { x, y, size: 10, font: regular, color: ink }); x += regular.widthOfTextAtSize(word, 10) + space; }
          } else page.drawText(line, { x: margin, y, size: 10, font: regular, color: ink });
          y -= 15;
        }
        y -= 8;
      }
    };
    const paragraphs = promesaParagraphs(data);
    const signatures = paragraphs.slice(-2).map((signature) => wrap(signature, regular, 9, 220));
    const signatureHeight = Math.max(...signatures.map((lines) => lines.length)) * 14 + 40;
    for (const paragraph of paragraphs.slice(0, -2)) {
      if (["Declaraciones", "Cláusulas", "Firmas"].includes(paragraph) || /^\d{2}\s|^I{1,3}\. PARTE|^III\. AMBAS/.test(paragraph)) {
        ensure(paragraph === "Firmas" ? signatureHeight + 53 : 60); y -= 8;
        const title = ["Declaraciones", "Cláusulas", "Firmas"].includes(paragraph) ? paragraph.toUpperCase() : paragraph;
        for (const line of wrap(title, bold, 11)) { page.drawText(line, { x: margin + (width - bold.widthOfTextAtSize(line, 11)) / 2, y, size: 11, font: bold, color: ink }); y -= 17; }
        y -= 8;
      } else {
        if (paragraph.startsWith("Leído el contrato")) ensure(signatureHeight + 100);
        contractParagraph(paragraph);
      }
    }
    ensure(signatureHeight); y -= 30;
    for (const [index, lines] of signatures.entries()) {
      const x = index ? a4[0] - margin - 220 : margin;
      page.drawLine({ start: { x, y }, end: { x: x + 220, y }, thickness: 0.7, color: ink });
      for (const [lineIndex, line] of lines.entries()) page.drawText(line, { x: x + (220 - regular.widthOfTextAtSize(line, 9)) / 2, y: y - 18 - lineIndex * 14, size: 9, font: regular, color: ink });
    }
    y -= signatureHeight;
  } else if (id === "18") {
    for (const paragraph of receiptParagraphs(data)) write(paragraph, 10, regular, ink, 12);
  } else if (isLevantamiento(id)) {
    write("Inspección visual no pericial. No certifica superficies, seguridad ni uso autorizado. Ante riesgo suspenda el recorrido, registre lo ocurrido y derive a revisión competente.", 9, regular, muted, 10);
    write("Base técnica: D declarado · O observado · M medido orientativamente · C comprobado con evidencia · NV no verificado · NA no aplica. Lo desconocido no equivale a cero.", 9, regular, muted, 12);
    const sectionNote = (section: string) => {
      if (section.startsWith("03")) write("Identifique documento, fecha y página; para M, instrumento, método y responsable. No sume áreas de distinta naturaleza. Si no se midió, anote NV.", 9, regular, muted, 10);
      if (section.startsWith("06") && id !== "04F") write(id === "04A" ? "La cercanía de una red no acredita factibilidad ni capacidad. La observación no confirma linderos, servidumbres ni el uso autorizado." : id === "04G" ? "Registre infraestructura existente. Rentas, cuotas, cobro, contratos y administración se controlan por separado." : "Distinguir servicio conectado, solo visible, declarado, pendiente o NA. La presencia de equipo no acredita funcionamiento ni capacidad.", 9, regular, muted, 10);
      if (id === "04F" && section.startsWith("06")) write("Las dimensiones y capacidades se registran con su base. No se deduce la carga admisible del piso por su apariencia ni se prueba maquinaria durante esta visita.", 9, regular, muted, 10);
      if (id === "04F" && section.startsWith("07")) write("kVA expresa potencia aparente; kW, potencia activa. No son intercambiables. La placa del transformador no acredita capacidad disponible ni factibilidad del suministro.", 9, regular, muted, 10);
      if (id === "04F" && section.startsWith("09")) write("Anote equipos y documentos; no certifique suficiencia contra incendio, seguridad eléctrica ni aptitud de descarga. El desarrollo de un parque requiere un expediente independiente.", 9, regular, muted, 10);
      if (id === "04G" && section.startsWith("04")) write("Use una fila por unidad. Para detalle interior active 04C, 04D, 04E o 04F con el mismo ID de inmueble y su ID de unidad. No sume superficies sin comprobar concepto y ausencia de traslapes.", 9, regular, muted, 10);
    };
    let previous = "";
    for (const field of definition.fields) {
      if (field.section !== previous) {
        sectionNote(previous);
        ensure(/Fotografía principal|Croquis/.test(field.section ?? "") ? 400 : 90);
        write(field.section ?? "", 12, bold, accent, 10);
        previous = field.section ?? "";
      }
      if (field.key === "fotoPrincipalId" || field.key === "croquisId") { await picture(assets.find((asset) => asset.id === data[field.key])!); continue; }
      if (field.type === "levantamientoRows") {
        const key = field.key as LevantamientoTable;
        const rows = data[key] as LevantamientoRow[] | undefined;
        for (const [index, row] of (rows ?? []).entries()) {
          ensure(70); write(`Registro ${index + 1}`, 9, bold, muted, 4);
          for (const column of LEVANTAMIENTO_TABLES[key].columns) write(`${column.label}: ${row[column.key]}`, 9, regular, ink, 4);
          y -= 6;
        }
      } else fieldLine(field);
    }
    sectionNote(previous);
  } else if (id === "02") {
    write("Información declarada por quien responde; las respuestas y documentos deberán revisarse en las etapas correspondientes.", 9, regular, muted, 13);
    let section = "";
    for (const field of definition.fields) {
      if (!mostrarCampoEntrevista(field.key, data)) continue;
      if (field.section && field.section !== section) {
        section = field.section;
        ensure(88);
        write(section, 13, bold, accent, 10);
      }
      if (field.type === "entrevistaRows") {
        const kind = field.key as EntrevistaTable;
        const entries = data[kind] as EntrevistaRow[];
        write(field.label, 9, bold, muted, 5);
        for (const [index, entry] of entries.entries()) {
          ensure(65);
          write(`${index + 1}. ${ENTREVISTA_TABLES[kind].columns.map((column) => `${column.label}: ${entry[column.key]}`).join(" · ")}`, 9, regular, ink, 8);
        }
      } else fieldLine(field);
    }
    write("Esta entrevista no autoriza publicación del inmueble, recepción de dinero, fijación de precio o comisión, ni exclusividad. Si existen varios titulares, debe documentarse la información y voluntad de cada uno. La revisión de títulos, gravámenes y aspectos fiscales queda pendiente de sus soportes.", 9, regular, muted, 14);
  } else if (id === "05") {
    write("Ficha de control documental y decisión por etapa. Los datos declarados, recibidos y verificados tienen alcances distintos.", 9, regular, muted, 12);
    let section = "";
    for (const field of definition.fields) {
      if (field.section && field.section !== section) {
        section = field.section;
        ensure(83);
        write(section, 13, bold, accent, 10);
        if (section === "03 / Control documental") write("Aplica: sí, no o por determinar. Estado: no recibido, recibido, insuficiente o verificado. Recibido no equivale a autenticidad, vigencia ni conformidad jurídica.", 9, regular, muted, 10);
        if (section === "07 / Controles especiales") write("Conforme, hallazgo, pendiente, no aplica o fuera de alcance. Todo NA/FA requiere motivo o evidencia.", 9, regular, muted, 10);
      }
      if (field.type !== "juridicaRows") { fieldLine(field); continue; }
      const config = JURIDICA_TABLES[field.key];
      const rows = data[field.key] as JuridicaRow[];
      write(config.label, 9, bold, muted, 7);
      if (rows.length === 0) { write(field.key === "cargas" ? "No se registraron cargas en esta ficha; esto no prueba su inexistencia." : "No se registraron filas; estado declarado en la conclusión o controles.", 9, regular, muted, 8); continue; }
      for (const [index, entry] of rows.entries()) {
        ensure(65);
        const fixed = config.fixed?.[index];
        write(fixed ? `${fixed.key} · ${fixed.label}` : `${index + 1}. ${entry.id ?? entry.persona ?? entry.acto ?? entry.carga ?? "Registro"}`, 9, bold, ink, 3);
        write(config.columns.filter((column) => mostrarColumnaJuridica(field.key, column.key, entry)).map((column) => {
          const value = entry[column.key] ?? "";
          const shown = column.options?.find((option) => option.value === value)?.label ?? value;
          return `${column.label}: ${shown}`;
        }).join(" · "), 8.5, regular, muted, 8);
      }
    }
    write("Esta ficha no determina automáticamente impuestos, exenciones, factibilidad de servicios, inexistencia de litigios ni facultades para disponer. Cada conclusión debe estar sustentada por el abogado responsable y actualizarse ante hechos nuevos.", 9, regular, muted, 15);
    ensure(85); y -= 20;
    page.drawLine({ start: { x: margin, y }, end: { x: margin + 270, y }, thickness: 0.7, color: ink }); y -= 15;
    write(`${String(data.abogado)} · Cédula ${String(data.cedula)} · ${displayValue(definition.fields.find((field) => field.key === "fechaRevision")!, data.fechaRevision)}`, 8.5, regular, muted, 8);
  } else if (id === "06") {
    const val = (key: string) => displayValue(definition.fields.find((field) => field.key === key)!, data[key]);
    const section = (title: string) => { ensure(78); write(title, 13, bold, accent, 9); };
    write(`${val("fechaEmision")} · Operación ${val("folio")}`, 9, regular, muted, 12);
    write(`${val("destinatario")}\nPresente`, 10, bold, ink, 12);
    write(`Emito esta opinión respecto de ${val("inmueble")}, para ${val("operacion")}. Sus conclusiones tienen el alcance y las limitaciones expresados en este documento.`, 10, regular, ink, 12);
    section("01 / Conclusión ejecutiva");
    write(val("conclusion"), 11, regular, ink, 12);
    write(`La conclusión se apoya en: ${val("sustento")}`, 9, regular, muted, 13);
    section("02 / Objeto y alcance del encargo");
    write(`Objeto. ${val("objeto")}`, 10, regular, ink, 9);
    write(`Alcance. ${val("alcance")}`, 10, regular, ink, 13);
    section("03 / Antecedentes y documentación");
    write(val("antecedentes"), 10, regular, ink, 10);
    write(`Documentos examinados. ${val("documentos")}`, 10, regular, ink, 13);
    page = pdf.addPage(a4); startPage();
    write("Análisis y recomendaciones", 16, bold, accent, 14);
    section("04 / Análisis jurídico");
    write("Titularidad y facultades para disponer", 10, bold, ink, 4);
    write(val("titularidad"), 10, regular, ink, 11);
    write("Situación registral e identidad del inmueble", 10, bold, ink, 4);
    write(val("registro"), 10, regular, ink, 11);
    write("Impedimentos y condiciones de la operación", 10, bold, ink, 4);
    write(val("impedimentos"), 10, regular, ink, 12);
    section("05 / Recomendaciones y próximos pasos");
    write(val("recomendaciones"), 10, regular, ink, 9);
    write(`Responsables y acciones pendientes. ${val("responsables")}`, 10, regular, ink, 12);
    section("06 / Límites y actualización de la opinión");
    write(val("limites"), 10, regular, ink, 9);
    write(`Actualización necesaria. ${val("actualizacion")}`, 10, regular, ink, 18);
    ensure(90);
    y -= 20;
    page.drawLine({ start: { x: margin, y }, end: { x: margin + 255, y }, thickness: 0.7, color: ink });
    y -= 15;
    write(`${val("abogado")} · Cédula profesional ${val("cedula")}`, 9, regular, muted, 5);
    write(`Fecha de emisión: ${val("fechaEmision")}`, 9, regular, muted, 8);
  } else if (id === "08") {
    const totals = calcularNeto(data);
    const cash = (amount: number) => `${formatAmount(amount)} MXN`;
    write("01 / Precio y diferencia", 13, bold, accent, 10);
    for (const field of definition.fields.slice(1, 10)) fieldLine(field);
    if (totals.diferenciaAbsoluta !== null) {
      write(`Diferencia acordado menos sugerido: ${cash(totals.diferenciaAbsoluta)} (${totals.diferenciaPorcentual?.toFixed(2)} % sobre el sugerido)`, 10, regular, ink, 7);
    }
    write(`Precio usado para el neto: ${cash(totals.precioBase)}. El acuerdo con el vendedor no acredita una venta cerrada.`, 10, regular, ink, 12);
    if (y < 260) { page = pdf.addPage(a4); startPage(); }
    write("02 / Erogaciones a cargo del propietario", 13, bold, accent, 10);
    for (const item of data.erogaciones as CargoNeto[]) {
      ensure(57);
      const label = CARGOS_NETO.find((fixed) => fixed.key === item.concepto)?.label ?? item.descripcion ?? "Otro cargo";
      write(label, 9, bold, ink, 2);
      write(`${item.estado} · ${item.estado === "No aplica" ? "0.00 MXN" : cash(item.importe ?? 0)} · ${item.justificacion}`, 9, regular, muted, 8);
    }
    write(`Total de erogaciones estimadas: ${cash(totals.erogaciones)}`, 10, bold, accent, 12);
    ensure(230);
    write("03 / Lo que se estima recibirá el propietario", 13, bold, accent, 10);
    write(`Respaldo fiscal: ${cash(data.precioRespaldoFiscal as number)} · Válido hasta: ${displayValue(definition.fields[12], data.respaldoFiscalValidoHasta)}`, 9, regular, ink, 5);
    write(`Cierre previsto: ${displayValue(definition.fields[13], data.cierrePrevisto)} · Cargos: revisados`, 9, regular, ink, 5);
    write(`Responsable de la estimación: ${String(data.responsableEstimacion)}`, 9, regular, ink, 8);
    write(`NETO ESTIMADO: ${cash(totals.netoEstimado)}`, 16, bold, accent, 12);
    if (totals.netoEstimado < 0) write("Las erogaciones superan el precio: revisar el faltante.", 10, bold, accent, 8);
    else write("Estimación revisada. Puede variar al concretarse la operación.", 10, regular, ink, 8);
    write("Estimación, no garantía de cobro. El precio, impuestos, adeudos y gastos pueden cambiar. Total conjunto antes de repartir entre copropietarios.", 9, regular, muted, 8);
    write("No equivale al saldo por cobrar en firma: los anticipos recibidos deben conciliarse por separado. Evita duplicar cargos.", 9, regular, muted, 8);
  } else if (id === "11") {
    const val = (key: string) => displayValue(definition.fields.find((field) => field.key === key)!, data[key]);
    const money = (amount: number, currency = val("moneda")) => `${formatAmount(amount)} ${currency}`;
    const section = (title: string) => { ensure(65); write(title, 13, bold, accent, 9); };
    const rows = (key: ReporteTable) => data[key] as ReporteRow[];
    const list = (key: ReporteTable) => {
      for (const [index, row] of rows(key).entries()) {
        ensure(52);
        write(`${REPORTE_TABLES[key].label} ${index + 1}`, 9, bold, ink, 2);
        write(REPORTE_TABLES[key].columns.map((column) => {
          const value = row[column.key];
          const rendered = key === "publicidad" && (column.key === "autorizado" || column.key === "ejercido") && typeof value === "number"
            ? money(value, val("monedaPublicidad"))
            : column.key === "fecha" && typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
              ? new Intl.DateTimeFormat("es-MX", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${value}T00:00:00Z`))
              : String(value ?? "");
          return `${column.label}: ${rendered}`;
        }).join(" · "), 8.5, regular, muted, 7);
      }
    };
    const metric = (key: "contactos" | "visitas" | "ofertas") => data[`${key}Estado`] === "pendiente" ? "pendiente de registro" : String(data[key]);
    write(`Resultados del periodo ${val("periodoInicio")} al ${val("periodoFin")}. Reporte ${val("numeroReporte")} del expediente ${val("folio")}.`, 10, regular, muted, 11);
    write(`${val("inmueble")} · Propietario: ${val("propietario")} · Asesor: ${val("asesor")} (${val("contactoAsesor")}) · Emisión: ${val("fechaEmision")} · Estado: ${val("estadoReporte")}.`, 9, regular, ink, 12);
    section("01 / Situación al cierre");
    write(`${val("resumen")}. Cambios de precio o estado: ${val("cambios")}.`, 10, regular, ink, 10);
    write(`Precio vigente: ${money(data.precioVigente as number)}. Base: ${val("baseFiscal")}. Fecha y soporte: ${val("fechaPrecio")} · ${val("soportePrecio")}. Primera publicación: ${val("primeraPublicacion")}; ${val("diasActivos")} días activos. Pausas: ${val("pausasPeriodo")}. Operación: ${val("operacionEstado")}. Plan: ${val("versionPlan")}. Reporte previo: ${val("reportePrevio")}.`, 9, regular, ink, 12);
    section("02 / Respuesta de los interesados");
    write(`Contactos nuevos: ${metric("contactos")}. Visitas realizadas: ${metric("visitas")}. Ofertas nuevas: ${metric("ofertas")}.`, 11, bold, accent, 8);
    write("Contactos nuevos son personas distintas que contactaron por primera vez en el periodo. Cada cita realizada cuenta como visita, incluida una segunda visita. Las ofertas nuevas se cuentan por folio, separadas de sus revisiones. Pendiente indica registro insuficiente; cero, ausencia comprobada.", 9, regular, muted, 9);
    write(`Avance frente al periodo anterior: ${val("comparacion")}. El alcance de distintas plataformas puede incluir a las mismas personas y no equivale a compradores.`, 9, regular, ink, 10);
    list("canales");
    section("03 / Qué nos está diciendo el mercado");
    write(`Comentarios de interesados y frecuencia: ${val("comentarios")}. Interpretación y límites: ${val("interpretacion")}. Acción propuesta: ${val("respuestaPropuesta")}.`, 10, regular, ink, 11);
    page = pdf.addPage(a4); startPage();
    write("Acciones y decisiones", 16, bold, accent, 11);
    section("04 / Visitas y oportunidades en seguimiento");
    if (data.registroVisitas === "pendiente") write("El detalle de citas está pendiente de registro; no se sustituyen los datos faltantes por ceros.", 10, regular, ink, 9);
    else write(`Visitas agendadas: ${val("agendadas")}; realizadas de esas citas: ${val("realizadas")}; canceladas: ${val("canceladas")}; reprogramadas: ${val("reprogramadas")}; pendientes al corte: ${val("pendientes")}.`, 10, regular, ink, 9);
    write(`Ofertas actualizadas o retiradas: ${val("ofertasActualizadas")}. Las ofertas se comunican oportunamente conforme al contrato; este reporte no sustituye su entrega ni acredita aceptación.`, 9, regular, ink, 9);
    if (rows("oportunidades").length) list("oportunidades");
    else write("No hay oportunidades en seguimiento registradas al corte.", 9, regular, muted, 11);
    section("05 / Publicidad pagada");
    if (data.publicidadEstado === "no_contratada") write("No contratado. No se reportan costos internos como publicidad del propietario.", 10, regular, ink, 12);
    else {
      const totals = calcularPublicidadReporte(data);
      write(`Publicidad contratada en ${val("monedaPublicidad")}. Total autorizado: ${money(totals.autorizado, val("monedaPublicidad"))}; total ejercido: ${money(totals.ejercido, val("monedaPublicidad"))}.`, 10, bold, accent, 9);
      list("publicidad");
      write(`Fondos en poder de Fortius: saldo inicial ${money(data.saldoInicial as number, val("monedaPublicidad"))} + recibido ${money(data.fondosRecibidos as number, val("monedaPublicidad"))} − aplicado ${money(data.fondosAplicados as number, val("monedaPublicidad"))} − devuelto ${money(data.fondosDevueltos as number, val("monedaPublicidad"))} = saldo ${money(totals.saldoFondos, val("monedaPublicidad"))}.`, 9, regular, ink, 8);
      write(`Pagos directos al portal: ${money(totals.pagosDirectos, val("monedaPublicidad"))}; no se restan otra vez de los fondos en poder de Fortius. Soporte y destino del saldo: ${val("soporteSaldo")}.`, 9, regular, ink, 9);
      if (totals.ejercido > totals.autorizado) write("El gasto ejercido supera el importe autorizado; requiere revisión y explicación del soporte.", 9, bold, accent, 9);
      if (totals.saldoFondos < 0) write("El saldo calculado de fondos es negativo; conciliar ingresos, aplicaciones y devoluciones.", 9, bold, accent, 9);
      write("La publicidad pagada no está incluida en la comisión y requiere autorización previa. Los importes incluyen impuestos.", 9, regular, muted, 11);
    }
    section("06 / Acciones del siguiente periodo");
    list("acciones");
    section("07 / Decisiones que necesitamos de usted");
    write(`Decisión solicitada: ${val("decisionSolicitada")}. Motivo: ${val("motivoDecision")}. Alcance: ${val("alcanceDecision")}. Fecha límite: ${val("fechaLimiteDecision")}.`, 10, regular, ink, 9);
    write(data.estadoRespuestaPropietario === "recibida" ? `Respuesta recibida; constancia: ${val("constanciaRespuesta")}.` : "Respuesta pendiente. El silencio no aprueba cambios de precio, presupuesto ni condiciones.", 9, regular, ink, 12);
    ensure(150);
    write(`Próximo reporte: ${val("proximoReporte")} por ${val("medioProximoReporte")}. Elaboró: ${val("elaborador")}. Revisó: ${val("revisor")}. Documentos de respaldo: ${val("soportes")}.`, 9, regular, muted, 9);
    write(data.entregaInformeEstado === "entregado" ? `Informe entregado el ${val("fechaEntregaInforme")} por ${val("medioEntregaInforme")}. Acuse: ${val("acuseInforme")}.` : "Entrega del informe pendiente de registrar.", 9, regular, muted, 9);
  } else if (id === "19") {
    const totals = calcularPresupuesto(data);
    const currency = String(data.moneda);
    const cash = (value: number | null) => value === null ? "No hay partidas autorizadas" : `${formatAmount(value)} ${currency}`;
    write("Resumen", 13, bold, accent, 10);
    for (const field of definition.fields.slice(1, 7)) fieldLine(field);
    write(`Subtotal cotizado: ${cash(totals.subtotalCotizado)}`, 10, regular, ink, 6);
    write(`Importe autorizado: ${totals.autorizadoMenosPagado === null ? "No hay partidas autorizadas" : cash(totals.importeAutorizado)}`, 10, regular, ink, 6);
    write(`Estimación con reserva: ${cash(totals.estimacionConReserva)}`, 10, bold, accent, 8);
    write(`Total pagado: ${cash(totals.totalPagado)}`, 10, regular, ink, 6);
    write(`Autorizado menos pagado: ${cash(totals.autorizadoMenosPagado)}`, 10, regular, ink, 6);
    write(`Exceso sobre la estimación: ${cash(totals.excesoSobreEstimacion)}`, 10, regular, ink, 12);
    write("Los precios unitarios incluyen los impuestos y cargos cotizados. Este presupuesto no calcula tasas fiscales.", 9, regular, muted, 10);
    page = pdf.addPage(a4); startPage();
    write("Partidas del presupuesto", 15, bold, accent, 10);
    for (const item of data.partidas as Partida[]) {
      ensure(88);
      write(`${item.id} · ${item.area || "Sin área"} · ${item.concepto}`, 10, bold, ink, 3);
      if (item.estado === "Descartado") write("Descartado; no incluido en los importes.", 9, regular, muted, 10);
      else {
        const amount = formatAmount(importePartida(item));
        write(`${item.tipoCosto} · ${item.cantidad} ${item.unidad} × ${cash(item.precioUnitario)} = ${amount} ${currency} · ${item.estado}`, 9, regular, ink, 3);
        write(`Soporte: ${item.soporte}`, 9, regular, muted, 10);
      }
    }
    page = pdf.addPage(a4); startPage();
    write("Pagos registrados", 15, bold, accent, 10);
    if ((data.pagos as Pago[]).length === 0) write("No hubo pagos registrados al corte; confirmado en la captura.", 10, regular, ink, 12);
    for (const item of data.pagos as Pago[]) {
      ensure(75);
      write(`${item.fechaPago || "Sin fecha"} · ${item.partidaId || "Sin partida"} · ${item.proveedor || "Sin proveedor"}`, 10, bold, ink, 3);
      write(`${item.concepto || "Sin concepto"} · ${item.estado} · ${item.estado === "Pagado" ? cash(item.importe) : "No sumado"}`, 9, regular, ink, 3);
      write(`Medio: ${item.medio || "No indicado"} · Comprobante: ${item.comprobante || "No indicado"}`, 9, regular, muted, 10);
    }
    write("Sólo se suman importes efectivamente pagados y respaldados. Las partidas descartadas y los pagos anulados no integran los totales.", 9, regular, muted, 12);
  } else if (id === "12") {
    write("Una conversación para entender qué busca y cómo puede realizar la compra.", 10, regular, muted, 13);
    for (const field of definition.fields.slice(1, 8)) fieldLine(field);
    if (y < 230) { page = pdf.addPage(a4); startPage(); }
    write("01 / La búsqueda", 13, bold, accent, 10);
    for (const field of definition.fields.slice(8, 15)) fieldLine(field);
    if (y < 230) { page = pdf.addPage(a4); startPage(); }
    write("02 / El presupuesto y la forma de pago", 13, bold, accent, 10);
    write("Precisar lo posible, resolver pendientes y acordar la siguiente acción.", 9, regular, muted, 10);
    for (const field of definition.fields.slice(15, 31)) fieldLine(field);
    if (y < 230) { page = pdf.addPage(a4); startPage(); }
    write("03 / El plazo y el siguiente paso", 13, bold, accent, 10);
    for (const field of definition.fields.slice(31)) fieldLine(field);
    write("Los importes son declarados salvo soporte identificado. Una precalificación no garantiza el crédito. Poner a disposición el aviso de privacidad y registrar el seguimiento en el tablero.", 9, regular, muted, 12);
  } else if (id === "13") {
    write("Registrar la experiencia del interesado y acordar cómo continuar.", 10, regular, muted, 13);
    for (const field of definition.fields.slice(1, 11)) fieldLine(field);
    write("01 / Lo que comenta el interesado", 13, bold, accent, 10);
    if (data.estadoCita === "realizada") for (const field of definition.fields.slice(11, 15)) fieldLine(field);
    else write("No aplica: la cita no se realizó.", 10, regular, muted, 12);
    if (y < 190) { page = pdf.addPage(a4); startPage(); }
    write("02 / Su interés en continuar", 13, bold, accent, 10);
    if (data.estadoCita === "realizada") for (const field of definition.fields.slice(15, 17)) fieldLine(field);
    else write("No se recabó una decisión del interesado durante esta cita.", 10, regular, muted, 12);
    write("03 / Seguimiento del asesor", 13, bold, accent, 10);
    for (const field of definition.fields.slice(17)) fieldLine(field);
  } else if (id === "16") {
    const val = (key: string) => displayValue(definition.fields.find((field) => field.key === key)!, data[key]);
    const section = (title: string) => { ensure(60); write(title, 13, bold, accent, 9); };
    const entries = (key: EntregaTabla, state: string) => {
      section(ENTREGA_TABLAS[key].label);
      const rows = data[key] as EntregaRow[] | undefined;
      if (!rows?.length) { write(state, 9, regular, ink, 10); return; }
      for (const row of rows) {
        ensure(45);
        write(ENTREGA_TABLAS[key].columns.map((column) => `${column.label}: ${row[column.key]}`).join(" · "), 9, regular, ink, 9);
      }
    };
    write(`En ${val("lugar")}, el ${val("fecha")} a las ${val("horaInicio")}, se documenta la entrega del inmueble ubicado en ${val("inmueble")}, expediente ${val("folio")}, conforme a ${val("contratoReferencia")}.`, 10, regular, ink, 10);
    write(`Quien entrega: ${val("quienEntrega")}, ${val("caracterEntrega")}. Identificación y representación: ${val("identificacionEntrega")}. Quien recibe: ${val("quienRecibe")}, ${val("caracterRecibe")}. Identificación y representación: ${val("identificacionRecibe")}. Comparecieron: ${val("presentes")}.`, 10, regular, ink, 12);
    section("01 / Resultado de la entrega");
    write(`Resultado: ${val("resultadoEntrega")}. ${data.resultadoEntrega === "no_realizada" ? `Motivo: ${val("motivoNoEntrega")}.` : `Se recibieron ${val("areasEntregadas")}; quedaron sin entregar ${val("areasSinEntregar")}. Recepción efectiva: ${val("recepcionFecha")} a las ${val("recepcionHora")}.`}`, 10, regular, ink, 8);
    write(`Ocupantes o bienes de terceros: ${val("ocupantesTerceros")}.`, 10, regular, ink, 10);
    section("02 / Estado del inmueble");
    write(`Áreas revisadas: ${val("areasRevisadas")}. Sin revisar: ${val("areasNoRevisadas")}.`, 10, regular, ink, 8);
    entries("diferencias", val("estadoDiferencias"));
    entries("accesos", val("estadoAccesos"));
    entries("documentos", val("estadoDocumentos"));
    entries("servicios", val("estadoServicios"));
    write("Una lectura no acredita saldo cero. Si no se pudo leer un medidor, se indica en la observación.", 9, regular, muted, 10);
    entries("pendientes", val("estadoPendientes"));
    ensure(230);
    section("07 / Reservas y firma");
    write(`Quien entrega manifiesta: ${val("manifestacionEntrega")}. Quien recibe reserva: ${val("reservasRecibe")}. Manifestaciones no comprobadas: ${val("manifestacionesNoComprobadas")}.`, 10, regular, ink, 10);
    write(`Fotografías o inventario complementario: ${val("anexos")}. El acto concluyó a las ${val("horaFinal")}. Ausencias de firma: ${val("ausenciasFirma")}.`, 10, regular, ink, 10);
    write("Esta acta acredita los hechos asentados dentro del alcance de cada firma; no acredita pago del precio, ausencia de adeudos ni funcionamiento no probado. No implica finiquito automático ni renuncia a derechos por defectos no examinados. Los pendientes continúan hasta comprobar su cumplimiento.", 9, regular, muted, 10);
    write("Quienes firman recibirán una copia completa.", 9, regular, muted, 10);
  } else if (id === "17") {
    write("Control interno para registrar el resultado de la operación, localizar su documentación y asignar el seguimiento que continúe. No es un finiquito ni acredita por sí solo el cumplimiento de obligaciones.", 10, regular, muted, 15);
    write("01 / Identificación", 13, bold, accent, 10);
    for (const field of definition.fields.slice(0, 3)) fieldLine(field);
    write("02 / Resultado", 13, bold, accent, 10);
    for (const field of definition.fields.slice(3, 8)) fieldLine(field);
    page = pdf.addPage(a4); startPage();
    write("03 / Comprobación del cierre", 13, bold, accent, 8);
    write("Anote comprobado, pendiente o no aplica; cite el archivo que permite verificarlo. No repita su contenido.", 9, regular, muted, 12);
    for (let index = 8; index < 18; index += 2) {
      ensure(55);
      const status = definition.fields[index];
      const reference = definition.fields[index + 1];
      write(status.label, 8, bold, muted, 1);
      write(`${displayValue(status, data[status.key])} · ${displayValue(reference, data[reference.key])}`, 9, regular, ink, 6);
    }
    write("04 / Seguimiento pendiente", 13, bold, accent, 8);
    for (const field of definition.fields.slice(18, 21)) fieldLine(field);
    write("Con pendientes y responsable asignado, use terminado con seguimiento; sin responsable, no procede cerrar. Si no hay pendientes, escriba ninguno.", 9, regular, muted, 12);
    ensure(190);
    write("05 / Archivo", 13, bold, accent, 8);
    for (const field of definition.fields.slice(21)) fieldLine(field);
    write("Archivar no significa borrar. Conserve los documentos conforme al criterio aplicable al expediente; cualquier depuración se decide por separado.", 9, regular, muted, 12);
  } else for (const field of definition.fields) {
      ensure(48);
      write(field.label.toUpperCase(), 8, bold, muted, 2);
      write(displayValue(field, data[field.key]), 11, regular, ink, 11);
      page.drawLine({ start: { x: margin, y: y + 5 }, end: { x: a4[0] - margin, y: y + 5 }, thickness: 0.35, color: rgb(0.82, 0.84, 0.85) });
      y -= 10;
    }
  if (["09", "16", "18"].includes(id)) {
    const left = wrap(id === "18" ? "Firma de quien recibe" : id === "16" ? `Quien entrega: ${String(data.quienEntrega)}` : "Firma", regular, 8, 200);
    const right = id === "18" ? [] : wrap(id === "16" ? `Quien recibe: ${String(data.quienRecibe)}` : "Firma", regular, 8, 200);
    const captionHeight = Math.max(left.length, right.length) * 12;
    ensure(58 + captionHeight);
    y -= 28;
    page.drawLine({ start: { x: margin, y }, end: { x: margin + 200, y }, thickness: 0.7, color: ink });
    if (id !== "18") page.drawLine({ start: { x: a4[0] - margin - 200, y }, end: { x: a4[0] - margin, y }, thickness: 0.7, color: ink });
    y -= 15;
    left.forEach((line, index) => page.drawText(line, { x: margin, y: y - index * 12, size: 8, font: regular, color: muted }));
    right.forEach((line, index) => page.drawText(line, { x: a4[0] - margin - 200, y: y - index * 12, size: 8, font: regular, color: muted }));
    y -= captionHeight;
  }
  for (const [index, item] of pdf.getPages().entries()) drawFortiusLetterhead(item, art, bold, displayTitle, index + 1, pdf.getPageCount());
  return pdf.save();
}

export async function prepareFormatoEmission(id: string, data: Record<string, unknown>, assets?: FormatoPdfAsset[], options: { incompleto?: boolean } = {}) {
  const bytes = await createFormatoPdf(id, data, assets, options);
  return { bytes, sha256: createHash("sha256").update(bytes).digest("hex") };
}
