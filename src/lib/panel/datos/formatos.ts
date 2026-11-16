import { emiteIncompleto, FORMATOS, formatoById, validateFormato, type FormatoDefinition, type FormatoField } from "@/lib/formatos/catalog";
import { isLevantamiento, LEVANTAMIENTO_TIPO, type LevantamientoId } from "@/lib/formatos/levantamiento";
import { normalizar } from "@/lib/panel/buscar";

/**
 * Formatos (PN-06, boceto «Formatos» del 15/11/2026): catálogo por lo que quieres hacer, borradores y emitidos.
 * Usa los formatos que ya existen (`src/lib/formatos`) y sus rutas del servidor; aquí solo hay funciones puras.
 */

export type GrupoFormato = "conocer" | "revisar" | "vender" | "rentar" | "cerrar";
export const NOMBRE_GRUPO_FORMATO: Record<GrupoFormato, string> = {
  conocer: "Conocer al cliente y al inmueble",
  revisar: "Revisar y opinar",
  vender: "Intermediar y vender",
  rentar: "Rentar",
  cerrar: "Entregar y cerrar",
};
const GRUPO: Record<string, GrupoFormato> = {
  "01": "conocer", "02": "conocer", "04": "conocer",
  "05": "revisar", "06": "revisar", "07": "revisar", "08": "revisar",
  "09": "vender", "10": "vender", "11": "vender", "12": "vender", "13": "vender", "14": "vender", "15": "vender",
  "20": "rentar", "21": "rentar", "22": "rentar", "23": "rentar",
  "16": "cerrar", "17": "cerrar", "18": "cerrar", "19": "cerrar", "24": "cerrar",
};
/** Una línea de qué es cada formato. */
const QUE_ES: Record<string, string> = {
  "01": "Lo firma la persona antes de dar sus datos.",
  "02": "Primera plática: qué quiere hacer y con qué cuenta.",
  "04": "Visita al inmueble: medidas, estado, servicios y fotos.",
  "05": "Qué documentos hay y qué falta para cerrar.",
  "06": "Si el inmueble se puede vender o rentar sin problema.",
  "07": "Cuánto vale con comparables del mercado.",
  "08": "Cuánto le queda al propietario después de gastos.",
  "09": "El encargo del propietario para vender.",
  "10": "Cómo y dónde se va a promover.",
  "11": "Qué se hizo y cómo va, para el propietario.",
  "12": "Qué busca el comprador y cómo va a pagar.",
  "13": "Cómo le fue en la visita y qué sigue.",
  "14": "La oferta del comprador y lo que responde el propietario.",
  "15": "El compromiso de compraventa antes de escriturar.",
  "16": "La entrega del inmueble, con lo que se recibe.",
  "17": "El cierre de la operación con sus cuentas.",
  "18": "El recibo de los honorarios cobrados.",
  "19": "Cuánto cuesta dejar el inmueble listo.",
  "20": "El contrato entre arrendador e inquilino.",
  "21": "El encargo del propietario para rentar.",
  "22": "Los datos del candidato a inquilino y su revisión.",
  "23": "Cómo se entrega y cómo se devuelve el inmueble rentado.",
  "24": "Venta en pagos; la propiedad pasa al terminar de pagar.",
};
/** Formatos redactados por el agente que esperan la revisión del abogado (DECISIONES, Formatos). */
const REVISION_ABOGADO = new Set(["20", "21", "24"]);
/** Con qué tipo de asunto va cada formato: esos asuntos salen primero al empezarlo. */
const OPERACION: Record<GrupoFormato, string | null> = { conocer: null, revisar: null, vender: "venta", rentar: "renta", cerrar: null };

export type EntradaCatalogo = {
  /** «04» reúne los siete levantamientos; se elige el tipo al empezar. */
  id: string; numero: string; titulo: string; queEs: string; grupo: GrupoFormato; abogado: boolean; tipos?: { valor: LevantamientoId; etiqueta: string }[];
};

export function catalogo(): EntradaCatalogo[] {
  const salida: EntradaCatalogo[] = [];
  for (const f of FORMATOS) {
    if (f.id === "03") continue; // el 03 no existe en el panel nuevo
    if (isLevantamiento(f.id)) {
      if (salida.some((e) => e.id === "04")) continue;
      salida.push({
        id: "04", numero: "04", titulo: "Levantamiento del inmueble", queEs: QUE_ES["04"], grupo: "conocer", abogado: false,
        tipos: (Object.keys(LEVANTAMIENTO_TIPO) as LevantamientoId[]).map((valor) => ({ valor, etiqueta: LEVANTAMIENTO_TIPO[valor] })),
      });
      continue;
    }
    salida.push({ id: f.id, numero: f.id, titulo: f.title, queEs: QUE_ES[f.id] ?? "", grupo: GRUPO[f.id] ?? "conocer", abogado: REVISION_ABOGADO.has(f.id) });
  }
  return salida;
}

export function buscarEnCatalogo(entradas: readonly EntradaCatalogo[], consulta: string): EntradaCatalogo[] {
  const palabras = normalizar(consulta).split(/\s+/).filter(Boolean);
  return entradas.filter((e) => palabras.every((p) => normalizar(`${e.numero} ${e.titulo} ${e.queEs}`).includes(p)));
}

