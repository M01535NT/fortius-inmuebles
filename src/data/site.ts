/*
  Site data for COTA (provisional brand name).
  Only what the current routes consume. The home page owns its own copy in
  src/components/home/*; interior routes read from here until their redesign.
*/

export const siteConfig = {
  name: "Cota",
  descriptor: "Bienes raíces con método",
  url: "https://cota.example", // TODO: real domain
  platformUrl:
    process.env.NEXT_PUBLIC_PLATFORM_URL ?? "https://inmobiliaria-os.vercel.app",
  contact: {
    // TODO(T031): datos reales del cliente. Placeholders para el prototipo.
    phone: "+52 664 000 0000",
    phoneHref: "tel:+526640000000",
    whatsapp: "https://wa.me/526640000000",
    messenger: "https://m.me/cotainmobiliaria",
    email: "contacto@cota.mx",
  },
  media: {
    /* URL del video institucional "cómo trabajamos" (mp4 o stream).
       null = se muestra el espacio reservado; el cliente carga el real. */
    videoInstitucionalUrl: null as string | null,
  },
};

// El inventario vive en src/data/propiedades.ts (datos demo hasta el backend).

export const routePages = {
  residencial: {
    title: "Residencial con criterio de cierre",
    eyebrow: "Residencial",
    description:
      "Acompañamos compra, venta y renta residencial con análisis de precio, zona, expediente y tiempos reales de decisión.",
    bullets: [
      "Lectura de zona y comparables.",
      "Preparación de ficha y expediente.",
      "Filtro de prospectos y visitas.",
      "Acompañamiento comercial hasta cierre.",
    ],
  },
  comercial: {
    title: "Activos comerciales con lectura de negocio",
    eyebrow: "Comercial",
    description:
      "Trabajamos locales, oficinas y espacios comerciales considerando ubicación, flujo, condiciones y objetivo de salida.",
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
      "Lectura de accesos y operación.",
      "Cuidado documental.",
      "Comercialización dirigida.",
    ],
  },
  vender: {
    title: "Antes de vender, confirma si estás listo",
    eyebrow: "Vender inmueble",
    description:
      "El primer paso no es publicar. Es entender valor, expediente, tiempos, condiciones y estrategia de salida.",
    bullets: [
      "Opinión inicial de valor.",
      "Revisión de información básica.",
      "Preparación comercial del inmueble.",
      "Filtro y seguimiento de prospectos.",
    ],
  },
  comprar: {
    title: "Comprar con información, no con prisa",
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
      "Una revisión temprana ayuda a detectar fricciones documentales, comerciales o de negociación.",
    bullets: [
      "Revisión documental inicial.",
      "Identificación de riesgos comerciales.",
      "Criterio para precio y negociación.",
      "Recomendación de siguiente paso.",
    ],
  },
};
