import type { HomeTextKey } from "@/data/home-copy";
/* Vertical process. Main descriptions are edited through the content panel. */
export type Fase = {
  n: string;
  title: string;
  copy: HomeTextKey;
  items: string[];
  image?: { src: string; alt: string };
};

export const FASES: Fase[] = [
  {
    n: "01",
    title: "Captación",
    copy: "captacionTexto",
    items: [
      "Revisión documental inicial",
      "Análisis comparativo de mercado",
      "Contrato con plan de trabajo por escrito",
    ],
  },
  {
    n: "02",
    title: "Preparación",
    copy: "preparacionTexto",
    items: [
      "Puesta a punto y staging",
      "Fotografía y video profesional",
      "Publicación multicanal con estrategia",
    ],
    image: { src: "/hero/interior-depa.webp", alt: "Interior preparado para fotografía profesional" },
  },
  {
    n: "03",
    title: "Comercialización",
    copy: "comercializacionTexto",
    items: [
      "Filtro de prospectos antes de cada visita",
      "Reporte de avances cada 30 días",
      "Ofertas por escrito, analizadas contigo",
    ],
  },
  {
    n: "04",
    title: "Cierre",
    copy: "cierreTexto",
    items: [
      "Costos de cierre estimados por adelantado",
      "Checklist documental para notario",
      "Entrega de posesión documentada",
    ],
    image: { src: "/hero/casa-playa.webp", alt: "Residencia lista para entrega" },
  },
];
