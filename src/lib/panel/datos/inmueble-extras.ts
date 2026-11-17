import type { Property } from "@/data/propiedades";
import type { EventoConResultado } from "@/lib/panel/datos/agenda-resultado";
import type { BuyerNotice } from "@/lib/propiedad-seguimiento";

/**
 * Datos del boceto de Inmuebles (16/11/2026) que todavía no tienen columna propia. El servidor guarda el inmueble
 * con `passthrough` y la proyección pública los quita, así que viajan como campos extra privados del registro:
 * si faltan, la pantalla los trata como vacíos y nada se rompe.
 */

export const DOCUMENTOS_INMUEBLE = [
  ["contrato", "Contrato de intermediación"],
  ["escritura", "Escritura"],
  ["predial", "Predial al corriente"],
  ["ine", "Identificación del propietario"],
  ["agua", "Recibo de agua"],
  ["luz", "Recibo de luz"],
] as const;
export type DocInmueble = (typeof DOCUMENTOS_INMUEBLE)[number][0];
export type EstadoDoc = "falta" | "recibido" | "no_aplica";
export const ESTADO_DOC_LABELS: Record<EstadoDoc, string> = { falta: "Falta", recibido: "Recibido", no_aplica: "No aplica" };

export type ExtrasInmueble = {
  /** Encendido: el sitio muestra `direccionCompleta` en lugar de la referencia (proyección pública, migración 20261116140000). */
  direccionExacta?: boolean;
  /** Dirección completa, privada. */
  direccionCompleta?: string;
  municipio?: string;
  /** Solo la ven el asesor y dirección; nunca sale al sitio. */
  comisionAcordada?: string;
  formasPago?: string;
  /** RP-88: preparado y entregado van por separado. Fechas YYYY-MM-DD. */
  informePropietario?: { preparadoEl?: string; entregadoEl?: string };
  documentosInmueble?: Partial<Record<DocInmueble, EstadoDoc>>;
  /** Archivado: sale de la lista y del sitio; se recupera desde «Filtrar y ordenar». */
  archivado?: boolean;
};

type ConExtras = Property & ExtrasInmueble & { avisosCompradores?: BuyerNotice[] };
export const extrasDe = (p: Property): ConExtras => p as ConExtras;

/** Cambia campos extra; `undefined` o texto vacío los quita. */
export function conExtras(p: Property, cambios: Partial<ExtrasInmueble>): Property {
  const r: Record<string, unknown> = { ...p };
  for (const [k, v] of Object.entries(cambios)) {
    if (v === undefined || v === "" || v === false) delete r[k];
    else r[k] = v;
  }
  return r as Property;
}

export const estadoDoc = (p: Property, d: DocInmueble): EstadoDoc => extrasDe(p).documentosInmueble?.[d] ?? "falta";

/** Tocar un documento: Falta → Recibido → No aplica → Falta. */
export function siguienteDoc(p: Property, d: DocInmueble): Property {
  const orden: EstadoDoc[] = ["falta", "recibido", "no_aplica"];
  const ahora = estadoDoc(p, d);
  const sig = orden[(orden.indexOf(ahora) + 1) % orden.length];
  return conExtras(p, { documentosInmueble: { ...(extrasDe(p).documentosInmueble ?? {}), [d]: sig } });
}

const hoyTexto = (ahora: Date) => `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}-${String(ahora.getDate()).padStart(2, "0")}`;
export const fechaCorta = (iso: string) => {
  const [a, m, d] = iso.slice(0, 10).split("-");
  return a && m && d ? `${d}/${m}/${a}` : iso;
};

/** Informe al propietario: qué dice la tarjeta y qué hace el botón. */
export function informe(p: Property): { texto: string; boton: string; siguiente: "preparar" | "entregar" } {
  const i = extrasDe(p).informePropietario;
  if (i?.preparadoEl && !i.entregadoEl) return { texto: `Preparado el ${fechaCorta(i.preparadoEl)}`, boton: "Marcar como entregado", siguiente: "entregar" };
  if (i?.entregadoEl) return { texto: `Entregado el ${fechaCorta(i.entregadoEl)}`, boton: "Preparar informe al propietario", siguiente: "preparar" };
  return { texto: "", boton: "Preparar informe al propietario", siguiente: "preparar" };
}
export function avanzarInforme(p: Property, ahora = new Date()): Property {
  const i = extrasDe(p).informePropietario;
  const hoy = hoyTexto(ahora);
  return conExtras(p, { informePropietario: informe(p).siguiente === "entregar" ? { ...i, entregadoEl: hoy } : { preparadoEl: hoy } });
}

/** Cambiar precio conservando moneda y periodo; 0 o vacío deja «Valor a consulta». */
export function cambiarPrecio(p: Property, monto: number): Property {
  const moneda = p.precio.modalidad === "publico" ? p.precio.moneda : "MXN";
  return { ...p, precio: monto > 0 ? { modalidad: "publico", monto, moneda, ...(p.operacion === "renta" ? { periodo: "mensual" as const } : {}) } : { modalidad: "consulta" } };
}
export const montoDe = (p: Property) => (p.precio.modalidad === "publico" ? p.precio.monto : 0);
/** Diferencia en % con un decimal; null sin precio anterior. */
export const diferencia = (antes: number, despues: number) => (antes > 0 && despues > 0 ? Math.round(((despues - antes) / antes) * 1000) / 10 : null);

export type EstadoInteresado = "Nuevo" | "Le enviaste la ficha" | "Ya lo visitó";
type Interesado = { id: string; tipo: "persona" | "consulta" };

/** Estado de cada interesado: visitó (cita de visita pasada con esa persona) > le enviaste la ficha (aviso anotado) > nuevo. */
export function estadoInteresado(p: Property, x: Interesado, eventos: readonly EventoConResultado[], hoy: string): EstadoInteresado {
  const visito = eventos.some((e) => e.tipo === "visita" && e.propiedadSlug === p.slug && e.fecha < hoy && e.resultado?.estado !== "no_llego"
    && (x.tipo === "persona" ? e.clienteId === x.id : e.leadId === x.id));
  if (visito) return "Ya lo visitó";
  if ((extrasDe(p).avisosCompradores ?? []).some((a) => a.personaId === x.id)) return "Le enviaste la ficha";
  return "Nuevo";
}

/** Anota que se envió la ficha (o el aviso de precio) a esas personas. */
export function anotarEnvio(p: Property, a: readonly Interesado[], quien: string, ahora = new Date()): Property {
  const previos = extrasDe(p).avisosCompradores ?? [];
  const nuevos: BuyerNotice[] = a.map((x) => ({
    id: crypto.randomUUID(), personaId: x.id, tipo: x.tipo === "persona" ? "cliente" : "lead", fecha: ahora.toISOString(), medio: "whatsapp", registradoPor: quien.slice(0, 160),
    ...(p.precio.modalidad === "publico" ? { precio: { monto: p.precio.monto, moneda: p.precio.moneda } } : {}),
  }));
  return { ...p, avisosCompradores: [...previos, ...nuevos].slice(-1000) } as Property;
}
