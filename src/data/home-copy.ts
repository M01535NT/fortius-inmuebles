import { brandCopy } from "@/lib/brand-copy";
import type { SiteContent } from "@/lib/admin/store";

/** Shared editorial defaults; the panel owns any explicitly edited value. */
export const HOME_FIELDS = {
  relatoTexto: { group: "Por qué Fortius", label: "Pendientes identificados", value: "Revisamos la documentación disponible antes de ofrecer el inmueble." },
  relatoApoyo: { group: "Por qué Fortius", label: "Promoción acordada", value: "Definimos contigo los canales y las acciones para presentar tu propiedad." },
  metodoTitulo: { group: "Método", label: "Título", value: "Así vendemos tu propiedad." },
  metodoTexto: { group: "Método", label: "Introducción", value: "Desde la primera revisión hasta la entrega, te explicamos qué sigue y qué necesitamos de ti." },
  captacionTexto: { group: "Método", label: "Captación", value: "Conocemos tu objetivo y la propiedad. Identificamos quién puede autorizar la venta y qué documentos necesitamos para revisarla." },
  diagnosticoTexto: { group: "Método", label: "Verificación y precio", value: "Revisamos documentos, características y pendientes. Comparamos inmuebles similares para proponerte un rango y acordar contigo el precio de salida." },
  preparacionTexto: { group: "Método", label: "Contrato y preparación", value: "Dejamos por escrito el servicio, los honorarios y las autorizaciones. Preparamos la ficha, las fotografías y el plan de publicación con información que se pueda respaldar." },
  comercializacionTexto: { group: "Método", label: "Publicación y seguimiento", value: "Publicamos la propiedad en los canales acordados y comprobamos que los anuncios muestren datos y disponibilidad vigentes. Te informamos de las consultas y del avance de la campaña." },
  visitasOfertasTexto: { group: "Método", label: "Visitas y ofertas", value: "Coordinamos visitas con interesados compatibles y registramos sus dudas. Cuando llega una oferta, revisamos contigo precio, forma de pago, plazos y condiciones antes de responder." },
  cierreTexto: { group: "Método", label: "Cierre y entrega", value: "Coordinamos la firma con las partes y la notaría. Verificamos los pagos, documentamos la entrega de llaves e inventario y damos seguimiento a los trámites pendientes." },
  entregablesTitulo: { group: "Entregables", label: "Título", value: "Documentos\ny seguimiento." },
  entregablesTexto: { group: "Entregables", label: "Introducción", value: "El contrato establece qué documentos preparamos y entregamos durante tu operación." },
  factibilidadTexto: { group: "Entregables", label: "Revisión del expediente", value: "Documentos pendientes y aspectos que deben revisarse antes de ofrecer el inmueble." },
  valorTexto: { group: "Entregables", label: "Opinión de valor", value: "Precio propuesto, propiedades comparadas, fuentes y límites de la información disponible." },
  planTexto: { group: "Entregables", label: "Plan de comercialización", value: "Dónde se publicará el inmueble, qué acciones se realizarán y en qué fechas." },
  gastosTexto: { group: "Entregables", label: "Estimación de gastos", value: "Impuestos, comisión y otros gastos estimados para calcular cuánto podrías recibir. Los importes se confirman para cada operación." },
  contratoTexto: { group: "Entregables", label: "Contrato", value: "Servicio contratado, honorarios y obligaciones del propietario y de Fortius." },
  reportesTexto: { group: "Entregables", label: "Reportes", value: "Consultas, visitas y ofertas recibidas, con las acciones realizadas en el periodo." },
  preguntasTitulo: { group: "Preguntas frecuentes", label: "Título", value: "Preguntas\nantes de avanzar." },
  tiempoRespuesta: { group: "Preguntas frecuentes", label: "Plazo de venta", value: "Depende del precio, la ubicación, el estado del inmueble y la demanda. Revisamos las consultas y ofertas para valorar los siguientes pasos." },
  precioRespuesta: { group: "Preguntas frecuentes", label: "Precio de salida", value: "Comparamos la propiedad con inmuebles similares y explicamos las referencias disponibles. El precio de publicación se acuerda contigo." },
  gastosRespuesta: { group: "Preguntas frecuentes", label: "Gastos de cierre", value: "Preparamos una estimación de impuestos, honorarios y otros gastos según la operación. Puedes consultar la calculadora como referencia inicial." },
  inicioRespuesta: { group: "Preguntas frecuentes", label: "Cómo empezar", value: "La ubicación, el tipo de inmueble y un medio de contacto. Con esa información te indicamos qué documentos necesitamos revisar." },
  evaluarTitulo: { group: "Contacto", label: "Título", value: "¿Quieres vender\ntu propiedad?" },
  evaluarTexto: { group: "Contacto", label: "Introducción", value: "Dinos la ubicación y el tipo de inmueble. Te contactamos para pedir los documentos necesarios para revisarlo." },
} as const;

