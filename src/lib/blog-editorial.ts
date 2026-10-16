import type { Post } from "@/lib/domain/records";

export const BLOG_CATEGORIES = {
  comprar: "Comprar",
  vender: "Vender",
  rentar: "Rentar",
  mercado: "Valor y mercado",
  tramites: "Trámites",
} as const;
export const BLOG_FORMATS = { guia: "Guías", actualidad: "Actualidad" } as const;
export type BlogCategory = keyof typeof BLOG_CATEGORIES;
export type BlogFormat = keyof typeof BLOG_FORMATS;

// Editorial classification of the existing guides; stored staff choices take precedence.
const legacyCategories: Record<string, BlogCategory> = {
  "cuanto-vale-mi-casa-tijuana": "mercado",
  "documentos-vender-propiedad-baja-california": "tramites",
  "propiedad-no-se-vende-que-revisar": "vender",
  "comprar-casa-tijuana-ingresos-estados-unidos": "comprar",
  "gastos-comprar-casa-tijuana": "comprar",
  "que-revisar-antes-apartar-propiedad": "comprar",
  "preparar-casa-para-vender": "vender",
  "comprar-o-rentar-tijuana": "comprar",
  "que-revisar-comprar-terreno": "comprar",
  "como-elegir-local-comercial": "rentar",
  "rentar-propiedad-seleccion-inquilino-entrega": "rentar",
  "que-debe-hacer-inmobiliaria-vender": "vender",
};

export function postCategory(post: Post): BlogCategory | undefined {
  return post.categoria ?? (Object.hasOwn(legacyCategories, post.slug) ? legacyCategories[post.slug] : undefined);
}
export function postFormat(post: Post): BlogFormat { return post.formato ?? "guia"; }
export function postDate(post: Post): string { return post.publicadoEl ?? post.actualizadoEl; }
export function formatBlogDate(value: string): string {
  return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Tijuana" }).format(new Date(value));
}
export function readingMinutes(post: Post): number {
  return Math.max(1, Math.ceil(post.contenido.trim().split(/\s+/).length / 220));
}

type BlogSearch = {
  q?: string; tema?: string; tipo?: string; pagina?: string;
  desde?: string; hasta?: string;
  orden?: "recientes" | "antiguos";
  vista?: "cuadricula" | "lista";
};
function validDate(value: string): string {
  if (!/^[1-9]\d{3}-\d{2}-\d{2}$/.test(value)) return "";
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : "";
}
const calendarDate = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "America/Tijuana" });
function postCalendarDate(post: Post): string {
  const parts = calendarDate.formatToParts(new Date(postDate(post)));
  return ["year", "month", "day"].map((type) => parts.find((part) => part.type === type)?.value).join("-");
}
export function normalizeBlogSearch(params: Record<string, string | string[] | undefined>): BlogSearch {
  const first = (key: string) => typeof params[key] === "string" ? params[key] as string : "";
  const q = first("q").trim().slice(0, 200);
  const tema = Object.hasOwn(BLOG_CATEGORIES, first("tema")) ? first("tema") : "";
  const tipo = Object.hasOwn(BLOG_FORMATS, first("tipo")) ? first("tipo") : "";
  const pagina = /^[1-9]\d{0,5}$/.test(first("pagina")) ? first("pagina") : "1";
  const desde = validDate(first("desde"));
  const hasta = validDate(first("hasta"));
  const orden = first("orden") === "antiguos" ? "antiguos" : "recientes";
  const vista = first("vista") === "lista" ? "lista" : "cuadricula";
  return { q, tema, tipo, pagina, desde, hasta, orden, vista };
}
export function blogHref(search: BlogSearch): string {
  const params = new URLSearchParams();
  for (const key of ["q", "tema", "tipo", "desde", "hasta", "orden", "vista", "pagina"] as const) {
    const value = search[key];
    if (value && !(key === "pagina" && value === "1") && !(key === "orden" && value === "recientes") && !(key === "vista" && value === "cuadricula")) params.set(key, value);
  }
  return `/blog${params.size ? `?${params}` : ""}`;
}
const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-MX");
export function filterBlogPosts(posts: Post[], search: BlogSearch): Post[] {
  const words = normalize(search.q ?? "").split(/\s+/).filter(Boolean);
  return posts.filter((post) => {
    const category = postCategory(post);
    const text = normalize(`${post.titulo} ${post.resumen} ${post.contenido} ${category ? BLOG_CATEGORIES[category] : ""}`);
    const date = search.desde || search.hasta ? postCalendarDate(post) : "";
    return (!search.tema || category === search.tema) && (!search.tipo || postFormat(post) === search.tipo) && words.every((word) => text.includes(word))
      && (!search.desde || date >= search.desde) && (!search.hasta || date <= search.hasta);
  }).sort((a, b) => (new Date(postDate(a)).getTime() - new Date(postDate(b)).getTime()) * (search.orden === "antiguos" ? 1 : -1));
}
