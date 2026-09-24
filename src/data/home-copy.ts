import type { SiteContent } from "@/lib/admin/store";

/** Shared editorial defaults; the panel owns any explicitly edited value. */
export const HOME_FIELDS = {
  relatoTexto: { group: "Presentación", label: "Introducción", value: "Antes de publicar, necesitas saber qué precio proponer, qué documentos faltan y cómo se ofrecerá tu propiedad." },
  relatoApoyo: { group: "Presentación", label: "Texto de apoyo", value: "Empezamos por resolver esas preguntas contigo. Así puedes decidir cómo avanzar y conocer el trabajo que implica la venta." },
  metodoTitulo: { group: "Método", label: "Título", value: "Conoce cómo\navanzará tu venta." },
  metodoTexto: { group: "Método", label: "Introducción", value: "Cuatro fases, con tareas y documentos definidos. Revisamos contigo el alcance del servicio antes de empezar." },
  captacionTexto: { group: "Método", label: "Revisión inicial", value: "Conocemos la propiedad, revisamos la documentación disponible y analizamos inmuebles comparables. Te explicamos qué información respalda el precio propuesto y qué falta por confirmar." },
  preparacionTexto: { group: "Método", label: "Preparación", value: "Acordamos las mejoras que conviene valorar, organizamos la fotografía y reunimos la información que necesitará un comprador." },
  comercializacionTexto: { group: "Método", label: "Comercialización", value: "Revisamos las necesidades de los interesados y coordinamos las visitas. Recibes un reporte cada 30 días; cuando llega una oferta, analizamos contigo el precio, la forma de pago y las condiciones." },
  cierreTexto: { group: "Método", label: "Cierre", value: "Damos seguimiento a los documentos y requisitos con la notaría y las partes. Los gastos se presentan como estimaciones hasta que los confirme quien corresponda." },
  entregablesTitulo: { group: "Entregables", label: "Título", value: "Lo que recibes\ndurante la venta." },
  entregablesTexto: { group: "Entregables", label: "Introducción", value: "El trabajo queda por escrito. Estos documentos te ayudan a conocer la situación de tu propiedad, tomar decisiones y seguir el avance." },
  factibilidadTexto: { group: "Entregables", label: "Revisión del expediente", value: "Identificamos documentos pendientes y aspectos que requieren revisión antes de ofrecer la propiedad." },
  valorTexto: { group: "Entregables", label: "Opinión de valor", value: "Una propuesta de precio sustentada en inmuebles comparables, con sus fuentes y limitaciones. Distinguimos precios de oferta y operaciones cerradas cuando hay evidencia disponible." },
  planTexto: { group: "Entregables", label: "Plan de comercialización", value: "Los canales, las acciones y el calendario acordados para presentar tu propiedad." },
  gastosTexto: { group: "Entregables", label: "Estimación de gastos", value: "Impuestos, comisión y otros gastos estimados para calcular el importe que podrías recibir. Los montos se confirman según la operación." },
  contratoTexto: { group: "Entregables", label: "Contrato", value: "El alcance del servicio, los honorarios y las obligaciones de cada parte, por escrito." },
  reportesTexto: { group: "Entregables", label: "Reportes", value: "Las consultas, visitas y ofertas recibidas, junto con las acciones del periodo y los siguientes pasos." },
  preguntasTitulo: { group: "Preguntas frecuentes", label: "Título", value: "Antes de\nponerla en venta." },
  tiempoRespuesta: { group: "Preguntas frecuentes", label: "Plazo de venta", value: "Depende de la zona, el precio, el estado del inmueble y la demanda. Revisamos el avance cada 30 días y acordamos ajustes cuando hacen falta. El plazo se estima; una fecha de venta no se puede asegurar." },
  precioRespuesta: { group: "Preguntas frecuentes", label: "Precio de salida", value: "Comparamos ubicación, superficie, características y estado con otros inmuebles. Te explicamos las fuentes utilizadas y distinguimos los precios anunciados de los cierres documentados que estén disponibles." },
  gastosRespuesta: { group: "Preguntas frecuentes", label: "Gastos de cierre", value: "Preparamos una estimación por concepto, según tu operación. Los impuestos, honorarios y demás importes se confirman con la notaría o el especialista correspondiente." },
  inicioRespuesta: { group: "Preguntas frecuentes", label: "Cómo empezar", value: "La ubicación, el tipo de propiedad y un medio para contactarte. Después te indicamos qué documentos necesitamos para revisar el caso." },
  evaluarTitulo: { group: "Contacto", label: "Título", value: "Cuéntanos sobre\ntu propiedad." },
  evaluarTexto: { group: "Contacto", label: "Introducción", value: "Para empezar, necesitamos saber dónde está, qué tipo de inmueble es y cómo contactarte. Te indicamos qué hace falta para una primera revisión." },
} as const;

export type HomeTextKey = keyof typeof HOME_FIELDS;
export type HomeTexts = Partial<Record<HomeTextKey, string>>;
export const HOME_TEXT_KEYS = Object.keys(HOME_FIELDS) as HomeTextKey[];

export function homeText(content: Pick<SiteContent, "homeTexts"> | null | undefined, key: HomeTextKey): string {
  return content?.homeTexts?.[key]?.trim() || HOME_FIELDS[key].value;
}

export const SITE_COPY: Omit<SiteContent, "homeTexts"> = {
  heroTitulo: "Tu propiedad en Tijuana.\nUn plan para venderla.",
  heroSubtitulo: "Revisamos la documentación, analizamos el mercado y acordamos contigo cómo presentar la propiedad. Durante la venta, recibes seguimiento por escrito y acompañamiento para evaluar las ofertas.",
  manifiestoTitulo: "Cada decisión,\ncon información.",
  manifiestoTexto: "Conoce el precio propuesto, los documentos pendientes y los siguientes pasos. El plan se acuerda contigo y el avance queda por escrito.",
  seoTitle: "MNT Inmuebles | Venta de propiedades en Tijuana",
  seoDescription: "Vende tu propiedad en Tijuana con MNT Inmuebles. Análisis de mercado, revisión documental y seguimiento por escrito para acompañar cada etapa de la venta.",
};

const LEGACY: Partial<Record<keyof typeof SITE_COPY, string[]>> = {
  heroTitulo: ["Vende con plan, no con anuncios."],
  heroSubtitulo: ["Precio con datos, expediente revisado y seguimiento por escrito. De la captación a la firma ante notario, en Tijuana y Baja California."],
  manifiestoTitulo: ["No prometemos resultados. Documentamos el proceso.", "No nos limitamos a tomar fotos. Creamos un proceso."],
  manifiestoTexto: ["Cada operación sigue el mismo método por escrito, de la captación a la firma. Por eso siempre sabes en qué paso va la tuya, y qué sigue después."],
  seoTitle: ["MNT Inmuebles | Metodología Inmobiliaria", "MNT Inmuebles | Vende tu propiedad en Tijuana con método"],
};

/** Exact legacy matches only: bespoke staff edits always win, including after rollout. */
export function resolveSiteContent(content?: SiteContent | null): SiteContent {
  const result = { ...SITE_COPY, ...content };
  for (const key of Object.keys(SITE_COPY) as (keyof typeof SITE_COPY)[]) {
    if (!result[key]?.trim() || LEGACY[key]?.includes(result[key].trim())) result[key] = SITE_COPY[key];
  }
  return result;
}
