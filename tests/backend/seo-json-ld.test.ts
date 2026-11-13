import { describe, expect, test } from "vitest";

import type { Property } from "@/data/propiedades";
import { municipioDeZona } from "@/data/zonas";
import { siteConfig } from "@/data/site";
import type { Post, SiteSettings } from "@/lib/domain/records";
import { blogPostingLd, breadcrumbLd, internationalPhone, ORG_ID, organizationLd, propertyLd, serializeLd, websiteLd } from "@/lib/seo/json-ld";
import { propiedades } from "../fixtures/propiedades";
import { fullTitle, pageMetadata } from "@/lib/seo/page-metadata";

const settings: SiteSettings = {
  nombreComercial: "Fortius Inmuebles",
  telefono: "+52 664 000 0000",
  whatsapp: "",
  email: "contacto@example.com",
  horario: "",
  facebook: "",
  instagram: "https://www.instagram.com/ejemplo",
  videoInstitucionalUrl: "",
};

const post: Post = {
  id: "1",
  slug: "cuanto-vale-mi-casa",
  titulo: "¿Cuánto vale mi casa?",
  resumen: "Cómo estimar un precio.",
  contenido: "Texto",
  estado: "publicado",
  actualizadoEl: "2026-10-20",
};

describe("datos de la empresa", () => {
  test("solo emite el contacto y las redes capturadas", () => {
    const org = organizationLd(settings);
    expect(org).toMatchObject({ "@type": "RealEstateAgent", "@id": ORG_ID, telephone: settings.telefono, email: settings.email });
    expect(org.sameAs).toEqual([settings.instagram]);
    expect(org.address).toEqual({ "@type": "PostalAddress", addressLocality: "Tijuana", addressRegion: "Baja California", addressCountry: "MX" });
    expect(org).not.toHaveProperty("streetAddress");
  });

  test("sin configuración pública no inventa teléfono, correo ni redes", () => {
    const org = organizationLd(null);
    expect(org.name).toBe("Fortius Inmuebles");
    expect(org).not.toHaveProperty("telephone");
    expect(org).not.toHaveProperty("email");
    expect(org).not.toHaveProperty("sameAs");
  });

  test("negocio de área de servicio: sin calle ni código postal, con los municipios que atiende", () => {
    const org = organizationLd(settings);
    expect(JSON.stringify(org)).not.toMatch(/streetAddress|postalCode|geo/);
    expect(org.areaServed).toEqual([{ "@type": "City", name: "Tijuana" }]);
  });

  test("publica el horario de lunes a viernes de 9:00 a 18:00", () => {
    expect(organizationLd(null).openingHoursSpecification).toEqual([{
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => `https://schema.org/${day}`),
      opens: "09:00",
      closes: "18:00",
    }]);
  });

  test("el sitio apunta a la empresa", () => {
    expect(websiteLd()).toMatchObject({ "@type": "WebSite", inLanguage: "es-MX", publisher: { "@id": ORG_ID } });
  });
});

describe("artículos y migas", () => {
  test("sin fecha de publicación no emite datePublished y firma la empresa", () => {
    const ld = blogPostingLd(post);
    expect(ld).not.toHaveProperty("datePublished");
    expect(ld).toMatchObject({ dateModified: "2026-10-20", author: { "@id": ORG_ID }, publisher: { "@id": ORG_ID } });
  });

  test("con autor y fecha capturados los usa", () => {
    const ld = blogPostingLd({ ...post, autor: "Moisés Núñez", publicadoEl: "2026-10-01" }, "/blog/portada.webp");
    expect(ld).toMatchObject({ datePublished: "2026-10-01", author: { "@type": "Person", name: "Moisés Núñez" }, image: `${new URL("/blog/portada.webp", siteConfig.url).href}` });
  });

  test("las migas llevan posición y URL absoluta", () => {
    const ld = breadcrumbLd([{ name: "Inicio", path: "/" }, { name: "Blog", path: "/blog" }]);
    expect(ld.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Inicio", item: new URL("/", siteConfig.url).href },
      { "@type": "ListItem", position: 2, name: "Blog", item: new URL("/blog", siteConfig.url).href },
    ]);
  });

  test("el texto no puede cerrar el bloque de datos", () => {
    const json = serializeLd(blogPostingLd({ ...post, titulo: "</script><script>alert(1)</script>" }));
    expect(json).not.toContain("</script>");
    expect(JSON.parse(json).headline).toBe("</script><script>alert(1)</script>");
  });

  test("varios nodos van en un @graph", () => {
    const parsed = JSON.parse(serializeLd([websiteLd(), organizationLd(null)]));
    expect(parsed["@context"]).toBe("https://schema.org");
    expect(parsed["@graph"]).toHaveLength(2);
  });
});

