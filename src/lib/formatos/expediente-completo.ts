import fontkit from "@pdf-lib/fontkit";
import JSZip from "jszip";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { FORMATOS, formatoById } from "@/lib/formatos/catalog";
import { letterheadBounds, type LetterheadAssets } from "@/lib/letterhead";
import { drawFortiusLetterhead, embedFortiusLetterhead } from "@/lib/pdf-letterhead";

/*
  Expediente en un archivo (FCH-06): la última emisión de cada formato de la operación, en el
  orden del catálogo, precedida de una portada y un índice; o un ZIP con esos mismos PDF sin
  tocar y sus huellas. El PDF unido es una copia de consulta: cada documento sigue valiendo por
  su PDF emitido y su SHA-256, que el ZIP conserva byte por byte.
*/

export type BorradorExpediente = { id: string; formato_id: string; version: number; created_at: string };
export type EmisionExpediente = { id: string; draft_id: string; draft_version: number; sha256: string; path: string; created_at: string; incompleto?: unknown };
export type EntradaExpediente = { formatoId: string; titulo: string; borrador: BorradorExpediente; emision: EmisionExpediente; cambiosSinEmitir: boolean; conFaltantes: boolean };
export type EntradaConArchivo = EntradaExpediente & { bytes: Uint8Array };
export type Fuentes = { regular: Uint8Array; bold: Uint8Array };

/** Tope de documentos por descarga: un expediente real tiene unos 25 formatos. */
export const MAX_DOCUMENTOS_EXPEDIENTE = 80;

const orden = (id: string) => { const index = FORMATOS.findIndex(item => item.id === id); return index < 0 ? FORMATOS.length : index; };

/**
  La última emisión de cada borrador, en el orden del catálogo (y, dentro del mismo formato, del
  borrador más antiguo al más nuevo). Los borradores sin emisión no entran: solo se reúne lo emitido.
*/
export function elegirEmisiones(borradores: readonly BorradorExpediente[], emisiones: readonly EmisionExpediente[]): EntradaExpediente[] {
  const ultima = new Map<string, EmisionExpediente>();
  for (const emision of emisiones) {
    const previa = ultima.get(emision.draft_id);
    if (!previa || emision.created_at > previa.created_at) ultima.set(emision.draft_id, emision);
  }
  return borradores
    .filter(borrador => ultima.has(borrador.id))
    .sort((a, b) => orden(a.formato_id) - orden(b.formato_id) || a.created_at.localeCompare(b.created_at))
    .map(borrador => {
      const emision = ultima.get(borrador.id)!;
      return {
        formatoId: borrador.formato_id, titulo: formatoById(borrador.formato_id).title, borrador, emision,
        cambiosSinEmitir: emision.draft_version < borrador.version,
        conFaltantes: Array.isArray(emision.incompleto) && emision.incompleto.length > 0,
      };
    });
}

const fechaTijuana = (iso: string, conHora = false) => new Intl.DateTimeFormat("es-MX", { timeZone: "America/Tijuana", day: "2-digit", month: "2-digit", year: "numeric", ...(conHora ? { hour: "2-digit", minute: "2-digit", hourCycle: "h23" as const } : {}) }).format(new Date(iso));

