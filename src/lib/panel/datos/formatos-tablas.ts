import { ENTREGA_TABLAS } from "@/lib/formatos/entrega";
import { INTERMEDIACION_TABLES } from "@/lib/formatos/intermediacion";
import { INVENTARIO_TABLAS } from "@/lib/formatos/inventario-renta";
import { JURIDICA_TABLES } from "@/lib/formatos/juridica";
import { isLevantamiento, LEVANTAMIENTO_TABLES } from "@/lib/formatos/levantamiento";
import { CARGOS_NETO } from "@/lib/formatos/neto";
import { OPINION_TABLES } from "@/lib/formatos/opinion-juridica";
import { PLAN_TABLES } from "@/lib/formatos/plan";
import { PROMESA_TABLES } from "@/lib/formatos/promesa";
import { REPORTE_TABLES } from "@/lib/formatos/reporte";
import { VALOR_TABLES } from "@/lib/formatos/valor-fields";

/**
 * Tablas con filas de los formatos (PN-06): una sola forma para todas, leída de las definiciones que ya existen en `src/lib/formatos`.
 * Filas fijas (las de la revisión jurídica, el plan o los cargos del neto) se guardan con su `concepto`; las libres se agregan y quitan.
 * Las «opcionales» son filas con nombre que se agregan solo si hacen falta (los dos «Otro cargo» del 08).
 * Las columnas de imagen (fotos del 07) se eligen entre las imágenes subidas al documento.
 */

export type ColumnaTabla = {
  key: string; label: string;
  tipo: "texto" | "numero" | "dinero" | "fecha" | "largo" | "opcion" | "imagen";
  opciones?: { valor: string; etiqueta: string }[];
  /** Se apaga (y se borra lo escrito) cuando otra columna tiene ese valor: el importe de un cargo que «No aplica». */
  apagadaSi?: { columna: string; valor: string };
};
export type Tabla = {
  nombre: string; columnas: ColumnaTabla[]; max: number;
  fijas?: { key: string; label: string }[];
  opcionales?: { key: string; label: string; columnas?: ColumnaTabla[] }[];
  /** Valores con que nace cada fila (fija u opcional). */
  inicial?: FilaTabla;
};
export type FilaTabla = Record<string, unknown>;

type Opcion = { value: string; label: string } | readonly [string, string] | string;
type ColumnaOrigen = { key: string; label: string; type?: string; options?: readonly Opcion[] };
type TablaOrigen = { label?: string; singular?: string; columns: readonly ColumnaOrigen[]; fixed?: readonly { key: string; label: string }[]; max?: number; min?: number };

const opcion = (o: Opcion) => (typeof o === "string" ? { valor: o, etiqueta: o } : Array.isArray(o) ? { valor: o[0], etiqueta: o[1] } : { valor: (o as { value: string }).value, etiqueta: (o as { label: string }).label });
const opciones = (xs: readonly string[]) => xs.map((x) => ({ valor: x, etiqueta: x }));

function normalizar(t: TablaOrigen, maxPorOmision: number): Tabla {
  const nombre = t.label ?? t.singular ?? "Registros";
  return {
    nombre: nombre.charAt(0).toUpperCase() + nombre.slice(1),
    max: t.max ?? maxPorOmision,
    fijas: t.fixed?.length ? t.fixed.map((f) => ({ key: f.key, label: f.label })) : undefined,
    columnas: t.columns.map((c) => ({
      key: c.key, label: c.label,
      tipo: c.type === "asset" ? "imagen" : c.options ? "opcion" : c.type === "money" ? "dinero" : c.type === "number" ? "numero" : c.type === "date" ? "fecha" : c.type === "long" ? "largo" : "texto",
      opciones: c.options?.map(opcion),
    })),
  };
}

