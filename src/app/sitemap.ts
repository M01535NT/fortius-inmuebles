import type { MetadataRoute } from "next";

import { siteConfig } from "@/data/site";

const routes = [
  "",
  "/residencial",
  "/comercial",
  "/industrial",
  "/vender-propiedad",
  "/comprar-propiedad",
  "/due-diligence-inmobiliaria",
  "/inventario",
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
