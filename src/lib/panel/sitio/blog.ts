import { BLOG_CATEGORIES, BLOG_FORMATS, postCategory, postFormat, type BlogCategory, type BlogFormat } from "@/lib/blog-editorial";
import type { Post } from "@/lib/domain/records";

/**
 * Blog del sitio público desde Configuración → Sitio público. Lo mismo que hacía el panel provisional: dirección fija
 * después de crearla, tipo y tema, autor, zona, destacar en portada, título, resumen, contenido, borrador o publicado y
 * fuente principal. La base pone las fechas (la de primera publicación se conserva) y solo deja escribir al director.
 */

export const LIMITES = { slug: 160, titulo: 160, resumen: 20000, corto: 500, enlace: 2048, contenido: 150000 } as const;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type FiltroBlog = "todas" | "publicadas" | "borradores" | "eliminadas";
export const FILTROS: readonly { valor: FiltroBlog; etiqueta: string }[] = [
  { valor: "todas", etiqueta: "Todas" },
  { valor: "publicadas", etiqueta: "En el sitio" },
  { valor: "borradores", etiqueta: "Borradores" },
  { valor: "eliminadas", etiqueta: "Eliminadas" },
];
export const OPCIONES_FORMATO = (Object.entries(BLOG_FORMATS) as [BlogFormat, string][]).map(([valor, etiqueta]) => ({ valor, etiqueta }));
export const OPCIONES_TEMA = (Object.entries(BLOG_CATEGORIES) as [BlogCategory, string][]).map(([valor, etiqueta]) => ({ valor, etiqueta }));

/** Lo que se edita de una entrada. Las fechas no: las pone la base. */
export type Borrador = {
  slug: string; titulo: string; resumen: string; contenido: string; publicada: boolean;
  formato: BlogFormat; categoria: BlogCategory | ""; destacado: boolean;
  autor: string; ambito: string; fuenteNombre: string; fuenteUrl: string;
};

export function borradorDe(p?: Post | null): Borrador {
  return {
    slug: p?.slug ?? "", titulo: p?.titulo ?? "", resumen: p?.resumen ?? "", contenido: p?.contenido ?? "",
    publicada: p?.estado === "publicado", formato: p ? postFormat(p) : "guia", categoria: p ? postCategory(p) ?? "" : "",
    destacado: p?.destacado === true, autor: p?.autor ?? "", ambito: p?.ambito ?? "", fuenteNombre: p?.fuenteNombre ?? "", fuenteUrl: p?.fuenteUrl ?? "",
  };
}

/** Sugerencia de dirección a partir del título: sin acentos, minúsculas y guiones. Solo mientras la entrada es nueva. */
export function slugDesdeTitulo(titulo: string): string {
  return titulo.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/ñ/g, "n").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80).replace(/-+$/, "");
}

export type Errores = Partial<Record<"slug" | "titulo" | "resumen" | "contenido" | "fuenteUrl", string>>;

/** Lo que el servidor rechazaría, dicho antes de guardar. La dirección repetida también (el servidor solo diría que cambió). */
export function validarEntrada(b: Borrador, otras: readonly Pick<Post, "id" | "slug">[], id: string | null): Errores {
  const e: Errores = {};
  const slug = b.slug.trim();
  if (!slug) e.slug = "Escribe la dirección.";
  else if (slug.length > LIMITES.slug || !SLUG.test(slug)) e.slug = "Solo minúsculas, números y guiones, como guia-para-comprar.";
  else if (otras.some((p) => p.slug === slug && p.id !== id)) e.slug = "Ya hay una entrada con esta dirección.";
  if (!b.titulo.trim()) e.titulo = "Escribe el título.";
  else if (b.titulo.trim().length > LIMITES.titulo) e.titulo = `Hasta ${LIMITES.titulo} caracteres.`;
  if (!b.resumen.trim()) e.resumen = "Escribe el resumen.";
  else if (b.resumen.length > LIMITES.resumen) e.resumen = "Es demasiado largo para un resumen.";
  if (!b.contenido.trim()) e.contenido = "Escribe el contenido.";
  else if (b.contenido.length > LIMITES.contenido) e.contenido = "Es demasiado largo para una entrada.";
  const url = b.fuenteUrl.trim();
  if (url && (url.length > LIMITES.enlace || !/^https?:\/\/[^/\s]+/i.test(url) || /[\s\\]/.test(url))) e.fuenteUrl = "Pega el enlace completo, con https://.";
  return e;
}

/**
 * La entrada lista para guardar. Conserva lo que el panel no edita (fechas, campos de otras versiones); la base vuelve a
 * poner `actualizadoEl` y respeta la primera fecha de publicación.
 */