// 19 · Presupuesto de obra: las mismas columnas que pide la plantilla (antes en el editor del panel viejo).
const PRESUPUESTO: Record<string, Tabla> = {
  partidas: {
    nombre: "Partida", max: 50,
    columnas: [
      { key: "id", label: "ID único", tipo: "texto" }, { key: "area", label: "Área", tipo: "texto" }, { key: "concepto", label: "Concepto", tipo: "texto" },
      { key: "tipoCosto", label: "Tipo de costo", tipo: "opcion", opciones: opciones(["Material", "Mano de obra", "Equipo", "Servicio", "Indirecto"]) },
      { key: "unidad", label: "Unidad", tipo: "opcion", opciones: opciones(["pieza", "m2", "m3", "metro", "jornada", "lote", "servicio"]) },
      { key: "cantidad", label: "Cantidad", tipo: "numero" }, { key: "precioUnitario", label: "Precio unitario con impuestos", tipo: "dinero" },
      { key: "estado", label: "Estado", tipo: "opcion", opciones: opciones(["Por cotizar", "Cotizado", "Autorizado", "Descartado"]) },
      { key: "soporte", label: "Cotización o autorización", tipo: "texto" },
    ],
  },
  pagos: {
    nombre: "Pago", max: 70,
    columnas: [
      { key: "fechaPago", label: "Fecha de pago", tipo: "fecha" }, { key: "partidaId", label: "ID de partida", tipo: "texto" },
      { key: "proveedor", label: "Proveedor", tipo: "texto" }, { key: "concepto", label: "Concepto del pago", tipo: "texto" },
      { key: "importe", label: "Importe pagado", tipo: "dinero" },
      { key: "medio", label: "Medio", tipo: "opcion", opciones: opciones(["Transferencia", "Efectivo", "Tarjeta", "Cheque", "Otro"]) },
      { key: "comprobante", label: "Comprobante", tipo: "texto" },
      { key: "estado", label: "Estado", tipo: "opcion", opciones: opciones(["Pagado", "Por confirmar", "Anulado"]) },
    ],
  },
};

// 08 · Neto al propietario: cada cargo fijo con estado, importe y justificación; hasta dos «Otro cargo» con su concepto.
const COLUMNAS_CARGO: ColumnaTabla[] = [
  { key: "estado", label: "Estado", tipo: "opcion", opciones: opciones(["Pendiente", "Estimado", "Confirmado", "No aplica"]) },
  { key: "importe", label: "Importe en MXN", tipo: "dinero", apagadaSi: { columna: "estado", valor: "No aplica" } },
  { key: "justificacion", label: "Justificación, fuente y fecha", tipo: "largo" },
];
const NETO: Record<string, Tabla> = {
  erogaciones: {
    nombre: "Cargo", max: CARGOS_NETO.length + 2,
    fijas: CARGOS_NETO.map((c) => ({ key: c.key, label: c.label })),
    opcionales: [
      { key: "otro1", label: "Otro cargo", columnas: [{ key: "descripcion", label: "Concepto específico", tipo: "texto" }, ...COLUMNAS_CARGO] },
      { key: "otro2", label: "Otro cargo", columnas: [{ key: "descripcion", label: "Concepto específico", tipo: "texto" }, ...COLUMNAS_CARGO] },
    ],
    inicial: { estado: "Pendiente", justificacion: "" },
    columnas: COLUMNAS_CARGO,
  },
};

const POR_FORMATO: Record<string, Record<string, TablaOrigen>> = {
  "05": JURIDICA_TABLES, "06": OPINION_TABLES, "07": VALOR_TABLES, "09": INTERMEDIACION_TABLES, "10": PLAN_TABLES,
  "11": REPORTE_TABLES, "15": PROMESA_TABLES, "16": ENTREGA_TABLAS, "21": INTERMEDIACION_TABLES, "23": INVENTARIO_TABLAS,
};
const DIRECTAS: Record<string, Record<string, Tabla>> = { "19": PRESUPUESTO, "08": NETO };

export function tablaDe(formatoId: string, clave: string): Tabla | null {
  const directa = DIRECTAS[formatoId]?.[clave];
  if (directa) return directa;
  const origen = isLevantamiento(formatoId) ? (LEVANTAMIENTO_TABLES as Record<string, TablaOrigen>) : POR_FORMATO[formatoId];
  const t = origen?.[clave];
  return t ? normalizar(t, 30) : null;
}

/** La tabla lleva columnas de imagen (hay que tener a la mano las imágenes del documento). */
export const llevaImagenes = (t: Tabla) => t.columnas.some((c) => c.tipo === "imagen");

