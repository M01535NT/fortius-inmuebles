import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { MessagingContact } from "@/components/contact/messaging-actions";
import { PublicFeaturesProvider } from "@/components/providers/public-features-provider";
import { homeText, resolveSiteContent } from "@/data/home-copy";

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
  const legacy = resolveSiteContent({ heroTitulo: "Vende con plan, no con anuncios.", heroSubtitulo: "", manifiestoTitulo: "No nos limitamos a tomar fotos. Creamos un proceso.", manifiestoTexto: "", seoTitle: "", seoDescription: "" });
  expect(legacy.heroTitulo).toBe("Vende tu propiedad\nen Tijuana.");
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
  expect(old.heroTitulo).toBe("Vende tu propiedad\nen Tijuana.");
  expect(old.manifiestoTitulo).toBe("Cómo proponemos\nel precio de venta.");
  expect(old.manifiestoTexto).toBe("Texto específico del equipo");
  expect(homeText(old, "metodoTitulo")).toBe("Qué hacemos\npara vender tu propiedad.");
  expect(homeText(old, "relatoTexto")).toBe("Contenido aprobado por el equipo");
  expect(old.seoTitle).toBe("SEO propio");
  expect(old.seoDescription).toBe("Descripción propia");
});
