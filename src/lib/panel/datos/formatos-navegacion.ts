import type { Zona } from "@/lib/formatos/documento/pdf";
import { catalogo, type EntradaCatalogo } from "@/lib/panel/datos/formatos";

/**
 * Llegar y volver de Formatos (PN-06, AUD-05): desde un asunto se abre `/admin/formatos?asunto=<id>&formato=<id>`
 * y la ventana de captura recibe `?volver=<ruta>` para que la X regrese a donde se estaba.
 */

/** Solo rutas internas del panel: nada de otro sitio (`//x`, `https:`) ni barras invertidas. */
export function rutaDeRegreso(volver: string | null | undefined): string | null {
  if (!volver) return null;
  if (!/^\/admin(\/|\?|$)/.test(volver) || volver.startsWith("//") || /[\\\s]/.test(volver)) return null;
  return volver.slice(0, 300);
}

export const rutaAsunto = (id: string) => `/admin/asuntos?ver=${encodeURIComponent(id)}`;
export function rutaCaptura(documentoId: string, volver?: string | null): string {
  const r = rutaDeRegreso(volver);
  return `/admin/formatos/${encodeURIComponent(documentoId)}${r ? `?volver=${encodeURIComponent(r)}` : ""}`;
}

/** La entrada del catálogo de un formato y, si es un levantamiento, su tipo (04B → entrada 04 con tipo 04B). */
export function entradaDeFormato(formatoId: string | null | undefined, entradas: readonly EntradaCatalogo[] = catalogo()): { entrada: EntradaCatalogo; tipo: string } | null {
  if (!formatoId) return null;
  const directa = entradas.find((e) => e.id === formatoId);
  if (directa) return { entrada: directa, tipo: "" };
  const conTipo = entradas.find((e) => e.tipos?.some((t) => t.valor === formatoId));
  return conTipo ? { entrada: conTipo, tipo: formatoId } : null;
}

/** Hay algo escrito en el espacio que todavía no se guarda. */
export function cambiosDe(borrador: Record<string, unknown>, guardado: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(borrador).filter(([k, v]) => JSON.stringify(v ?? "") !== JSON.stringify(guardado[k] ?? "")));
}

/** «Faltan 12 espacios»: la misma cuenta que recorre «Uno por uno» con «Solo lo que falta»; los datos sin espacio en la hoja van aparte. */
export function textoFalta(espacios: number, sinEspacio = 0): string {
  const partes = [espacios ? `${espacios} ${espacios === 1 ? "espacio" : "espacios"}` : "", sinEspacio ? `${sinEspacio} ${sinEspacio === 1 ? "dato" : "datos"}` : ""].filter(Boolean);
  if (!partes.length) return "Completo";
  return `${espacios + sinEspacio === 1 ? "Falta" : "Faltan"} ${partes.join(" y ")}`;
}

const vacio = (v: unknown) => v === undefined || v === null || (Array.isArray(v) ? v.length === 0 : String(v).trim() === "");
export const zonaId = (z: Zona) => `${z.page}:${z.keys.join(",")}:${Math.round(z.x)}:${Math.round(z.y)}`;

/**
 * Llenar uno por uno (DEC-44 en el panel nuevo): los espacios de la hoja en su orden, sin repetir la misma celda.
 * Con «solo lo que falta», los que tienen algo vacío o marcado como faltante. La lista se toma al empezar y no cambia mientras se llena.
 */
export function espaciosEnOrden(zonas: readonly Zona[], valores: Record<string, unknown>, o: { soloFalta: boolean; faltan?: ReadonlySet<string> }): Zona[] {
  const vistos = new Set<string>();
  const salida: Zona[] = [];
  // El escritor del PDF entrega las zonas en el orden en que dibuja la hoja: ese es el orden de lectura.
  for (const z of zonas) {
    const clave = z.keys.join(",");
    if (!z.keys.length || vistos.has(clave)) continue;
    vistos.add(clave);
    // Con la lista de faltantes, «solo lo que falta» es exactamente eso (la misma cuenta que «Faltan N espacios»);
    // sin ella, cualquier espacio con algo vacío.
    if (o.soloFalta && !z.keys.some((k) => (o.faltan ? o.faltan.has(k) : vacio(valores[k])))) continue;
    salida.push(z);
  }
  return salida;
}
