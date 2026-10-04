import type { Metadata } from "next";
import { formatPrecio, OPERACION_LABELS, TIPO_LABELS, type Property } from "@/data/propiedades";
import { siteConfig } from "@/data/site";

export function propertyShare(p: Property) {
  const configured = new URL(siteConfig.url);
  const origin = ["localhost", "127.0.0.1", "[::1]"].includes(configured.hostname) ? "https://mnt-inmuebles.vercel.app" : configured.origin;
  const url = new URL(`/inventario/${encodeURIComponent(p.slug)}`, origin).href;
  const title = `${p.titulo} · ${OPERACION_LABELS[p.operacion]} | Mint Inmuebles`;
  const details = [p.ficha.recamaras != null ? `${p.ficha.recamaras} recámaras` : "", p.ficha.banos != null ? `${p.ficha.banos} baños` : "", p.ficha.construccionM2 != null ? `${p.ficha.construccionM2} m² de construcción` : ""].filter(Boolean);
  const text = `${p.demo ? "Propiedad de demostración. " : ""}${TIPO_LABELS[p.tipo]} en ${OPERACION_LABELS[p.operacion].toLowerCase()} · ${p.zona} · ${formatPrecio(p.precio)}${details.length ? ` · ${details.join(" · ")}` : ""}.`;
  return { title, text, url, image: `${url}/imagen-social` };
}

export function propertyShareMetadata(p: Property): Metadata {
  const share = propertyShare(p);
  const image = { url: share.image, width: 1200, height: 630, type: "image/jpeg", alt: p.galeria[0]?.alt || p.titulo };
  return {
    title: p.titulo,
    description: share.text,
    alternates: { canonical: share.url },
    openGraph: { title: share.title, description: share.text, url: share.url, type: "website", siteName: "Mint Inmuebles", locale: "es_MX", images: [image] },
    twitter: { card: "summary_large_image", title: share.title, description: share.text, images: [image] },
    robots: p.demo ? { index: false, follow: true } : undefined,
  };
}