export function entradaAGuardar(b: Borrador, previa: Post | null, id: string, ahora = new Date().toISOString()): Post {
  const base: Post = { ...(previa ?? {}), id, slug: previa?.slug ?? b.slug.trim(), titulo: b.titulo.trim(), resumen: b.resumen.trim(), contenido: b.contenido.replace(/\s+$/, ""),
    estado: b.publicada ? "publicado" : "borrador", actualizadoEl: ahora, formato: b.formato, destacado: b.destacado,
    autor: b.autor.trim(), ambito: b.ambito.trim(), fuenteNombre: b.fuenteNombre.trim(), fuenteUrl: b.fuenteUrl.trim() };
  if (b.categoria) base.categoria = b.categoria; else delete base.categoria;
  return base;
}

export function hayCambios(b: Borrador, previa: Post | null): boolean {
  return JSON.stringify(b) !== JSON.stringify(borradorDe(previa));
}

const sinAcentos = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Lo más reciente arriba; con texto, busca en título, resumen y dirección. */
export function filtrarEntradas<T extends Pick<Post, "titulo" | "resumen" | "slug" | "estado" | "actualizadoEl">>(posts: readonly T[], filtro: FiltroBlog, texto = ""): T[] {
  const t = sinAcentos(texto.trim());
  return posts
    .filter((p) => filtro === "todas" || (filtro === "publicadas" ? p.estado === "publicado" : filtro === "borradores" ? p.estado !== "publicado" : false))
    .filter((p) => !t || sinAcentos(`${p.titulo} ${p.resumen} ${p.slug}`).includes(t))
    .sort((a, b) => b.actualizadoEl.localeCompare(a.actualizadoEl) || a.slug.localeCompare(b.slug));
}

export function cuantas(posts: readonly Pick<Post, "estado">[]) {
  const publicadas = posts.filter((p) => p.estado === "publicado").length;
  return { publicadas, borradores: posts.length - publicadas };
}

/** La que sale en la portada: el destacado publicado más reciente; sin destacados, la última publicada (como el sitio). */
export function enPortada(posts: readonly Post[]): Post | null {
  const fecha = (p: Post) => p.publicadoEl ?? p.actualizadoEl;
  const pub = posts.filter((p) => p.estado === "publicado").sort((a, b) => fecha(b).localeCompare(fecha(a)));
  return pub.find((p) => p.destacado) ?? pub[0] ?? null;
}

export const rutaPublica = (slug: string) => `/blog/${slug}`;

// ── Vista previa ────────────────────────────────────────────────────────────────────────────────
/**
 * El mismo formato sencillo que lee el sitio: párrafos separados por una línea en blanco, ## y ### para títulos, - y 1.
 * para listas, y enlaces [texto](/ruta) o [texto](https://…). El HTML se muestra como texto.
 */
export type Bloque =
  | { tipo: "p" | "h2" | "h3"; texto: string }
  | { tipo: "ul" | "ol"; items: string[] };

export function bloques(contenido: string): Bloque[] {
  const r: Bloque[] = [];
  let parrafo: string[] = [];
  const cerrar = () => { if (parrafo.length) r.push({ tipo: "p", texto: parrafo.join("\n").trim() }); parrafo = []; };
  for (const linea of contenido.split(/\r?\n/)) {
    if (!linea.trim()) { cerrar(); r.push({ tipo: "p", texto: "" }); continue; }
    const titulo = /^(#{2,3})\s+(.+)$/.exec(linea), vineta = /^-\s+(.+)$/.exec(linea), numero = /^\d+\.\s+(.+)$/.exec(linea);
    if (titulo) { cerrar(); r.push({ tipo: titulo[1].length === 2 ? "h2" : "h3", texto: titulo[2] }); }
    else if (vineta || numero) {
      cerrar();
      const tipo = vineta ? "ul" : "ol", texto = (vineta ?? numero)![1], previo = r.at(-1);
      if (previo && previo.tipo === tipo) previo.items.push(texto); else r.push({ tipo, items: [texto] });
    } else parrafo.push(linea);
  }
  cerrar();
  return r.filter((b) => b.tipo !== "p" || b.texto);
}

/** Enlace que el sitio sí convierte: ruta interna o http(s), sin caracteres de control ni barras invertidas. */
export function enlaceSeguro(url: string): boolean {
  if ([...url].some((c) => c.charCodeAt(0) <= 32 || c.charCodeAt(0) === 127 || c === "\\")) return false;
  if (url.startsWith("/")) return !url.startsWith("//");
  if (!/^https?:\/\//i.test(url)) return false;
  try { return Boolean(new URL(url).hostname); } catch { return false; }
}

export type Trozo = { texto: string; enlace?: string };
export function trozos(texto: string): Trozo[] {
  const r: Trozo[] = [];
  let desde = 0;
  for (const m of texto.matchAll(/\[([^\]\n]+)\]\(([^()\n]*)\)/g)) {
    if (m.index > desde) r.push({ texto: texto.slice(desde, m.index) });
    r.push(enlaceSeguro(m[2]) ? { texto: m[1], enlace: m[2] } : { texto: m[0] });
    desde = m.index + m[0].length;
  }
  if (desde < texto.length) r.push({ texto: texto.slice(desde) });
  return r;
}

export function minutosDeLectura(contenido: string): number {
  const palabras = contenido.trim() ? contenido.trim().split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(palabras / 220));
}
