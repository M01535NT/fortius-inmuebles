/*
  Site data for Fortius Inmuebles.
  Static route descriptors and historical placeholders. Live home copy and
  commercial contact settings come from the independent MNT panel.
*/

export const productionOrigin = "https://fortius-inmuebles.vercel.app";

export const siteConfig = {
  name: "Fortius Inmuebles",
  descriptor: "Bienes raíces con método",
  url: process.env.MNT_SITE_URL || productionOrigin,
  contact: {
    phone: "",
    phoneHref: "",
    whatsapp: "",
    messenger: "",
    email: "",
  },
  media: {
    /* URL del video institucional "cómo trabajamos" (mp4 o stream).
       null = se muestra el espacio reservado; el cliente carga el real. */
    videoInstitucionalUrl: null as string | null,
  },
};

// El inventario público se lee del backend independiente del panel MNT.

export const routePages = {
  residencial: {
    title: "Casas y departamentos en Tijuana",
    eyebrow: "Residencial",
    description:
      "Te acompañamos al comprar, vender o rentar. Revisamos las características del inmueble, su precio y la documentación disponible.",
    bullets: [
      "Análisis de la zona y de inmuebles comparables.",
      "Preparación de ficha y expediente.",
      "Filtro de prospectos y visitas.",
      "Acompañamiento comercial hasta cierre.",
    ],
  },
  comercial: {
    title: "Locales y oficinas para tu negocio",
    eyebrow: "Comercial",
    description:
      "Revisamos ubicación, accesos y condiciones del espacio según la actividad que buscas desarrollar o el inmueble que quieres ofrecer.",
    bullets: [
      "Análisis de ubicación y demanda.",
      "Revisión de condiciones de uso.",
      "Presentación comercial dirigida.",
      "Negociación con criterios claros.",
    ],
  },
  industrial: {
    title: "Inmuebles industriales con revisión previa",
    eyebrow: "Industrial",
    description:
      "Atendemos naves, terrenos y espacios operativos con foco en documentación, uso previsto, accesos y viabilidad comercial.",
    bullets: [
      "Revisión de uso y características.",
      "Revisión de accesos y necesidades de operación.",
      "Revisión de la documentación disponible.",
      "Comercialización dirigida.",
    ],
  },
  vender: {
    title: "Prepara tu propiedad para vender",
    eyebrow: "Vender inmueble",
    description:
      "Revisamos contigo el precio, los documentos y las condiciones de la venta antes de acordar cómo presentar la propiedad.",
    bullets: [
      "Opinión inicial de valor.",
      "Revisión de información básica.",
      "Preparación comercial del inmueble.",
      "Filtro y seguimiento de prospectos.",
    ],
  },
  comprar: {
    title: "Encuentra una propiedad que se ajuste a tus planes",
    eyebrow: "Comprar inmueble",
    description:
      "Acompañamos la búsqueda y evaluación de propiedades con información clara para decidir mejor.",
    bullets: [
      "Definición de objetivo y zona.",
      "Comparación de alternativas.",
      "Revisión de información relevante.",
      "Acompañamiento en oferta y cierre.",
    ],
  },
  dueDiligence: {
    title: "Due diligence inmobiliaria antes de avanzar",
    eyebrow: "Due diligence",
    description:
      "Revisamos la documentación disponible para identificar pendientes y riesgos que conviene resolver antes de comprometerte.",
    bullets: [
      "Revisión documental inicial.",
      "Identificación de riesgos comerciales.",
      "Criterio para precio y negociación.",
      "Recomendación de siguiente paso.",
    ],
  },
};
