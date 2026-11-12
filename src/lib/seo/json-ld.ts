import { siteConfig } from "@/data/site";
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
const AREA_SERVED = ["Tijuana", "Playas de Rosarito", "Tecate", "Ensenada"];

const absolute = (path: string) => new URL(path, siteConfig.url).href;
const filled = (value: string | undefined | null) => (value ?? "").trim();

export function organizationLd(settings: SiteSettings | null): JsonLd {
  const sameAs = [settings?.facebook, settings?.instagram].map(filled).filter((url) => /^https:\/\//.test(url));
  return {
    "@type": "RealEstateAgent",
    "@id": ORG_ID,
    name: filled(settings?.nombreComercial) || SITE_NAME,
    url: absolute("/"),
    logo: absolute("/brand/fortius-logo.png"),
    image: absolute("/opengraph-image.png"),
    ...(filled(settings?.telefono) ? { telephone: filled(settings?.telefono) } : {}),
    ...(filled(settings?.email) ? { email: filled(settings?.email) } : {}),
    address: { "@type": "PostalAddress", addressLocality: "Tijuana", addressRegion: "Baja California", addressCountry: "MX" },
    areaServed: AREA_SERVED.map((name) => ({ "@type": "City", name })),
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

/** Serializa uno o varios nodos con su @context; `<` se escapa para que el texto no cierre el script. */
export function serializeLd(nodes: JsonLd | JsonLd[]): string {
  const data = Array.isArray(nodes) ? { "@context": "https://schema.org", "@graph": nodes } : { "@context": "https://schema.org", ...nodes };
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
