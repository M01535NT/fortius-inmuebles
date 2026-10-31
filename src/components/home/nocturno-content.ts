import { FASES } from "@/data/metodo";
import { homeText, resolveSiteContent, type HomeTextKey } from "@/data/home-copy";
import type { SiteContent } from "@/lib/admin/store";

/* Textos de Inicio editables desde el panel, ordenados para la dirección Nocturno. */

/** Los cuatro puntos de «Lo que recibes», con los textos editables del panel. */
export function pilaresDe(content?: SiteContent | null) {
  const copy = resolveSiteContent(content);
  return [
    { title: "El precio, explicado", text: copy.manifiestoTexto },
    { title: "Lo que falta, a tiempo", text: homeText(content, "relatoTexto") },
    { title: "Dónde se publica", text: homeText(content, "relatoApoyo") },
    { title: "Qué pasó con tu venta", text: "Consultas, visitas y ofertas, por escrito." },
  ];
}

export function etapasDe(content?: SiteContent | null) {
  return FASES.map((stage) => ({ n: stage.n, title: stage.title, text: homeText(content, stage.copy), docs: stage.docs, src: stage.src, alt: stage.alt }));
}

const DOCS: { title: string; copy: HomeTextKey }[] = [
  { title: "Opinión jurídica", copy: "factibilidadTexto" },
  { title: "Opinión de valor", copy: "valorTexto" },
  { title: "Estimación de lo que recibes", copy: "gastosTexto" },
  { title: "Contrato de intermediación", copy: "contratoTexto" },
  { title: "Plan de comercialización", copy: "planTexto" },
  { title: "Reporte de comercialización", copy: "reportesTexto" },
];

export function entregablesDe(content?: SiteContent | null) {
  return {
    intro: homeText(content, "entregablesTexto"),
    documents: DOCS.map((doc) => ({ title: doc.title, text: homeText(content, doc.copy) })),
  };
}
