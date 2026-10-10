import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { MessagingContact } from "@/components/contact/messaging-actions";
import { PublicFeaturesProvider } from "@/components/providers/public-features-provider";
import { homeText, resolveSiteContent, SITE_COPY } from "@/data/home-copy";

test("the commercial refresh updates shipped defaults without mutating stored content or custom fields", () => {
  const stored = {
    ...SITE_COPY,
    heroTitulo: "Inmobiliaria para\ncomprar y vender.",
    heroSubtitulo: "En Fortius te ayudamos a comparar propiedades, coordinar visitas y negociar las condiciones de tu compra o venta. Tu asesor reúne la información y da seguimiento a la operación para que puedas decidir.",
    manifiestoTitulo: "Cómo proponemos\nel precio de venta.",
    manifiestoTexto: "Texto aprobado por mi equipo.",
    homeTexts: {
      metodoTitulo: "Qué hacemos\npara vender tu propiedad.",
      entregablesTitulo: "Documentos\nque te entregamos.",
      preguntasTitulo: "Preguntas\nsobre la venta.",
      gastosTexto: "Estimación personalizada del servicio.",
    },
  };
  const before = structuredClone(stored);
  const resolved = resolveSiteContent(stored);
  expect(resolved.heroTitulo.replaceAll("\n", " ")).toBe("Tu propiedad merece una estrategia, no solo un anuncio.");
  expect(resolved.heroSubtitulo).toContain("Somos una inmobiliaria en Baja California.");
  expect(resolved.manifiestoTitulo.replaceAll("\n", " ")).toBe("Información para decidir. Un asesor para coordinar.");
  expect(resolved.manifiestoTexto).toBe(stored.manifiestoTexto);
  expect(homeText(resolved, "metodoTitulo").replaceAll("\n", " ")).toBe("Nuestro método. Seis etapas para coordinar tu venta.");
  expect(homeText(resolved, "entregablesTitulo").replaceAll("\n", " ")).toBe("Documentos y seguimiento.");
  expect(homeText(resolved, "preguntasTitulo").replaceAll("\n", " ")).toBe("Preguntas antes de avanzar.");
  expect(homeText(resolved, "gastosTexto")).toBe(stored.homeTexts.gastosTexto);
  expect(stored).toEqual(before);
});

test("Fortius branding refreshes stored copy without changing property codes or site links", () => {
  const content = resolveSiteContent({
    heroTitulo: "Vende con MNT", heroSubtitulo: "Texto propio del equipo",
    manifiestoTitulo: "Precio", manifiestoTexto: "Expediente MNT-001",
    seoTitle: "MNT Inmuebles | Texto propio", seoDescription: "https://fortius-inmuebles.vercel.app",
    homeTexts: { contratoTexto: "Contrato de MNT Inmuebles para MNT-001" },
  });
  expect(content.heroTitulo).toBe("Vende con Fortius");
  expect(content.heroSubtitulo).toBe("Texto propio del equipo");
  expect(content.seoTitle).toBe("Fortius Inmuebles | Texto propio");
  expect(content.manifiestoTexto).toBe("Expediente MNT-001");
  expect(content.seoDescription).toBe("https://fortius-inmuebles.vercel.app");
  expect(homeText(content, "contratoTexto")).toBe("Contrato de Fortius Inmuebles para MNT-001");
});

test("contact never invites visitors into a disabled form", () => {
  const html = renderToStaticMarkup(<PublicFeaturesProvider publicLeadsEnabled={false}>
    <MessagingContact><form aria-label="Solicitud" /></MessagingContact>
  </PublicFeaturesProvider>);
  expect(html).not.toContain("<form");
  expect(html).not.toContain("<details");
  expect(html).toContain('href="/inventario"');
  expect(html).toContain("El contacto directo estará disponible próximamente.");
});