export type HomeTextKey = keyof typeof HOME_FIELDS;
export type HomeTexts = Partial<Record<HomeTextKey, string>>;
export const HOME_TEXT_KEYS = Object.keys(HOME_FIELDS) as HomeTextKey[];

/** Exact shipped defaults can refresh without overwriting edits from the panel. */
const PREVIOUS_HOME_TEXTS: Record<HomeTextKey, string> = {
  relatoTexto: "Antes de publicar, necesitas saber qué precio proponer, qué documentos faltan y cómo se ofrecerá tu propiedad.",
  relatoApoyo: "Empezamos por resolver esas preguntas contigo. Así puedes decidir cómo avanzar y conocer el trabajo que implica la venta.",
  metodoTitulo: "Conoce cómo\navanzará tu venta.",
  metodoTexto: "Cuatro fases, con tareas y documentos definidos. Revisamos contigo el alcance del servicio antes de empezar.",
  captacionTexto: "Conocemos la propiedad, revisamos la documentación disponible y analizamos inmuebles comparables. Te explicamos qué información respalda el precio propuesto y qué falta por confirmar.",
  diagnosticoTexto: "",
  preparacionTexto: "Acordamos las mejoras que conviene valorar, organizamos la fotografía y reunimos la información que necesitará un comprador.",
  comercializacionTexto: "Revisamos las necesidades de los interesados y coordinamos las visitas. Recibes un reporte cada 30 días; cuando llega una oferta, analizamos contigo el precio, la forma de pago y las condiciones.",
  visitasOfertasTexto: "",
  cierreTexto: "Damos seguimiento a los documentos y requisitos con la notaría y las partes. Los gastos se presentan como estimaciones hasta que los confirme quien corresponda.",
  entregablesTitulo: "Lo que recibes\ndurante la venta.",
  entregablesTexto: "El trabajo queda por escrito. Estos documentos te ayudan a conocer la situación de tu propiedad, tomar decisiones y seguir el avance.",
  factibilidadTexto: "Identificamos documentos pendientes y aspectos que requieren revisión antes de ofrecer la propiedad.",
  valorTexto: "Una propuesta de precio sustentada en inmuebles comparables, con sus fuentes y limitaciones. Distinguimos precios de oferta y operaciones cerradas cuando hay evidencia disponible.",
  planTexto: "Los canales, las acciones y el calendario acordados para presentar tu propiedad.",
  gastosTexto: "Impuestos, comisión y otros gastos estimados para calcular el importe que podrías recibir. Los montos se confirman según la operación.",
  contratoTexto: "El alcance del servicio, los honorarios y las obligaciones de cada parte, por escrito.",
  reportesTexto: "Las consultas, visitas y ofertas recibidas, junto con las acciones del periodo y los siguientes pasos.",
  preguntasTitulo: "Antes de\nponerla en venta.",
  tiempoRespuesta: "Depende de la zona, el precio, el estado del inmueble y la demanda. Revisamos el avance cada 30 días y acordamos ajustes cuando hacen falta. El plazo se estima; una fecha de venta no se puede asegurar.",
  precioRespuesta: "Comparamos ubicación, superficie, características y estado con otros inmuebles. Te explicamos las fuentes utilizadas y distinguimos los precios anunciados de los cierres documentados que estén disponibles.",
  gastosRespuesta: "Preparamos una estimación por concepto, según tu operación. Los impuestos, honorarios y demás importes se confirman con la notaría o el especialista correspondiente.",
  inicioRespuesta: "La ubicación, el tipo de propiedad y un medio para contactarte. Después te indicamos qué documentos necesitamos para revisar el caso.",
  evaluarTitulo: "Cuéntanos sobre\ntu propiedad.",
  evaluarTexto: "Para empezar, necesitamos saber dónde está, qué tipo de inmueble es y cómo contactarte. Te indicamos qué hace falta para una primera revisión.",
};

