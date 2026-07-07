/*
  Las cuatro fases del método, tomadas del manual operativo interno
  (Proceso Operativo Inmobiliario). Compartidas por la versión vertical
  (mobile / reduced-motion / modo equilibrado) y la horizontal pinned
  (desktop espectacular).
*/
export type Fase = {
  n: string;
  title: string;
  body: string;
  items: string[];
  image?: { src: string; alt: string };
};

export const FASES: Fase[] = [
  {
    n: "01",
    title: "Captación",
    body: "Antes de aceptar tu propiedad revisamos su situación legal y armamos el análisis comparativo de mercado. El precio de salida se defiende con comparables vendidos, no con corazonadas.",
    items: [
      "Dictamen documental antes de publicar",
      "Análisis comparativo de mercado",
      "Contrato con plan de trabajo por escrito",
    ],
  },
  {
    n: "02",
    title: "Preparación",
    body: "La propiedad se pone a punto antes de salir: reparaciones con retorno claro, fotografía profesional y una ficha distinta para cada canal.",
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
    body: "Calificamos a cada prospecto antes de abrir tu puerta. Las ofertas se reciben por escrito y las analizamos contigo antes de responder.",
    items: [
      "Filtro de prospectos antes de cada visita",
      "Reporte de avances cada 30 días",
      "Ofertas por escrito, analizadas contigo",
    ],
  },
  {
    n: "04",
    title: "Cierre",
    body: "Coordinamos notario, expediente y firma. Los costos se estiman desde antes, así sabes cuánto paga cada parte y qué sigue después de firmar.",
    items: [
      "Costos de cierre estimados por adelantado",
      "Checklist documental para notario",
      "Entrega de posesión documentada",
    ],
    image: { src: "/hero/casa-playa.webp", alt: "Residencia lista para entrega" },
  },
];
