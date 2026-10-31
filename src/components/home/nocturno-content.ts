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
    { title: "Qué pasó con tu venta", text: "Qué consultas, visitas y ofertas hubo, por escrito." },
  ];
}

export function etapasDe(content?: SiteContent | null) {
  return FASES.map((stage) => ({ n: stage.n, title: stage.title, text: homeText(content, stage.copy), doc: stage.doc, src: stage.src, alt: stage.alt }));
}

const DOCS: { title: string; copy: HomeTextKey }[] = [
  { title: "Análisis de factibilidad", copy: "factibilidadTexto" },
  { title: "Opinión de valor", copy: "valorTexto" },
  { title: "Contrato de servicios", copy: "contratoTexto" },
  { title: "Plan de comercialización", copy: "planTexto" },
  { title: "Reportes de seguimiento", copy: "reportesTexto" },
  { title: "Estimación de gastos", copy: "gastosTexto" },
];

export function entregablesDe(content?: SiteContent | null) {
  return {
    intro: homeText(content, "entregablesTexto"),
    documents: DOCS.map((doc) => ({ title: doc.title, text: homeText(content, doc.copy) })),
  };
}
