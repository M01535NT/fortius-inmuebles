import { FASES } from "@/data/metodo";
import { homeText, resolveSiteContent, type HomeTextKey } from "@/data/home-copy";
import type { SiteContent } from "@/lib/admin/store";

/* Textos de Inicio editables desde el panel, ordenados para la dirección Nocturno. */

/** Los cuatro pilares de «Por qué Fortius», con los textos editables del panel. */
export function pilaresDe(content?: SiteContent | null) {
  const copy = resolveSiteContent(content);
  return [
    { title: "Precio con referencias", text: copy.manifiestoTexto },
    { title: "Pendientes identificados", text: homeText(content, "relatoTexto") },
    { title: "Promoción acordada", text: homeText(content, "relatoApoyo") },
    { title: "Seguimiento de la operación", text: "Recibes información de consultas, visitas y ofertas para decidir cómo avanzar." },
  ];
}

export function etapasDe(content?: SiteContent | null) {
  return FASES.map((stage) => ({ n: stage.n, title: stage.title, text: homeText(content, stage.copy) }));
}

const DOCS: { title: string; copy: HomeTextKey }[] = [
  { title: "Análisis de factibilidad", copy: "factibilidadTexto" },
  { title: "Opinión de valor", copy: "valorTexto" },
  { title: "Plan de comercialización", copy: "planTexto" },
  { title: "Estimación de gastos", copy: "gastosTexto" },
  { title: "Contrato de servicios", copy: "contratoTexto" },
  { title: "Reportes de seguimiento", copy: "reportesTexto" },
];

export function entregablesDe(content?: SiteContent | null) {
  return {
    intro: homeText(content, "entregablesTexto"),
    documents: DOCS.map((doc) => ({ title: doc.title, text: homeText(content, doc.copy) })),
  };
}
