import { OPERACION_LABELS, TIPO_LABELS, type Property } from "@/data/propiedades";
import { siteConfig } from "@/data/site";
import { municipioDeZona } from "@/data/zonas";
import type { Post, SiteSettings } from "@/lib/domain/records";
import { SITE_NAME } from "@/lib/seo/page-metadata";

/*
  Datos estructurados (schema.org) del sitio público. Solo datos reales: lo que no está capturado
  en la configuración pública o en el registro no se emite (sin domicilio, redes ni fechas
  inventadas). Los @id enlazan la empresa y el sitio entre páginas.
*/

type JsonLd = Record<string, unknown>;

const ORIGIN = siteConfig.url.replace(/\/$/, "");
export const ORG_ID = `${ORIGIN}/#org`;
export const WEBSITE_ID = `${ORIGIN}/#website`;
// Solo lo que confirmó el titular; otros municipios se agregan cuando él lo diga (13/11/2026).
const AREA_SERVED = ["Tijuana"];

/* Horario de atención que fijó el titular (13/11/2026): lunes a viernes de 9:00 a 18:00, hora de Tijuana.
   Si cambia, se actualiza aquí y en Google Business para que coincidan. */
const OPENING_HOURS = [{
  "@type": "OpeningHoursSpecification",
  dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => `https://schema.org/${day}`),
  opens: "09:00",
  closes: "18:00",
}];

const absolute = (path: string) => new URL(path, siteConfig.url).href;
const filled = (value: string | undefined | null) => (value ?? "").trim();

/* Un número nacional de 10 dígitos (con o sin 52) se escribe como lo pide Google: +52 664 221 2991. Lo demás queda igual. */
export function internationalPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const national = digits.length === 12 && digits.startsWith("52") ? digits.slice(2) : digits.length === 10 ? digits : "";
  return national ? `+52 ${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}` : raw;
}

export function organizationLd(settings: SiteSettings | null): JsonLd {
  const sameAs = [settings?.facebook, settings?.instagram].map(filled).filter((url) => /^https:\/\//.test(url));
  return {
    "@type": "RealEstateAgent",
    "@id": ORG_ID,
    name: filled(settings?.nombreComercial) || SITE_NAME,
    url: absolute("/"),
    logo: absolute("/brand/fortius-logo.png"),
    image: absolute("/opengraph-image.png"),
    ...(filled(settings?.telefono) ? { telephone: internationalPhone(filled(settings?.telefono)) } : {}),
    ...(filled(settings?.email) ? { email: filled(settings?.email) } : {}),
    // Negocio de área de servicio (titular, 13/11/2026: «visitamos al cliente», sin oficina abierta al
    // público): solo ciudad y estado, nunca calle ni código postal; la cobertura va en areaServed.
    address: { "@type": "PostalAddress", addressLocality: "Tijuana", addressRegion: "Baja California", addressCountry: "MX" },
    areaServed: AREA_SERVED.map((name) => ({ "@type": "City", name })),
    openingHoursSpecification: OPENING_HOURS,
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function websiteLd(): JsonLd {
  return { "@type": "WebSite", "@id": WEBSITE_ID, name: SITE_NAME, url: absolute("/"), inLanguage: "es-MX", publisher: { "@id": ORG_ID } };
}

export type Crumb = { name: string; path: string };

export function breadcrumbLd(items: Crumb[]): JsonLd {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: absolute(item.path) })),
  };
}

export function blogPostingLd(post: Post, coverSrc?: string): JsonLd {
  const url = absolute(`/blog/${post.slug}`);
  const autor = filled(post.autor);
  return {
    "@type": "BlogPosting",
    headline: post.titulo,
    description: post.resumen,
    url,
    mainEntityOfPage: url,
    inLanguage: "es-MX",
    ...(coverSrc ? { image: absolute(coverSrc) } : {}),
    // Sin fecha de publicación capturada no se emite: no se inventa.
    ...(post.publicadoEl ? { datePublished: post.publicadoEl } : {}),
    dateModified: post.actualizadoEl,
    author: autor ? { "@type": "Person", name: autor } : { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
  };
}

/* Apartada sigue a la vista pero ya no se puede ofertar; vendida o rentada ya no está disponible. */
function availability(estado: Property["estado"]) {
  if (estado === "disponible") return "https://schema.org/InStock";
  if (estado === "apartada") return "https://schema.org/LimitedAvailability";
  return "https://schema.org/SoldOut";
}

/**
  Ficha de un inmueble: el anuncio y sus migas. La oferta (precio y disponibilidad) solo va con
  precio publicado y en inmuebles reales: una ficha de ejemplo no anuncia una oferta vigente.
*/
export function propertyLd(p: Property): JsonLd[] {
  const url = absolute(`/inventario/${p.slug}`);
  const tipoEnOperacion = `${TIPO_LABELS[p.tipo]} en ${OPERACION_LABELS[p.operacion].toLowerCase()}`;
  const listing: JsonLd = {
    "@type": "RealEstateListing",
    name: p.titulo,
    description: p.descripcion[0],
    url,
    image: p.galeria.map((g) => absolute(g.src)),
    datePosted: p.publicadaEl,
    // Google pide la ciudad; la zona capturada es la colonia o el municipio.
    address: { "@type": "PostalAddress", addressLocality: municipioDeZona(p.zona), addressRegion: "Baja California", addressCountry: "MX" },
    containedInPlace: { "@type": "Place", name: p.zona },
    provider: { "@id": ORG_ID },
    ...(p.precio.modalidad === "publico" && !p.demo
      ? { offers: { "@type": "Offer", url, price: p.precio.monto, priceCurrency: p.precio.moneda, availability: availability(p.estado), seller: { "@id": ORG_ID } } }
      : {}),
  };
  const crumbs = breadcrumbLd([
    { name: "Inicio", path: "/" },
    { name: "Propiedades", path: "/inventario" },
    { name: tipoEnOperacion, path: `/inventario?tipo=${p.tipo}&op=${p.operacion}` },
    { name: p.titulo, path: `/inventario/${p.slug}` },
  ]);
  return [listing, crumbs];
}

/** Serializa uno o varios nodos con su @context; `<` se escapa para que el texto no cierre el script. */
export function serializeLd(nodes: JsonLd | JsonLd[]): string {
  const data = Array.isArray(nodes) ? { "@context": "https://schema.org", "@graph": nodes } : { "@context": "https://schema.org", ...nodes };
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
