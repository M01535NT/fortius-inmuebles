import { brandCopy } from "@/lib/brand-copy";
import type { SiteContent } from "@/lib/admin/store";

/** Shared editorial defaults; the panel owns any explicitly edited value. */
export const HOME_FIELDS = {
  relatoTexto: { group: "Lo que recibes", label: "Lo que falta, a tiempo", value: "Qué falta, antes de anunciar." },
  relatoApoyo: { group: "Lo que recibes", label: "Dónde se publica", value: "Canales y fechas, acordados contigo." },
  metodoTitulo: { group: "Método", label: "Título", value: "Cinco etapas, y lo que recibes en cada una." },
  metodoTexto: { group: "Método", label: "Introducción", value: "Cada paso queda en un documento que puedes revisar." },
  captacionTexto: { group: "Método", label: "Conocemos tu caso", value: "Platicamos qué buscas, quién puede firmar y qué papeles tienes." },
  diagnosticoTexto: { group: "Método", label: "Revisamos papeles y precio", value: "Medimos la propiedad, revisamos escritura y adeudos y la comparamos con otras parecidas. Tú decides el precio." },
  comercializacionTexto: { group: "Método", label: "La publicamos", value: "Fotos, ficha y anuncios en los canales acordados. Te decimos qué pasó con cada consulta." },
  ofertasTexto: { group: "Método", label: "Visitas y ofertas", value: "Acompañamos cada visita. Las ofertas llegan por escrito y tú decides si aceptas, contraofertas o no." },
  cierreTexto: { group: "Método", label: "Firma y entrega", value: "Firmamos la promesa, coordinamos la notaría y el pago y entregamos la propiedad con acta." },
  entregablesTitulo: { group: "Entregables", label: "Título", value: "Documentos\ny seguimiento." },
  entregablesTexto: { group: "Entregables", label: "Introducción", value: "Cada etapa deja un documento." },
  factibilidadTexto: { group: "Entregables", label: "Opinión jurídica", value: "Qué se revisó y qué falta." },
  valorTexto: { group: "Entregables", label: "Opinión de valor", value: "Precio propuesto y comparables." },
  planTexto: { group: "Entregables", label: "Plan de comercialización", value: "Dónde y cuándo se publica." },
  gastosTexto: { group: "Entregables", label: "Estimación de lo que recibes", value: "Cuánto recibes al final, estimado." },
  contratoTexto: { group: "Entregables", label: "Contrato de intermediación", value: "Alcance y honorarios." },
  reportesTexto: { group: "Entregables", label: "Reporte de comercialización", value: "Consultas, visitas y ofertas." },
  preguntasTitulo: { group: "Preguntas frecuentes", label: "Título", value: "Lo que más\nnos preguntan." },
  tiempoRespuesta: { group: "Preguntas frecuentes", label: "Plazo de venta", value: "Depende del precio, la zona, el estado y la demanda." },
  precioRespuesta: { group: "Preguntas frecuentes", label: "Precio de salida", value: "Comparamos con inmuebles similares. El precio lo acuerdas tú." },
  gastosRespuesta: { group: "Preguntas frecuentes", label: "Gastos de cierre", value: "Te damos una estimación por concepto. La calculadora sirve de referencia." },
  inicioRespuesta: { group: "Preguntas frecuentes", label: "Cómo empezar", value: "Ubicación, tipo de inmueble y un teléfono." },
  evaluarTitulo: { group: "Contacto", label: "Título", value: "¿Quieres vender\ntu propiedad?" },
  evaluarTexto: { group: "Contacto", label: "Introducción", value: "Dinos dónde está y qué tipo de inmueble es." },
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
  comercializacionTexto: "Revisamos las necesidades de los interesados y coordinamos las visitas. Recibes un reporte cada 30 días; cuando llega una oferta, analizamos contigo el precio, la forma de pago y las condiciones.",
  cierreTexto: "Damos seguimiento a los documentos y requisitos con la notaría y las partes. Los gastos se presentan como estimaciones hasta que los confirme quien corresponda.",
  ofertasTexto: "",
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

/* Defaults shipped with the six-stage home (boceto 2, 29/10/2026); replaced by the four-stage copy on 30/10/2026. */
const PREVIOUS_SIX_STAGE_TEXTS: Partial<Record<HomeTextKey, string>> = {
  relatoTexto: "Revisamos la documentación disponible antes de ofrecer el inmueble.",
  relatoApoyo: "Definimos contigo los canales y las acciones para presentar tu propiedad.",
  metodoTitulo: "Así vendemos tu propiedad.",
  metodoTexto: "Desde la primera revisión hasta la entrega, te explicamos qué sigue y qué necesitamos de ti.",
  captacionTexto: "Conocemos tu objetivo y la propiedad. Identificamos quién puede autorizar la venta y qué documentos necesitamos para revisarla.",
  diagnosticoTexto: "Revisamos documentos, características y pendientes. Comparamos inmuebles similares para proponerte un rango y acordar contigo el precio de salida.",
  comercializacionTexto: "Publicamos la propiedad en los canales acordados y comprobamos que los anuncios muestren datos y disponibilidad vigentes. Te informamos de las consultas y del avance de la campaña.",
  cierreTexto: "Coordinamos la firma con las partes y la notaría. Verificamos los pagos, documentamos la entrega de llaves e inventario y damos seguimiento a los trámites pendientes.",
  entregablesTexto: "El contrato establece qué documentos preparamos y entregamos durante tu operación.",
  factibilidadTexto: "Documentos pendientes y aspectos que deben revisarse antes de ofrecer el inmueble.",
  valorTexto: "Precio propuesto, propiedades comparadas, fuentes y límites de la información disponible.",
  planTexto: "Dónde se publicará el inmueble, qué acciones se realizarán y en qué fechas.",
  gastosTexto: "Impuestos, comisión y otros gastos estimados para calcular cuánto podrías recibir. Los importes se confirman para cada operación.",
  contratoTexto: "Servicio contratado, honorarios y obligaciones del propietario y de Fortius.",
  reportesTexto: "Consultas, visitas y ofertas recibidas, con las acciones realizadas en el periodo.",
  preguntasTitulo: "Preguntas\nantes de avanzar.",
};

/* Defaults before the word cut of 30/10/2026 (shorter copy across the site). */
const PREVIOUS_LONG_TEXTS: Partial<Record<HomeTextKey, string>> = {
  relatoTexto: "Qué se revisó y qué falta por resolver, antes de anunciar.",
  relatoApoyo: "Los canales y las fechas de publicación, acordados contigo.",
  metodoTexto: "Desde la primera revisión hasta la entrega, te decimos qué sigue y qué necesitamos de ti.",
  captacionTexto: "Quién puede vender, escritura, adeudos y medidas. Lo que falte, lo resolvemos antes de anunciar.",
  diagnosticoTexto: "Comparamos propiedades parecidas y te proponemos un rango. Tú decides el precio de salida.",
  comercializacionTexto: "Fotos, ficha y anuncios en los canales acordados. Coordinamos las visitas y te informamos de cada consulta.",
  cierreTexto: "Revisamos cada oferta, coordinamos la notaría y documentamos la entrega.",
  entregablesTexto: "Cada etapa deja un documento. Así sabes en qué va tu venta sin tener que preguntar.",
  factibilidadTexto: "Qué se revisó y qué falta por resolver.",
  valorTexto: "Precio propuesto y propiedades comparadas.",
  gastosTexto: "Cuánto recibes al final, con impuestos y gastos estimados.",
  contratoTexto: "Alcance y honorarios por escrito.",
  reportesTexto: "Consultas, visitas y ofertas del periodo.",
  tiempoRespuesta: "Depende del precio, la ubicación, el estado del inmueble y la demanda. Revisamos las consultas y ofertas para valorar los siguientes pasos.",
  precioRespuesta: "Comparamos la propiedad con inmuebles similares y explicamos las referencias disponibles. El precio de publicación se acuerda contigo.",
  gastosRespuesta: "Preparamos una estimación de impuestos, honorarios y otros gastos según la operación. Puedes consultar la calculadora como referencia inicial.",
  inicioRespuesta: "La ubicación, el tipo de inmueble y un medio de contacto. Con esa información te indicamos qué documentos necesitamos revisar.",
  evaluarTexto: "Dinos la ubicación y el tipo de inmueble. Te contactamos para pedir los documentos necesarios para revisarlo.",
};

/* Defaults of the four-stage method (30/10/2026), replaced by the five real stages on 31/10/2026. */
const PREVIOUS_FOUR_STAGE_TEXTS: Partial<Record<HomeTextKey, string>> = {
  metodoTitulo: "Cuatro etapas, cada una con su documento.",
  metodoTexto: "Te decimos qué sigue y qué necesitamos de ti.",
  captacionTexto: "Quién vende, escritura, adeudos y medidas.",
  diagnosticoTexto: "Comparamos propiedades parecidas. Tú decides el precio.",
  comercializacionTexto: "Fotos, anuncios y visitas. Te avisamos de cada consulta.",
  cierreTexto: "Revisamos ofertas, notaría y entrega.",
};

export function homeText(content: Pick<SiteContent, "homeTexts"> | null | undefined, key: HomeTextKey): string {
  const value = content?.homeTexts?.[key]?.trim();
  const isOldDefault = value === PREVIOUS_HOME_TEXTS[key] || value === PREVIOUS_NOTES[key] || value === PREVIOUS_EDITORIAL_TEXTS[key]
    || value === PREVIOUS_SIX_STAGE_TEXTS[key] || value === PREVIOUS_LONG_TEXTS[key] || value === PREVIOUS_FOUR_STAGE_TEXTS[key]
    || (key === "cierreTexto" && value === OLDER_CLOSURE_NOTE)
    || (key === "metodoTitulo" && value === RETIRED_METHOD_TITLE);
  return brandCopy(value && !isOldDefault ? value : HOME_FIELDS[key].value);
}

export const SITE_COPY: Omit<SiteContent, "homeTexts" | "preguntas" | "testimonios"> = {
  heroTitulo: "Tu propiedad merece\nuna estrategia,\nno solo un anuncio.",
  heroSubtitulo: "Somos una inmobiliaria en Baja California. Comercializamos inmuebles residenciales, comerciales e industriales con análisis de mercado, revisión documental y seguimiento de la operación.",
  manifiestoTitulo: "Información para decidir.\nUn asesor para coordinar.",
  manifiestoTexto: "Por qué ese precio y con qué se comparó.",
  seoTitle: "Inmobiliaria en Tijuana, Rosarito, Tecate y Ensenada",
  seoDescription: "Te ayudamos a vender o comprar casa en Tijuana, Rosarito, Tecate y Ensenada, con documentos revisados, precio con datos y cada paso por escrito. Escríbenos.",
};

const LEGACY: Partial<Record<keyof typeof SITE_COPY, string[]>> = {
  seoDescription: ["Venta de propiedades en Tijuana, Rosarito, Tecate y Ensenada. Revisión documental, precio de salida, publicación, visitas y análisis de ofertas con Fortius Inmuebles.", "Firma inmobiliaria en Tijuana y Baja California. Precio con datos, expediente revisado y seguimiento por escrito, de la captación a la firma ante notario.", "Venta de propiedades en Tijuana. Revisión documental, opinión de valor, publicación, visitas y revisión de ofertas con MNT Inmuebles.", "Vende tu propiedad en Tijuana con MNT Inmuebles. Análisis de mercado, revisión documental y seguimiento por escrito para acompañar cada etapa de la venta."],
  heroTitulo: ["Inmobiliaria para\ncomprar y vender.", "Vende tu propiedad.", "Vende tu propiedad\nen Tijuana.", "Tu propiedad en Tijuana.\nUn plan para venderla.", "Vende con plan, no con anuncios."],
  heroSubtitulo: ["En Fortius te ayudamos a comparar propiedades, coordinar visitas y negociar las condiciones de tu compra o venta. Tu asesor reúne la información y da seguimiento a la operación para que puedas decidir.", "Trabajamos en Tijuana, Rosarito, Tecate y Ensenada. Revisamos los documentos, proponemos el precio de venta y coordinamos la publicación y las visitas. Analizamos contigo las ofertas.", "Proponemos el precio de venta, revisamos los documentos y coordinamos la publicación y las visitas. Analizamos contigo las ofertas.", "Revisamos la documentación, analizamos el mercado y acordamos contigo cómo presentar la propiedad. Durante la venta, recibes seguimiento por escrito y acompañamiento para evaluar las ofertas.", "Precio con datos, expediente revisado y seguimiento por escrito. De la captación a la firma ante notario, en Tijuana y Baja California."],
  manifiestoTitulo: ["Cómo proponemos\nel precio de venta.", "Cada decisión,\ncon información.", "No prometemos resultados. Documentamos el proceso.", "No nos limitamos a tomar fotos. Creamos un proceso."],
  manifiestoTexto: ["Por qué ese precio y con qué propiedades se comparó.", "Conoce qué información sustenta la propuesta y qué falta por confirmar.", "Comparamos ubicación, superficie y estado con propiedades similares. Te explicamos las referencias utilizadas y distinguimos precios anunciados de ventas documentadas cuando hay datos disponibles.", "Conoce el precio propuesto, los documentos pendientes y los siguientes pasos. El plan se acuerda contigo y el avance queda por escrito.", "Cada operación sigue el mismo método por escrito, de la captación a la firma. Por eso siempre sabes en qué paso va la tuya, y qué sigue después."],
  seoTitle: ["Fortius Inmuebles | Venta en Tijuana, Rosarito, Tecate y Ensenada", "MNT Inmuebles | Venta de propiedades en Tijuana", "MNT Inmuebles | Metodología Inmobiliaria", "MNT Inmuebles | Vende tu propiedad en Tijuana con método"],
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