describe("metadatos por página", () => {
  test("cada página se comparte con su título, descripción y URL", () => {
    const meta = pageMetadata({ path: "/contacto", title: "Contacto", description: "Hablemos." });
    expect(meta.alternates).toEqual({ canonical: "/contacto" });
    expect(meta.openGraph).toMatchObject({
      title: "Contacto | Fortius Inmuebles",
      description: "Hablemos.",
      url: new URL("/contacto", siteConfig.url).href,
      siteName: "Fortius Inmuebles",
      locale: "es_MX",
      type: "website",
    });
    expect(meta.twitter).toMatchObject({ card: "summary_large_image", title: "Contacto | Fortius Inmuebles" });
    expect(meta).not.toHaveProperty("robots");
  });

  test("un título largo va sin el sufijo de la marca", () => {
    const largo = "Gastos de cierre al comprar casa en Tijuana con crédito";
    expect(fullTitle(largo)).toBe(largo);
    expect(pageMetadata({ path: "/x", title: largo, description: "d" }).title).toEqual({ absolute: largo });
  });

  test("conserva el robots de la página", () => {
    const meta = pageMetadata({ path: "/gracias", title: "Gracias", description: "d", robots: { index: false, follow: false } });
    expect(meta.robots).toEqual({ index: false, follow: false });
  });
});

test("el municipio sale de la zona capturada", () => {
  expect(municipioDeZona("Playas de Tijuana")).toBe("Tijuana");
  expect(municipioDeZona("Zona Río")).toBe("Tijuana");
  expect(municipioDeZona("Rosarito")).toBe("Playas de Rosarito");
  expect(municipioDeZona("Ensenada centro")).toBe("Ensenada");
  expect(municipioDeZona("TECATE")).toBe("Tecate");
});

describe("fichas de inmueble", () => {
  const publicado: Property = { ...propiedades[0], demo: false, estado: "disponible", precio: { modalidad: "publico", monto: 3_500_000, moneda: "MXN" } };

  test("un inmueble real con precio publicado anuncia su oferta", () => {
    const [listing] = propertyLd(publicado);
    expect(listing.offers).toMatchObject({ "@type": "Offer", price: 3_500_000, priceCurrency: "MXN", availability: "https://schema.org/InStock", seller: { "@id": ORG_ID } });
  });

  test("una ficha de ejemplo no anuncia una oferta vigente", () => {
    const [listing, crumbs] = propertyLd({ ...publicado, demo: true });
    expect(listing["@type"]).toBe("RealEstateListing");
    expect(listing).not.toHaveProperty("offers");
    expect(crumbs["@type"]).toBe("BreadcrumbList");
  });

  test("sin precio publicado no inventa monto", () => {
    expect(propertyLd({ ...publicado, precio: { modalidad: "consulta" } })[0]).not.toHaveProperty("offers");
  });
});

describe("teléfono en formato internacional", () => {
  test.each([
    ["6642212991", "+52 664 221 2991"],
    ["(664) 221-2991", "+52 664 221 2991"],
    ["+52 664 221 2991", "+52 664 221 2991"],
    ["+1 619 555 0100", "+1 619 555 0100"],
  ])("%s → %s", (raw, expected) => {
    expect(internationalPhone(raw)).toBe(expected);
  });
});
