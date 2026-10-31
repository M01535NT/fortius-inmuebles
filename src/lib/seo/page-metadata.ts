import type { Metadata } from "next";

import { siteConfig } from "@/data/site";

export const SITE_NAME = "Fortius Inmuebles";
export const TITLE_SUFFIX = ` | ${SITE_NAME}`;
const MAX_TITLE = 60;

type PageMetadataInput = {
  path: string;
  title: string;
  description: string;
  robots?: Metadata["robots"];
  type?: "website" | "article";
};

/** Título completo como lo ve Google: con el sufijo, salvo que ya pase de 60 caracteres. */
export function fullTitle(title: string): string {
  return title.length + TITLE_SUFFIX.length > MAX_TITLE ? title : `${title}${TITLE_SUFFIX}`;
}

/**
  Metadatos de una página pública. Next reemplaza el `openGraph` del layout completo cuando una
  página declara el suyo, así que aquí va entero (sitio, idioma, tipo y URL) para que cada página
  se comparta con su propio título y no con el de la portada. La imagen la pone opengraph-image.png.
*/
export function pageMetadata({ path, title, description, robots, type = "website" }: PageMetadataInput): Metadata {
  const shown = fullTitle(title);
  const url = new URL(path, siteConfig.url).href;
  return {
    title: shown === title ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: { title: shown, description, url, siteName: SITE_NAME, locale: "es_MX", type },
    twitter: { card: "summary_large_image", title: shown, description },
    ...(robots ? { robots } : {}),
  };
}
