import { HOME_FIELDS, HOME_TEXT_KEYS, homeText, resolveSiteContent, type HomeTextKey } from "@/data/home-copy";
import type { PreguntaFrecuente, SiteContent, Testimonio } from "@/lib/domain/records";

/**
 * Textos del sitio público desde Configuración → Sitio público. Los mismos que tenía el panel provisional: «Por qué
 * Fortius», el título y la descripción para buscadores, los textos del inicio por grupo, las preguntas frecuentes que se
 * suman a las de la página y los testimonios. Guardar los pone en el sitio (no hay borrador); un testimonio sin
 * autorización por escrito se guarda pero no sale (lo recorta el servidor).
 */

export const GRUPOS_PREGUNTA: readonly { valor: PreguntaFrecuente["grupo"]; etiqueta: string }[] = [
  { valor: "vender", etiqueta: "Para vender" },
  { valor: "comprar", etiqueta: "Para comprar" },
  { valor: "general", etiqueta: "En general" },
];
export const LIMITES_TEXTOS = {
  inicio: 4000, pregunta: 300, respuesta: 4000, testimonio: 1200, nombre: 120, detalle: 160, corto: 500,
  preguntas: 60, testimonios: 30,
} as const;

/** Grupos del inicio en el orden en que salen en la página. */
export const GRUPOS_INICIO: { titulo: string; claves: HomeTextKey[] }[] = Array.from(new Set(HOME_TEXT_KEYS.map((k) => HOME_FIELDS[k].group)))
  .map((titulo) => ({ titulo, claves: HOME_TEXT_KEYS.filter((k) => HOME_FIELDS[k].group === titulo) }));

export type Textos = {
  manifiestoTitulo: string; manifiestoTexto: string; seoTitle: string; seoDescription: string;
  inicio: Record<HomeTextKey, string>; preguntas: PreguntaFrecuente[]; testimonios: Testimonio[];
};

/** Lo que se ve en pantalla: lo guardado o, si falta, el texto con el que sale hoy el sitio. */
export function textosDe(guardado: SiteContent | null | undefined): Textos {
  const c = resolveSiteContent(guardado ?? null);
  return {
    manifiestoTitulo: c.manifiestoTitulo, manifiestoTexto: c.manifiestoTexto, seoTitle: c.seoTitle, seoDescription: c.seoDescription,
    inicio: Object.fromEntries(HOME_TEXT_KEYS.map((k) => [k, homeText(c, k)])) as Record<HomeTextKey, string>,
    preguntas: (guardado?.preguntas ?? []).map((p) => ({ ...p })), testimonios: (guardado?.testimonios ?? []).map((t) => ({ ...t })),
  };
}

export type ErroresTextos = Partial<Record<"manifiestoTitulo" | "manifiestoTexto" | "seoTitle" | "seoDescription", string>>;

export function validarTextos(t: Textos): ErroresTextos {
  const e: ErroresTextos = {};
  if (!t.manifiestoTitulo.trim()) e.manifiestoTitulo = "Escribe el título.";
  if (!t.manifiestoTexto.trim()) e.manifiestoTexto = "Escribe la descripción.";
  if (!t.seoTitle.trim()) e.seoTitle = "Escribe el título.";
  else if (t.seoTitle.length > LIMITES_TEXTOS.corto) e.seoTitle = `Hasta ${LIMITES_TEXTOS.corto} caracteres.`;
  if (!t.seoDescription.trim()) e.seoDescription = "Escribe la descripción.";
  else if (t.seoDescription.length > LIMITES_TEXTOS.corto) e.seoDescription = `Hasta ${LIMITES_TEXTOS.corto} caracteres.`;
  return e;
}

/** Largo recomendado para buscadores: título 50–60, descripción 140–160. */
export type Largo = "corto" | "bien" | "largo";
export function largoSeo(texto: string, min: number, max: number): Largo {
  const n = texto.trim().length;
  return n < min ? "corto" : n > max ? "largo" : "bien";
}

/**
 * Lo que se guarda: lo guardado antes (con lo que esta pantalla no toca, como el titular del inicio) más lo editado.
 * Preguntas y testimonios a medias no se guardan, igual que en el panel provisional.
 */
export function contenidoAGuardar(t: Textos, guardado: SiteContent | null | undefined): SiteContent {
  const base = resolveSiteContent(guardado ?? null);
  return {
    ...base,
    manifiestoTitulo: t.manifiestoTitulo, manifiestoTexto: t.manifiestoTexto, seoTitle: t.seoTitle, seoDescription: t.seoDescription,
    homeTexts: Object.fromEntries(HOME_TEXT_KEYS.map((k) => [k, (t.inicio[k] ?? "").trim()])),
    preguntas: completas(t.preguntas),
    testimonios: t.testimonios.map((x) => ({ ...x, texto: x.texto.trim(), nombre: x.nombre.trim(), detalle: x.detalle.trim() })).filter((x) => x.texto && x.nombre),
  };
}
function completas(ps: PreguntaFrecuente[]) {
  return ps.map((p) => ({ ...p, pregunta: p.pregunta.trim(), respuesta: p.respuesta.trim() })).filter((p) => p.pregunta && p.respuesta);
}

/** Cuántas preguntas o testimonios a medias se quedarían fuera al guardar (para avisarlo, no para frenar). */
export function aMedias(t: Textos): number {
  const p = t.preguntas.filter((x) => Boolean(x.pregunta.trim()) !== Boolean(x.respuesta.trim())).length;
  const s = t.testimonios.filter((x) => Boolean(x.texto.trim()) !== Boolean(x.nombre.trim())).length;
  return p + s;
}

/** Un testimonio sale en el inicio solo con texto, nombre y autorización por escrito. */
export function testimonioSale(x: Testimonio): boolean {
  return x.autorizado && Boolean(x.texto.trim()) && Boolean(x.nombre.trim());
}

export function hayCambiosTextos(t: Textos, guardado: SiteContent | null | undefined): boolean {
  return JSON.stringify(t) !== JSON.stringify(textosDe(guardado));
}

export const nuevaPregunta = (id: string): PreguntaFrecuente => ({ id, grupo: "vender", pregunta: "", respuesta: "" });
export const nuevoTestimonio = (id: string): Testimonio => ({ id, texto: "", nombre: "", detalle: "", autorizado: false });

/** Mueve un elemento una posición (arriba −1, abajo +1); en los bordes no cambia nada. */
export function mover<T>(lista: readonly T[], i: number, paso: -1 | 1): T[] {
  const j = i + paso;
  if (i < 0 || i >= lista.length || j < 0 || j >= lista.length) return [...lista];
  const r = [...lista];
  [r[i], r[j]] = [r[j], r[i]];
  return r;
}