export function agruparCatalogo(entradas: readonly EntradaCatalogo[]): { grupo: GrupoFormato; entradas: EntradaCatalogo[] }[] {
  return (Object.keys(NOMBRE_GRUPO_FORMATO) as GrupoFormato[])
    .map((grupo) => ({ grupo, entradas: entradas.filter((e) => e.grupo === grupo) }))
    .filter((g) => g.entradas.length);
}

/** Los asuntos de la operación que corresponde van primero; dentro, los movidos más recientemente. */
export function ordenarAsuntosPara<T extends { operacion: string; movido: string }>(formatoId: string, asuntos: readonly T[]): T[] {
  const grupo = GRUPO[isLevantamiento(formatoId) ? "04" : formatoId] ?? "conocer";
  const op = OPERACION[grupo];
  return [...asuntos].sort((a, b) => Number(b.operacion === op) - Number(a.operacion === op) || b.movido.localeCompare(a.movido));
}

export function tituloFormato(id: string): string {
  try { return formatoById(id).title; } catch { return `Formato ${id}`; }
}

// ——— Borradores y emitidos (GET /api/admin/documentos) ———

export type DocumentoLista = { id: string; expedienteId: string; folio: string; formatoId: string; version: number; actualizadoEl: string; emitido: boolean };
export type FilaDocumento = { id: string; titulo: string; linea: string; emitido: boolean; actualizadoEl: string };

export function filasDocumentos(docs: readonly DocumentoLista[], nombreAsunto: (expedienteId: string) => string | undefined): FilaDocumento[] {
  return [...docs]
    .sort((a, b) => b.actualizadoEl.localeCompare(a.actualizadoEl))
    .map((d) => ({
      id: d.id, emitido: d.emitido, actualizadoEl: d.actualizadoEl,
      titulo: `${d.formatoId.replace(/^04[A-G]$/, "04")} · ${tituloFormato(d.formatoId)}`,
      linea: [d.folio, nombreAsunto(d.expedienteId)].filter(Boolean).join(" · "),
    }));
}

// ——— Captura sobre el documento ———

/** Tipos que se llenan aquí con un campo; las tablas con filas e imágenes se marcan aparte. */
const SIMPLES = new Set<FormatoField["type"]>(["text", "date", "time", "money", "number", "long", "choice", "multi"]);
export const esSimple = (f: FormatoField) => SIMPLES.has(f.type);

export function campoDe(definicion: FormatoDefinition, clave: string): FormatoField | undefined {
  return definicion.fields.find((f) => f.key === clave);
}

/** Lo que falta para generar el PDF sin aviso (mismas reglas que el servidor). */
export function faltantes(formatoId: string, datos: Record<string, unknown>, folio: string): string[] {
  return validateFormato(formatoId, { ...datos, folio });
}

/** «Generar PDF con N pendientes» siempre se puede salvo en el 01 y el 15, que exigen estar completos. */
export function puedeGenerar(formatoId: string, faltan: number): boolean {
  return faltan === 0 || emiteIncompleto(formatoId);
}

/** Convierte lo escrito al valor que guarda el formato (número para montos, lista para varias opciones). */
export function valorCapturado(campo: FormatoField, texto: string | string[]): unknown {
  if (Array.isArray(texto)) return texto;
  const t = texto.trim();
  if (!t) return undefined;
  if (campo.type === "money" || campo.type === "number") {
    const n = Number(t.replace(/[^\d.-]/g, ""));
    return Number.isFinite(n) ? n : t;
  }
  return texto;
}

/** El valor guardado, como texto para el campo. */
export function textoDe(campo: FormatoField, valor: unknown): string {
  if (valor === undefined || valor === null) return "";
  if (campo.type === "money" && typeof valor === "number") return valor.toLocaleString("es-MX", { maximumFractionDigits: 2 });
  return Array.isArray(valor) ? valor.join(", ") : String(valor);
}

/** Aplica lo escrito a los datos: un valor vacío quita la clave. */
export function aplicar(datos: Record<string, unknown>, cambios: Record<string, unknown>): Record<string, unknown> {
  const salida = { ...datos };
  for (const [k, v] of Object.entries(cambios)) {
    if (v === undefined || v === "" || (Array.isArray(v) && !v.length)) delete salida[k]; else salida[k] = v;
  }
  return salida;
}

const GRUPO_DE_OPERACION: Record<string, GrupoFormato | undefined> = { venta: "vender", renta: "rentar" };

/** Opciones de «Crear documento»: los del tipo de asunto primero. El levantamiento va una sola vez; su tipo se elige después. */
export function opcionesCrearDocumento(operacion: string): { valor: string; etiqueta: string }[] {
  const grupo = GRUPO_DE_OPERACION[operacion];
  const entradas = catalogo();
  const ordenadas = [...entradas.filter((e) => e.grupo === grupo), ...entradas.filter((e) => e.grupo !== grupo)];
  return ordenadas.map((e) => ({ valor: e.id, etiqueta: `${e.numero} · ${e.titulo}` }));
}

/** Tipos del levantamiento (04) para elegir después del formato. */
export const tiposLevantamiento = () => catalogo().find((e) => e.id === "04")?.tipos ?? [];