test("a configured phone remains a usable channel without messaging or forms", () => {
  const settings = { nombreComercial: "MNT", telefono: "+52 664 123 4567", whatsapp: "", facebook: "", email: "", horario: "", instagram: "", videoInstitucionalUrl: "" };
  const html = renderToStaticMarkup(<PublicFeaturesProvider publicLeadsEnabled={false} settings={settings}>
    <MessagingContact><form /></MessagingContact>
  </PublicFeaturesProvider>);
  expect(html).toContain('href="tel:+526641234567"');
  expect(html).not.toContain("próximamente");
  expect(html).not.toContain("<form");
});

test("editorial refresh replaces only known legacy defaults and preserves bespoke panel copy", () => {
  const legacy = resolveSiteContent({
    heroTitulo: "Vende con plan, no con anuncios.", heroSubtitulo: "",
    manifiestoTitulo: "No nos limitamos a tomar fotos. Creamos un proceso.", manifiestoTexto: "",
    seoTitle: "MNT Inmuebles | Venta de propiedades en Tijuana",
    seoDescription: "Firma inmobiliaria en Tijuana y Baja California. Precio con datos, expediente revisado y seguimiento por escrito, de la captación a la firma ante notario.",
  });
  expect(legacy.heroTitulo).toBe("Tu propiedad merece\nuna estrategia,\nno solo un anuncio.");
  for (const city of ["Tijuana", "Rosarito", "Tecate", "Ensenada"]) {
    expect(legacy.seoTitle).toContain(city);
    expect(legacy.seoDescription).toContain(city);
  }
  const custom = resolveSiteContent({ ...legacy, heroTitulo: "Una firma propia", homeTexts: { relatoTexto: "Contenido aprobado por el equipo" } });
  expect(custom.heroTitulo).toBe("Una firma propia");
  expect(homeText(custom, "relatoTexto")).toBe("Contenido aprobado por el equipo");
  expect(homeText(undefined, "relatoTexto")).not.toContain("La mayoría");
});

test("the alternative refreshes previously published defaults while preserving custom panel fields", () => {
  const old = resolveSiteContent({
    heroTitulo: "Tu propiedad en Tijuana.\nUn plan para venderla.",
    heroSubtitulo: "Revisamos la documentación, analizamos el mercado y acordamos contigo cómo presentar la propiedad. Durante la venta, recibes seguimiento por escrito y acompañamiento para evaluar las ofertas.",
    manifiestoTitulo: "Cada decisión,\ncon información.",
    manifiestoTexto: "Texto específico del equipo",
    seoTitle: "SEO propio", seoDescription: "Descripción propia",
    homeTexts: {
      metodoTitulo: "Conoce cómo\navanzará tu venta.",
      relatoTexto: "Contenido aprobado por el equipo",
    },
  });
  expect(old.heroTitulo).toBe("Tu propiedad merece\nuna estrategia,\nno solo un anuncio.");
  expect(old.manifiestoTitulo).toBe("Información para decidir.\nUn asesor para coordinar.");
  expect(old.manifiestoTexto).toBe("Texto específico del equipo");
  expect(homeText(old, "metodoTitulo")).toBe("Nuestro método.\nSeis etapas para coordinar tu venta.");
  expect(homeText(old, "relatoTexto")).toBe("Contenido aprobado por el equipo");
  expect(old.seoTitle).toBe("SEO propio");
  expect(old.seoDescription).toBe("Descripción propia");
});

test("Fortius also updates customized Mint copy without rewriting URL or record identifiers", () => {
  const content = resolveSiteContent({ heroTitulo: "Mint vende contigo", heroSubtitulo: "Texto personal de Mint", manifiestoTitulo: "Precio", manifiestoTexto: "MNT-001 / Mint_001", seoTitle: "Mint Inmuebles", seoDescription: "https://fortius-inmuebles.vercel.app", homeTexts: { contratoTexto: "Compromisos de Mint" } });
  expect(content.heroTitulo).toBe("Fortius vende contigo");
  expect(content.heroSubtitulo).toBe("Texto personal de Fortius");
  expect(content.manifiestoTexto).toBe("MNT-001 / Mint_001");
  expect(homeText(content, "contratoTexto")).toBe("Compromisos de Fortius");
});
