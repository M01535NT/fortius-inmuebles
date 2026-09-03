import type { MetadataRoute } from "next";

import { siteConfig } from "@/data/site";
import { zonas } from "@/data/zonas";
import { getPropiedades } from "@/lib/inventario";

/* Las propiedades demo nunca se incluyen, aunque estén publicadas. */
export const dynamic = "force-dynamic";
const routes = [
  "",
  "/residencial",
  "/comercial",
  "/industrial",
  "/vender-propiedad",
  "/comprar-propiedad",
  "/due-diligence-inmobiliaria",
  "/inventario",
  "/herramientas",
  "/herramientas/hipoteca",
  "/herramientas/gastos-de-cierre",
  "/zonas",
  ...zonas.map((z) => `/zonas/${z.slug}`),
  "/nosotros",
  "/contacto",
  "/privacidad",
  "/terminos",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const properties = (await getPropiedades()).filter((p) => !p.demo);
  return [...routes, ...properties.map((p) => `/inventario/${p.slug}`)].map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
