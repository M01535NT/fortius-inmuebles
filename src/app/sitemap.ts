import type { MetadataRoute } from "next";

import { siteConfig } from "@/data/site";
import { zonas } from "@/data/zonas";
import { getPropiedades } from "@/lib/inventario";
import { getBlogPosts } from "@/lib/blog";

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
  "/blog",
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
  const [allProperties, posts] = await Promise.all([
    getPropiedades(),
    getBlogPosts(),
  ]);
  const properties = allProperties.filter((p) => !p.demo);
  const staticRows: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `${siteConfig.url}${route}`,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
  const propertyRows: MetadataRoute.Sitemap = properties.map((property) => ({
    url: `${siteConfig.url}/inventario/${property.slug}`,
    lastModified: new Date(property.publicadaEl),
    changeFrequency: "monthly",
    priority: 0.7,
  }));
  const postRows: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${siteConfig.url}/blog/${post.slug}`,
    lastModified: new Date(post.actualizadoEl),
    changeFrequency: "monthly",
    priority: 0.7,
  }));
  return [...staticRows, ...propertyRows, ...postRows];
}
