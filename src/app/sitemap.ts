import type { MetadataRoute } from "next";

import { siteConfig } from "@/data/site";
import { zonas } from "@/data/zonas";

/* El detalle de propiedad NO entra: lleva noindex mientras los datos
   sean demo (quitar ambos guardrails al cargar inventario real). */
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

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
