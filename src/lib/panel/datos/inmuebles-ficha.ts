import { formatPrecio, OPERACION_LABELS, TIPO_LABELS, type Property } from "@/data/propiedades";
import type { Cliente } from "@/lib/backend/contracts";
import type { Evento, Lead } from "@/lib/domain/records";
import { estadoDoc } from "@/lib/panel/datos/inmueble-extras";
import { fotoPublica } from "@/lib/panel/datos/inmueble-sitio";
import { propietariosDe } from "@/lib/panel/datos/inmueble-seguimiento";

/** Piezas puras para la lista y el panel de Inmuebles del boceto (16/11/2026). */

export const fotoPortada = (p: Property) => p.galeria.find((g) => !g.oculta && fotoPublica(g.src))?.src ?? p.galeria[0]?.src;

/** Etiqueta «En el sitio» de la tabla. */
export function enSitio(p: Property): { texto: string; tono?: "si" | "aviso" } {
  if (p.estado === "evaluacion") return { texto: "En captación", tono: "aviso" };
  if (p.estado === "apartada") return { texto: "Apartado", tono: "si" };
  if (p.estado === "vendida") return { texto: "Vendido" };
  if (p.estado === "rentada") return { texto: "Rentado" };
  return p.publicada ? { texto: "Publicado", tono: "si" } : { texto: "Sin publicar" };
}

/** Los datos en una línea: «3 rec · 2 baños · 180 m²». */
export function datosCortos(p: Property): string {
  const f = p.ficha;
  const m2 = f.construccionM2 || f.terrenoM2;
  return [
    f.recamaras ? `${f.recamaras} rec` : "",
    f.banos ? `${f.banos} ${f.banos === 1 ? "baño" : "baños"}` : "",
    m2 ? `${m2} m²` : "",
  ].filter(Boolean).join(" · ");
}

/** Como el boceto: «3 rec. · 2 baños · 92 m²»; un terreno, «450 m² de terreno»; sin recámaras, los estacionamientos. */
export function especificaciones(p: Property): string {
  const f = p.ficha ?? {};
  if (p.tipo === "terreno") return f.terrenoM2 ? `${f.terrenoM2.toLocaleString("en-US")} m² de terreno` : "Terreno";
  const m2 = f.construccionM2 || f.terrenoM2;
  return [
    f.recamaras ? `${f.recamaras} rec.` : "",
    f.banos ? `${f.banos} ${f.banos === 1 ? "baño" : "baños"}` : "",
    m2 ? `${m2.toLocaleString("en-US")} m²` : "",
    !f.recamaras && f.estacionamientos ? `${f.estacionamientos} estac.` : "",
  ].filter(Boolean).join(" · ");
}

/** Precio como lo lee el asesor: «$3,250,000», «$16,500 al mes» o «Sin precio». */
export function precioCorto(p: Property): string {
  if (p.precio.modalidad !== "publico") return "Sin precio";
  return `$${p.precio.monto.toLocaleString("en-US")}${p.precio.moneda === "USD" ? " USD" : ""}${p.precio.periodo === "mensual" ? " al mes" : ""}`;
}

export const tipoYOperacion = (p: Property) => `${TIPO_LABELS[p.tipo]} · ${OPERACION_LABELS[p.operacion]}`;
export const precioDe = (p: Property) => formatPrecio(p.precio);

/** Días desde que se publicó; null si nunca. */
export function diasPublicado(p: Property, hoy: Date): number | null {
  if (!p.publicada || !p.publicadaEl) return null;
  const d = Date.parse(p.publicadaEl.slice(0, 10));
  return Number.isNaN(d) ? null : Math.max(0, Math.floor((hoy.getTime() - d) / 86_400_000));
}

export type AvisoInmueble = { texto: string; accion: "precio" | "fotos" | "docs" | "propietario"; boton: string; alPublicar: boolean };

/**
 * Avisos del boceto (lista y panel): sin precio, sin fotos, sin contrato de intermediación, sin propietario ligado y mucho
 * tiempo publicado con pocos contactos. Nada se bloquea (DEC-61); `alPublicar` dice cuáles se repasan antes de publicar.
 */
export function avisosDe(p: Property, personas: readonly Cliente[], o: { consultas?: number; hoy?: Date } = {}): AvisoInmueble[] {
  const ligado = propietariosDe(personas, p.slug).length > 0;
  const a: AvisoInmueble[] = [];
  if (p.precio.modalidad !== "publico") a.push({ texto: "Sin precio", accion: "precio", boton: "Poner precio", alPublicar: true });
  if (!p.galeria.length) a.push({ texto: "Sin fotos", accion: "fotos", boton: "Agregar", alPublicar: true });
  if (estadoDoc(p, "contrato") === "falta") a.push({ texto: "Sin contrato de intermediación firmado", accion: "docs", boton: "Subir", alPublicar: true });
  if (!ligado) a.push({ texto: "Sin propietario ligado", accion: "propietario", boton: "Ligar", alPublicar: true });
  const dias = o.hoy ? diasPublicado(p, o.hoy) : null;
  const c = o.consultas ?? 0;
  if (dias !== null && dias > 60 && p.estado === "disponible" && c <= 3) {
    a.push({ texto: `Lleva ${dias} días publicado con ${c} ${c === 1 ? "contacto" : "contactos"}`, accion: "precio", boton: "Revisar precio", alPublicar: false });
  }
  return a;
}

/** Personas cuya búsqueda coincide con el inmueble (mismo criterio sencillo de la ficha de persona). */
export function interesados(p: Property, d: { clientes: readonly Cliente[]; leads: readonly Lead[] }): { id: string; nombre: string; detalle: string; tipo: "persona" | "consulta" }[] {
  const zona = p.zona.trim().toLowerCase();
  const quiere = (op?: string) => !op || op === p.operacion;
  const r: { id: string; nombre: string; detalle: string; tipo: "persona" | "consulta" }[] = [];
  for (const l of d.leads) {
    if (l.propiedadSlug === p.slug && l.estado !== "descartado") r.push({ id: l.id, nombre: l.nombre || "Sin nombre", detalle: "Preguntó por este inmueble", tipo: "consulta" });
  }
  for (const c of d.clientes) {
    if (c.tipo !== "comprador" && c.tipo !== "arrendatario" && c.tipo !== "inversionista") continue;
    const op = (c.perfil as { operacion?: string } | undefined)?.operacion;
    if (c.propiedadSlug === p.slug) { r.push({ id: c.id, nombre: c.nombre, detalle: "Le interesa este inmueble", tipo: "persona" }); continue; }
    if (zona && c.zona?.trim().toLowerCase() === zona && quiere(op)) r.push({ id: c.id, nombre: c.nombre, detalle: `Busca en ${p.zona}`, tipo: "persona" });
  }
  return r;
}

/** Cómo va: consultas del inmueble, visitas hechas y por venir. */
export function comoVa(p: Property, d: { leads: readonly Lead[]; eventos: readonly Evento[]; hoy: string }) {
  const consultas = d.leads.filter((l) => l.propiedadSlug === p.slug).length;
  const visitas = d.eventos.filter((e) => e.propiedadSlug === p.slug && e.tipo === "visita");
  return {
    consultas,
    hechas: visitas.filter((e) => e.fecha < d.hoy).length,
    proximas: visitas.filter((e) => e.fecha >= d.hoy).sort((a, b) => (a.fecha + (a.hora ?? "")).localeCompare(b.fecha + (b.hora ?? ""))),
  };
}