const PREVIOUS_NOTES: Partial<Record<HomeTextKey, string>> = {
  metodoTitulo: "Nuestro método.\nSeis etapas para coordinar tu venta.",
  metodoTexto: "El contrato establece las tareas incluidas y los honorarios.",
  captacionTexto: "Revisamos los documentos y los datos del inmueble para identificar pendientes. Acordamos contigo el precio de salida y las condiciones del servicio.",
  preparacionTexto: "Acordamos las mejoras que conviene valorar y organizamos la fotografía y el video. Reunimos las características del inmueble y elegimos los canales donde se publicará.",
  comercializacionTexto: "Revisamos las necesidades de los interesados antes de coordinar visitas. Recibes un reporte cada 30 días. Cuando recibimos una oferta por escrito, analizamos contigo el precio, la forma de pago y las condiciones.",
  cierreTexto: "Damos seguimiento a los documentos y requisitos con la notaría y las partes. Estimamos los gastos de cierre y documentamos la entrega de posesión.",
  tiempoRespuesta: "El plazo depende del precio, la zona, el estado del inmueble y la demanda. No se puede asegurar una fecha de venta.",
  gastosRespuesta: "Preparamos una estimación de impuestos, honorarios y otros gastos de tu operación. La notaría o el especialista correspondiente confirma los importes.",
};

const OLDER_CLOSURE_NOTE = "Damos seguimiento a los documentos y requisitos con la notaría y las partes. Estimamos los gastos de cierre y documentamos la entrega de posesión. Los importes se confirman con quien corresponda.";

/** Last shipped defaults, not a migration: custom persisted values still win. */
const PREVIOUS_EDITORIAL_TEXTS: Partial<Record<HomeTextKey, string>> = {
  relatoTexto: "Antes de publicar, revisamos los documentos de la propiedad.",
  relatoApoyo: "Identificamos documentos faltantes y datos que deben confirmarse. Si hay pendientes que afectan la venta, los señalamos antes de ofrecer el inmueble.",
  metodoTitulo: "Qué hacemos\npara vender tu propiedad.",
  entregablesTitulo: "Documentos\nque te entregamos.",
  entregablesTexto: "El contrato define los documentos incluidos en tu servicio.",
  gastosTexto: "Impuestos, comisión y otros gastos estimados para calcular cuánto podrías recibir de la venta.",
  preguntasTitulo: "Preguntas\nsobre la venta.",
  tiempoRespuesta: "El plazo depende del precio, la zona, el estado del inmueble y la demanda.",
  precioRespuesta: "La opinión de valor compara tu propiedad con inmuebles similares. El precio al que se publicará se acuerda contigo.",
  gastosRespuesta: "Preparamos una estimación de impuestos, honorarios y otros gastos de tu operación.",
  inicioRespuesta: "La ubicación, el tipo de inmueble y un teléfono para contactarte. Con esos datos podemos indicarte los documentos necesarios.",
};

/* Retired by the titular on 30/10/2026: it promised one adviser for the whole sale, which is not always true. */
const RETIRED_METHOD_TITLE = "Seis etapas.\nUn responsable.";

export function homeText(content: Pick<SiteContent, "homeTexts"> | null | undefined, key: HomeTextKey): string {
  const value = content?.homeTexts?.[key]?.trim();
  const isOldDefault = value === PREVIOUS_HOME_TEXTS[key] || value === PREVIOUS_NOTES[key] || value === PREVIOUS_EDITORIAL_TEXTS[key]
    || (key === "cierreTexto" && value === OLDER_CLOSURE_NOTE)
    || (key === "metodoTitulo" && value === RETIRED_METHOD_TITLE);
  return brandCopy(value && !isOldDefault ? value : HOME_FIELDS[key].value);
}

