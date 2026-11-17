/*
  Búsqueda del inventario público (etapa 2, 17/11/2026). Funciones puras: las usan el servidor
  (primera parte de resultados y la ruta que entrega «Cargar más») y la página (leer y escribir
  los filtros en la dirección). Así ambos filtran y ordenan exactamente igual.
*/
import { TIPO_LABELS, type Operacion, type Property, type TipoPropiedad } from "@/data/propiedades";
import { segmentoInmueble, tiposDeSegmento, type SegmentoInmueble } from "@/lib/inmueble-segmentos";

export type Orden = "recientes" | "precio-asc" | "precio-desc" | "superficie";
export type Moneda = "todas" | "MXN" | "USD";
export type Vista = "cuadricula" | "lista" | "mapa";

export type Filtros = {
  operacion: Operacion | "todas";
  segmento: SegmentoInmueble | "todos";
  tipo: TipoPropiedad | "todos";
  zona: string; // "todas" o nombre exacto
  moneda: Moneda;
  min: string;
  max: string;
  orden: Orden;
};

export const FILTROS_INICIALES: Filtros = {
  operacion: "todas",
  segmento: "todos",
  tipo: "todos",
  zona: "todas",
  moneda: "todas",
  min: "",
  max: "",
  orden: "recientes",
};

/** Cuántos inmuebles trae cada parte (la primera y cada «Cargar más»). */
export const POR_PARTE = 12;
/** Tope de una sola petición, para que nadie pida el inventario entero de golpe. */
export const MAXIMO_POR_PETICION = 60;

const ORDENES: readonly Orden[] = ["recientes", "precio-asc", "precio-desc", "superficie"];

type Lector = { get(nombre: string): string | null };

/** Lee los filtros de la dirección. Lo que no se reconoce se ignora. */
export function filtrosDesdeParams(p: Lector): Filtros {
  const op = p.get("op");
  const tipo = p.get("tipo");
  const segmento = segmentoInmueble(p.get("segmento"));
  const zona = p.get("zona")?.trim();
  const orden = p.get("orden");
  const monedaParam = p.get("moneda");
  const min = /^\d{1,12}$/.test(p.get("min") ?? "") ? (p.get("min") as string) : "";
  const max = /^\d{1,12}$/.test(p.get("max") ?? "") ? (p.get("max") as string) : "";
  const ordenValido = ORDENES.includes(orden as Orden) ? (orden as Orden) : "recientes";
  const usaPrecio = Boolean(min || max || ordenValido === "precio-asc" || ordenValido === "precio-desc");
  const tipoValido = tipo && tipo in TIPO_LABELS && (!segmento || (tiposDeSegmento(segmento) as readonly string[]).includes(tipo)) ? (tipo as TipoPropiedad) : "todos";
  return {
    operacion: op === "venta" || op === "renta" ? op : "todas",
    segmento: segmento ?? "todos",
    tipo: tipoValido,
    zona: zona && zona.length <= 80 ? zona : "todas",
    moneda: monedaParam === "MXN" || monedaParam === "USD" ? monedaParam : usaPrecio ? "MXN" : "todas",
    min,
    max,
    orden: ordenValido,
  };
}

export function vistaDesdeParams(p: Lector): Vista {
  const vista = p.get("vista");
  return vista === "lista" || vista === "mapa" ? vista : "cuadricula";
}

/** Escribe los filtros y la vista como texto de búsqueda («op=renta&zona=Playas»), sin «?». */
export function paramsDesdeFiltros(f: Filtros, vista: Vista = "cuadricula"): string {
  const p = new URLSearchParams();
  if (f.operacion !== "todas") p.set("op", f.operacion);
  if (f.segmento !== "todos") p.set("segmento", f.segmento);
  if (f.tipo !== "todos") p.set("tipo", f.tipo);
  if (f.zona !== "todas") p.set("zona", f.zona);
  if (f.moneda !== "todas") p.set("moneda", f.moneda);
  if (f.min) p.set("min", f.min);
  if (f.max) p.set("max", f.max);
  if (f.orden !== "recientes") p.set("orden", f.orden);
  if (vista !== "cuadricula") p.set("vista", vista);
  return p.toString();
}

export function hayFiltros(f: Filtros): boolean {
  return (Object.keys(FILTROS_INICIALES) as (keyof Filtros)[]).some((k) => k !== "orden" && f[k] !== FILTROS_INICIALES[k]);
}

function montoPublico(p: Property): number | null {
  return p.precio.modalidad === "publico" ? p.precio.monto : null;
}

function superficie(p: Property): number | null {
  return p.ficha.construccionM2 ?? p.ficha.terrenoM2 ?? null;
}

/** Filtra y ordena. «Valor a consulta» queda fuera al filtrar por precio y al final al ordenar. */
export function aplicarFiltros(propiedades: readonly Property[], f: Filtros): Property[] {
  const min = f.min ? Number(f.min) : null;
  const max = f.max ? Number(f.max) : null;
  const tiposSegmento = f.segmento !== "todos" ? (tiposDeSegmento(f.segmento) as readonly string[]) : null;
  return propiedades
    .filter((p) => {
      if (f.operacion !== "todas" && p.operacion !== f.operacion) return false;
      if (tiposSegmento && !tiposSegmento.includes(p.tipo)) return false;
      if (f.tipo !== "todos" && p.tipo !== f.tipo) return false;
      if (f.zona !== "todas" && p.zona !== f.zona) return false;
      if (f.moneda !== "todas" && (p.precio.modalidad !== "publico" || p.precio.moneda !== f.moneda)) return false;
      if (min !== null || max !== null) {
        const monto = montoPublico(p);
        if (monto === null) return false;
        if (min !== null && monto < min) return false;
        if (max !== null && monto > max) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (f.orden === "recientes") return b.publicadaEl.localeCompare(a.publicadaEl);
      const [va, vb] = f.orden === "superficie" ? [superficie(a), superficie(b)] : [montoPublico(a), montoPublico(b)];
      if (va === null && vb === null) return 0;
      if (va === null) return 1;
      if (vb === null) return -1;
      return f.orden === "precio-asc" ? va - vb : vb - va;
    });
}

/** Lo que la página necesita para armar sus listas, sin mandar el inventario completo. */
export type OpcionesInventario = {
  zonas: string[];
  tipos: TipoPropiedad[];
  /** Inmuebles publicados en total, sin filtros. */
  total: number;
};

export function opcionesDe(propiedades: readonly Property[]): OpcionesInventario {
  return {
    zonas: Array.from(new Set(propiedades.map((p) => p.zona))).sort((a, b) => a.localeCompare(b, "es")),
    tipos: Array.from(new Set(propiedades.map((p) => p.tipo))),
    total: propiedades.length,
  };
}

/** Una parte de resultados: los inmuebles, cuántos hay en total y las zonas con resultados (mapa). */
export type ParteInventario = {
  propiedades: Property[];
  encontrados: number;
  zonasConResultados: { zona: string; cuantos: number }[];
};

export function parteDe(todas: readonly Property[], f: Filtros, desde: number, cuantos: number): ParteInventario {
  const resultados = aplicarFiltros(todas, f);
  const conteo = new Map<string, number>();
  for (const p of resultados) conteo.set(p.zona, (conteo.get(p.zona) ?? 0) + 1);
  const inicio = Math.max(0, desde);
  const fin = inicio + Math.min(Math.max(1, cuantos), MAXIMO_POR_PETICION);
  return {
    propiedades: resultados.slice(inicio, fin),
    encontrados: resultados.length,
    zonasConResultados: Array.from(conteo, ([zona, n]) => ({ zona, cuantos: n })),
  };
}