/** Nombre de archivo sin acentos ni signos, legible en cualquier sistema. */
export function nombreArchivo(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

export const nombreEnZip = (entrada: EntradaExpediente, posicion: number) =>
  `${String(posicion + 1).padStart(2, "0")}-${entrada.formatoId}-${nombreArchivo(entrada.titulo)}-v${entrada.emision.draft_version}.pdf`;

const nota = (entrada: EntradaExpediente) => [entrada.conFaltantes ? "Emitido con datos por completar" : "", entrada.cambiosSinEmitir ? `El borrador va en la versión ${entrada.borrador.version}; esta es la ${entrada.emision.draft_version}` : ""].filter(Boolean).join(". ");

const NAVY = rgb(6 / 255, 31 / 255, 63 / 255), MUTED = rgb(0.32, 0.36, 0.42), RULE = rgb(0.82, 0.84, 0.88);
const PAGE: [number, number] = [612, 792], LEFT = 50.4, RIGHT = 612 - 50.4;
const FILA = 30, ENCABEZADO_INDICE = 64;

function filasPorHoja() {
  const { top, bottom } = letterheadBounds();
  return Math.floor((PAGE[1] - top - bottom - ENCABEZADO_INDICE) / FILA);
}

/** Recorta una línea al ancho disponible, con puntos suspensivos. */
function cabe(texto: string, font: PDFFont, size: number, ancho: number) {
  if (font.widthOfTextAtSize(texto, size) <= ancho) return texto;
  let corte = texto.length;
  while (corte > 1 && font.widthOfTextAtSize(`${texto.slice(0, corte)}…`, size) > ancho) corte--;
  return `${texto.slice(0, corte)}…`;
}

/**
  PDF unido: portada, índice con la página donde empieza cada documento y las páginas de cada
  emisión copiadas sin cambios. Lanza error si un PDF no se puede leer.
*/
export async function armarExpedientePdf(input: { folio: string; generado: string; entradas: readonly EntradaConArchivo[]; fuentes: Fuentes; membrete: LetterheadAssets }): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const titulo = `Expediente ${input.folio}`;
  pdf.setTitle(titulo); pdf.setAuthor("Fortius Inmuebles"); pdf.setCreator("Panel Fortius · Formatos exclusivos");
  const [regular, bold, arte] = await Promise.all([pdf.embedFont(input.fuentes.regular, { subset: true }), pdf.embedFont(input.fuentes.bold, { subset: true }), embedFortiusLetterhead(pdf, input.membrete)]);
  const soportado = new Set(regular.getCharacterSet());
  const limpio = (texto: string) => [...texto.normalize("NFC")].map(c => soportado.has(c.codePointAt(0)!) ? c : " ").join("");

  const origenes = await Promise.all(input.entradas.map(entrada => PDFDocument.load(entrada.bytes, { updateMetadata: false })));
  const porHoja = filasPorHoja();
  const hojasIndice = Math.max(1, Math.ceil(input.entradas.length / porHoja));
  const frente = 1 + hojasIndice;
  const inicios: number[] = [];
  let siguiente = frente + 1;
  for (const origen of origenes) { inicios.push(siguiente); siguiente += origen.getPageCount(); }
  const total = siguiente - 1;
  const { top } = letterheadBounds();
  const y0 = PAGE[1] - top;

  // Portada.
  const portada = pdf.addPage(PAGE);
  drawFortiusLetterhead(portada, arte, regular, titulo, 1, frente);
  let y = y0 - 70;
  portada.drawText(limpio("Expediente de la operación"), { x: LEFT, y, size: 22, font: bold, color: NAVY });
  y -= 34;
  portada.drawText(limpio(input.folio), { x: LEFT, y, size: 16, font: regular, color: NAVY });
  y -= 40;
  const resumen = [
    `Generado el ${fechaTijuana(input.generado, true)} (hora de Tijuana).`,
    `${input.entradas.length} ${input.entradas.length === 1 ? "documento emitido" : "documentos emitidos"}, ${total} páginas en total.`,
    "Reúne la última emisión de cada formato, en el orden del proceso.",
    "Es una copia de consulta: cada documento vale por su PDF emitido y su huella SHA-256,",
    "que aparece en el índice. Los borradores sin emitir no se incluyen.",
  ];
  for (const linea of resumen) { portada.drawText(limpio(linea), { x: LEFT, y, size: 11, font: regular, color: NAVY }); y -= 17; }

  // Índice.
  for (let hoja = 0; hoja < hojasIndice; hoja++) {
    const page: PDFPage = pdf.addPage(PAGE);
    drawFortiusLetterhead(page, arte, regular, titulo, 2 + hoja, frente);
    let fila = y0 - 30;
    page.drawText(limpio(hoja ? "Índice (continúa)" : "Índice"), { x: LEFT, y: fila, size: 15, font: bold, color: NAVY });
    fila -= 26;
    page.drawText("Documento", { x: LEFT, y: fila, size: 9, font: bold, color: MUTED });
    page.drawText("Emitido", { x: 400, y: fila, size: 9, font: bold, color: MUTED });
    page.drawText(limpio("Página"), { x: RIGHT - bold.widthOfTextAtSize("Página", 9), y: fila, size: 9, font: bold, color: MUTED });
    fila -= 10;
    page.drawLine({ start: { x: LEFT, y: fila }, end: { x: RIGHT, y: fila }, thickness: 0.6, color: RULE });
    fila -= 14;
    input.entradas.slice(hoja * porHoja, (hoja + 1) * porHoja).forEach((entrada, i) => {
      const posicion = hoja * porHoja + i;
      page.drawText(cabe(limpio(`${entrada.formatoId} · ${entrada.titulo}`), bold, 10, 340), { x: LEFT, y: fila, size: 10, font: bold, color: NAVY });
      page.drawText(limpio(`${fechaTijuana(entrada.emision.created_at)} · v${entrada.emision.draft_version}`), { x: 400, y: fila, size: 10, font: regular, color: NAVY });
      const numero = String(inicios[posicion]);
      page.drawText(numero, { x: RIGHT - regular.widthOfTextAtSize(numero, 10), y: fila, size: 10, font: regular, color: NAVY });
      const detalle = [`SHA-256 ${entrada.emision.sha256}`, nota(entrada)].filter(Boolean).join(" · ");
      page.drawText(cabe(limpio(detalle), regular, 7.5, RIGHT - LEFT), { x: LEFT, y: fila - 11, size: 7.5, font: regular, color: MUTED });
      fila -= FILA;
    });
  }

  for (const origen of origenes) {
    const paginas = await pdf.copyPages(origen, origen.getPageIndices());
    for (const pagina of paginas) pdf.addPage(pagina);
  }
  return pdf.save();
}

/** ZIP con los PDF emitidos tal cual (misma huella) y un archivo de huellas para cotejarlos. */
export async function armarExpedienteZip(input: { folio: string; generado: string; entradas: readonly EntradaConArchivo[] }): Promise<Uint8Array> {
  const zip = new JSZip();
  const fecha = new Date(input.generado);
  const lineas = [`Expediente ${input.folio}`, `Generado: ${fechaTijuana(input.generado, true)} (hora de Tijuana)`, "Cada PDF es la última emisión de su formato; su SHA-256 debe coincidir con el de esta lista.", ""];
  input.entradas.forEach((entrada, posicion) => {
    const nombre = nombreEnZip(entrada, posicion);
    zip.file(nombre, entrada.bytes, { date: fecha, binary: true });
    lineas.push(`${nombre}`, `  ${entrada.formatoId} · ${entrada.titulo}`, `  Emitido: ${fechaTijuana(entrada.emision.created_at, true)} · versión ${entrada.emision.draft_version}`, `  SHA-256: ${entrada.emision.sha256}`, ...(nota(entrada) ? [`  Nota: ${nota(entrada)}`] : []), "");
  });
  zip.file("huellas.txt", lineas.join("\r\n"), { date: fecha });
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 6 } });
}