export const SITE_COPY: Omit<SiteContent, "homeTexts"> = {
  heroTitulo: "Tu propiedad merece\nuna estrategia,\nno solo un anuncio.",
  heroSubtitulo: "Somos una inmobiliaria en Baja California. Comercializamos inmuebles residenciales, comerciales e industriales con análisis de mercado, revisión documental y seguimiento de la operación.",
  manifiestoTitulo: "Información para decidir.\nUn asesor para coordinar.",
  manifiestoTexto: "Conoce qué información sustenta la propuesta y qué falta por confirmar.",
  seoTitle: "Fortius Inmuebles | Venta en Tijuana, Rosarito, Tecate y Ensenada",
  seoDescription: "Venta de propiedades en Tijuana, Rosarito, Tecate y Ensenada. Revisión documental, precio de salida, publicación, visitas y análisis de ofertas con Fortius Inmuebles.",
};

const LEGACY: Partial<Record<keyof typeof SITE_COPY, string[]>> = {
  seoDescription: ["Firma inmobiliaria en Tijuana y Baja California. Precio con datos, expediente revisado y seguimiento por escrito, de la captación a la firma ante notario.", "Venta de propiedades en Tijuana. Revisión documental, opinión de valor, publicación, visitas y revisión de ofertas con MNT Inmuebles.", "Vende tu propiedad en Tijuana con MNT Inmuebles. Análisis de mercado, revisión documental y seguimiento por escrito para acompañar cada etapa de la venta."],
  heroTitulo: ["Inmobiliaria para\ncomprar y vender.", "Vende tu propiedad.", "Vende tu propiedad\nen Tijuana.", "Tu propiedad en Tijuana.\nUn plan para venderla.", "Vende con plan, no con anuncios."],
  heroSubtitulo: ["En Fortius te ayudamos a comparar propiedades, coordinar visitas y negociar las condiciones de tu compra o venta. Tu asesor reúne la información y da seguimiento a la operación para que puedas decidir.", "Trabajamos en Tijuana, Rosarito, Tecate y Ensenada. Revisamos los documentos, proponemos el precio de venta y coordinamos la publicación y las visitas. Analizamos contigo las ofertas.", "Proponemos el precio de venta, revisamos los documentos y coordinamos la publicación y las visitas. Analizamos contigo las ofertas.", "Revisamos la documentación, analizamos el mercado y acordamos contigo cómo presentar la propiedad. Durante la venta, recibes seguimiento por escrito y acompañamiento para evaluar las ofertas.", "Precio con datos, expediente revisado y seguimiento por escrito. De la captación a la firma ante notario, en Tijuana y Baja California."],
  manifiestoTitulo: ["Cómo proponemos\nel precio de venta.", "Cada decisión,\ncon información.", "No prometemos resultados. Documentamos el proceso.", "No nos limitamos a tomar fotos. Creamos un proceso."],
  manifiestoTexto: ["Comparamos ubicación, superficie y estado con propiedades similares. Te explicamos las referencias utilizadas y distinguimos precios anunciados de ventas documentadas cuando hay datos disponibles.", "Conoce el precio propuesto, los documentos pendientes y los siguientes pasos. El plan se acuerda contigo y el avance queda por escrito.", "Cada operación sigue el mismo método por escrito, de la captación a la firma. Por eso siempre sabes en qué paso va la tuya, y qué sigue después."],
  seoTitle: ["MNT Inmuebles | Venta de propiedades en Tijuana", "MNT Inmuebles | Metodología Inmobiliaria", "MNT Inmuebles | Vende tu propiedad en Tijuana con método"],
};

/** Exact legacy matches only: bespoke staff edits always win, including after rollout. */
export function resolveSiteContent(content?: SiteContent | null): SiteContent {
  const result = { ...SITE_COPY, ...content };
  for (const key of Object.keys(SITE_COPY) as (keyof typeof SITE_COPY)[]) {
    if (!result[key]?.trim() || LEGACY[key]?.includes(result[key].trim())) result[key] = SITE_COPY[key];
    result[key] = brandCopy(result[key]);
  }
  return result;
}