const guardadasDe = (valor: unknown) => (Array.isArray(valor) ? (valor.filter((f) => f && typeof f === "object" && !Array.isArray(f)) as FilaTabla[]) : []);

/** Las filas que se ven: las fijas siempre (con lo guardado de cada una), luego las opcionales que ya existan; las libres, como estén. */
export function filasDe(tabla: Tabla, valor: unknown): FilaTabla[] {
  const guardadas = guardadasDe(valor);
  if (!tabla.fijas) return guardadas;
  const fijas = tabla.fijas.map((f) => ({ ...tabla.inicial, ...guardadas.find((g) => g.concepto === f.key), concepto: f.key }));
  const opcionales = (tabla.opcionales ?? []).flatMap((o) => guardadas.filter((g) => g.concepto === o.key).slice(0, 1));
  return [...fijas, ...opcionales];
}

/** Nombre y columnas de una fila: las fijas y opcionales llevan su nombre; las libres, «Partida 3». */
export function filaInfo(tabla: Tabla, fila: FilaTabla, i: number): { nombre: string; columnas: ColumnaTabla[]; quitable: boolean } {
  const fija = tabla.fijas?.find((f) => f.key === fila.concepto);
  if (fija) return { nombre: fija.label, columnas: tabla.columnas, quitable: false };
  const opcional = tabla.opcionales?.find((o) => o.key === fila.concepto);
  if (opcional) return { nombre: opcional.label, columnas: opcional.columnas ?? tabla.columnas, quitable: true };
  return { nombre: `${tabla.nombre} ${i + 1}`, columnas: tabla.columnas, quitable: !tabla.fijas };
}

export const apagada = (c: ColumnaTabla, fila: FilaTabla) => !!c.apagadaSi && fila[c.apagadaSi.columna] === c.apagadaSi.valor;

/** Cambia una celda; un número vacío se quita y uno escrito se guarda como número. Las columnas que quedan apagadas se vacían. */
export function cambiarCelda(tabla: Tabla, filas: readonly FilaTabla[], i: number, columna: ColumnaTabla, texto: string): FilaTabla[] {
  return filas.map((f, j) => {
    if (j !== i) return f;
    const siguiente = { ...f };
    if (texto.trim() === "") delete siguiente[columna.key];
    else if (columna.tipo === "numero" || columna.tipo === "dinero") { const n = Number(texto.replace(/[^\d.-]/g, "")); siguiente[columna.key] = Number.isFinite(n) ? n : texto; }
    else siguiente[columna.key] = texto;
    for (const c of filaInfo(tabla, siguiente, i).columnas) if (apagada(c, siguiente)) delete siguiente[c.key];
    return siguiente;
  });
}

/** Siguiente fila que se puede agregar: una libre vacía o la siguiente opcional sin usar. Null si ya no caben. */
function nuevaFila(tabla: Tabla, filas: readonly FilaTabla[]): FilaTabla | null {
  if (filas.length >= tabla.max) return null;
  if (tabla.opcionales) {
    const libre = tabla.opcionales.find((o) => !filas.some((f) => f.concepto === o.key));
    return libre ? { ...tabla.inicial, concepto: libre.key } : null;
  }
  return tabla.fijas ? null : { ...tabla.inicial };
}
export const puedeAgregar = (tabla: Tabla, filas: readonly FilaTabla[]) => nuevaFila(tabla, filas) !== null;
export const agregarFila = (tabla: Tabla, filas: readonly FilaTabla[]): FilaTabla[] => { const n = nuevaFila(tabla, filas); return n ? [...filas, n] : [...filas]; };
export const quitarFila = (tabla: Tabla, filas: readonly FilaTabla[], i: number): FilaTabla[] =>
  (filaInfo(tabla, filas[i] ?? {}, i).quitable ? filas.filter((_, j) => j !== i) : [...filas]);
/** Texto del botón para agregar: «Agregar partida», «Agregar otro cargo». */
export function textoAgregar(tabla: Tabla, filas: readonly FilaTabla[]): string {
  const libre = tabla.opcionales?.find((o) => !filas.some((f) => f.concepto === o.key));
  return `Agregar ${(libre?.label ?? tabla.nombre).toLowerCase()}`;
}
