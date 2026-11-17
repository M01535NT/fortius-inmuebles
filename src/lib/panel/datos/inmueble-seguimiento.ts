import type { Property } from "@/data/propiedades";
import type { Cliente } from "@/lib/backend/contracts";
import { openKeyLoans, type KeyPlace, type PropertyKeys } from "@/lib/propiedad-seguimiento";

/**
 * Propietario ligado y llaves de un inmueble (boceto de Inmuebles, funciones 7 y 8). Funciones puras.
 * El propietario se liga desde la persona (`propiedadSlug`), como ya lo hace el panel viejo: no se duplica el dato.
 * Las llaves son seguimiento privado: nunca salen al sitio.
 */

export const propietariosDe = (personas: readonly Cliente[], slug: string) =>
  personas.filter((c) => c.propiedadSlug === slug && c.tipo === "propietario");

/** Ligar a una persona como propietaria de este inmueble (queda con papel «propietario»). */
export function ligarPropietario(c: Cliente, slug: string, ahora = new Date()): Cliente {
  return { ...c, propiedadSlug: slug, tipo: "propietario", actualizadoEl: ahora.toISOString() };
}
export function desligarPropietario(c: Cliente, ahora = new Date()): Cliente {
  const sig = { ...c, actualizadoEl: ahora.toISOString() };
  delete sig.propiedadSlug;
  return sig;
}

const llavesDe = (p: Property): PropertyKeys => (p as Property & { llaves?: PropertyKeys }).llaves ?? { prestamos: [] };
const conLlaves = (p: Property, llaves: PropertyKeys): Property => ({ ...p, llaves } as Property);

export function datosLlaves(p: Property) {
  const l = llavesDe(p);
  return { lugar: l.lugar, copias: l.copias, detalle: l.detalle ?? "", prestadas: openKeyLoans(l) };
}

export function guardarLlaves(p: Property, d: { lugar?: KeyPlace; copias?: number; detalle: string }): Property {
  const l = { ...llavesDe(p) };
  if (d.lugar) l.lugar = d.lugar; else delete l.lugar;
  if (typeof d.copias === "number" && d.copias >= 0) l.copias = Math.min(50, Math.round(d.copias)); else delete l.copias;
  const detalle = d.detalle.trim().slice(0, 500);
  if (detalle) l.detalle = detalle; else delete l.detalle;
  return conLlaves(p, { ...l, prestamos: l.prestamos ?? [] });
}

/** Prestar llaves a alguien (con fecha prevista de regreso, opcional). */
export function prestarLlaves(p: Property, d: { persona: string; regresoPrevisto: string | null; motivo?: string }, quien: string, ahora = new Date()): Property {
  const l = llavesDe(p);
  const prestamo = {
    id: crypto.randomUUID(), persona: d.persona.trim().slice(0, 160), salida: ahora.toISOString(),
    ...(d.regresoPrevisto ? { regresoPrevisto: d.regresoPrevisto } : {}),
    ...(d.motivo?.trim() ? { motivo: d.motivo.trim().slice(0, 500) } : {}),
    registradoPor: quien.slice(0, 160),
  };
  return conLlaves(p, { ...l, prestamos: [...(l.prestamos ?? []), prestamo] });
}

export function regresaronLlaves(p: Property, id: string, quien: string, ahora = new Date()): Property {
  const l = llavesDe(p);
  return conLlaves(p, { ...l, prestamos: (l.prestamos ?? []).map((x) => (x.id === id && !x.regreso ? { ...x, regreso: ahora.toISOString(), recibidoPor: quien.slice(0, 160) } : x)) });
}
