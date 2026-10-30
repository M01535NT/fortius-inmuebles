/*
  Site data for Fortius Inmuebles.
  Static route descriptors and historical placeholders. Live home copy and
  commercial contact settings come from the independent MNT panel.
*/

export const productionOrigin = "https://fortiusinmuebles.com";

export const siteConfig = {
  name: "Fortius Inmuebles",
  descriptor: "Bienes raíces con método",
  url: process.env.FORTIUS_INMUEBLES_SITE_URL || productionOrigin,
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
      "Uso, presupuesto y momento de compra.",
      "Alternativas y costo total estimado.",
      "Datos disponibles y pendientes de cada inmueble.",
      "Oferta y condiciones por escrito.",
    ],
  },
};
