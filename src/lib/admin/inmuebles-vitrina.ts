import type { AdminProperty } from "@/lib/admin/store";
import { buyersFor, needsNotice, type Seeker } from "@/lib/admin/buyer-matches";
import { keyLoanLate, openKeyLoans } from "@/lib/propiedad-seguimiento";

/*
  LV-10f · Vitrina de Inmuebles: lo que pide algo hoy, con su motivo y la acción que lo resuelve.
  Sale de datos que ya existen en la ficha y en su seguimiento: llaves que no regresaron a tiempo,
  compradores que buscan algo así y no se les ha avisado, y lo que le falta para promoverse.
  Un inmueble aparece una vez, con lo más urgente.
*/

export type Pendiente = { property: AdminProperty; motivo: string; accion: string; href: string; tono: "alert" | "warn" | "info" };

const lista = (items: string[]) => items.length > 1 ? `${items.slice(0, -1).join(", ")} y ${items.at(-1)}` : items[0];

/** Lo que le falta para promoverse: «fotos», «medidas», «precio». */
export function faltantes(p: Pick<AdminProperty, "galeria" | "ficha" | "precio">) {
  const gaps: string[] = [];
  if (!p.galeria?.length) gaps.push("fotos");
  if (p.ficha?.construccionM2 === undefined && p.ficha?.terrenoM2 === undefined) gaps.push("medidas");
  if (p.precio?.modalidad === "consulta") gaps.push("precio");
  return gaps;
}

export function pidenAlgoHoy(properties: AdminProperty[], seekers: Seeker[], today: string, toDay: (instant: string) => string): Pendiente[] {
  const out: Pendiente[] = [];
  for (const p of properties) {
    if (p.estado === "vendida" || p.estado === "rentada") continue;
    const slug = encodeURIComponent(p.slug);
    const tarde = openKeyLoans(p.llaves).find(loan => keyLoanLate(loan, today, toDay));
    if (tarde) { out.push({ property: p, motivo: `Las llaves siguen con ${tarde.persona}`, accion: "Ver las llaves", href: `/admin-anterior/propiedades/${slug}/seguimiento`, tono: "alert" }); continue; }
    const avisar = p.publicada ? buyersFor(p, seekers).filter(match => needsNotice(p, match.seeker)).length : 0;
    if (avisar) { out.push({ property: p, motivo: `${avisar} ${avisar === 1 ? "persona busca" : "personas buscan"} algo así y no se le${avisar === 1 ? "" : "s"} ha avisado`, accion: "Avisar", href: `/admin-anterior/propiedades/${slug}/seguimiento`, tono: "info" }); continue; }
    const gaps = faltantes(p);
    if (gaps.length) out.push({ property: p, motivo: `${gaps.length === 1 ? "Le falta" : "Le faltan"} ${lista(gaps)}`, accion: "Completar", href: `/admin-anterior/propiedades/${slug}/editar`, tono: "warn" });
  }
  const orden = { alert: 0, info: 1, warn: 2 } as const;
  return out.sort((a, b) => orden[a.tono] - orden[b.tono] || a.property.titulo.localeCompare(b.property.titulo, "es"));
}

/** «$4,200,000», «4200000», «4 200 000» → 4200000. Vacío, cero o con centavos no cuenta. */
export function montoDe(texto: string): number | null {
  const limpio = texto.replace(/[$\s,]/g, "").replace(/(MXN|USD)$/i, "");
  if (!/^\d{1,12}$/.test(limpio)) return null;
  const n = Number(limpio);
  return n > 0 ? n : null;
}
