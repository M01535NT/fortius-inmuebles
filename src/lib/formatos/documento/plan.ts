import { CANALES, DECISIONES, MATERIALES, PREPARACION, calcularPrecioTecnico, planFields } from "../plan";
import { a, dinero, fecha, filas, type Block, type Documento, type FormCell, type Marca } from "./modelo";

/*
  10 · Plan de comercialización con la plantilla del titular del 26/10/2026
  (04_Metodologia/02_Comercializacion/10_PlanComercializacion.docx), aprobada el 29/10/2026.
  Mismos textos fijos y el mismo orden; las casillas se dibujan y cada espacio dice qué campo
  lo llena («keys») para la captura sobre el documento. El título va en el membrete.
  Si falta un dato, su espacio queda en blanco para completarlo a mano.
*/

type Data = Record<string, unknown>;
const opciones = (key: string) => planFields.find(field => field.key === key)?.options ?? [];
const c = (q: string, answer: string, w: number, keys?: string[]): FormCell => ({ q, a: answer, w, ...(keys ? { keys } : {}) });
const marcado = (value: unknown, option: string) => Array.isArray(value) ? value.includes(option) : value === option;
/** Casillas de la plantilla, en renglones de «porLinea» opciones; la elegida lleva su X. */
const marcas = (q: string, key: string, d: Data, w: number, porLinea = 8, extra: Marca[] = []): FormCell => {
  const items = opciones(key).map((o): Marca => ({ text: o.label, check: marcado(d[key], o.value) }));
  const lines: Marca[][] = [];
  for (let i = 0; i < items.length; i += porLinea) lines.push(items.slice(i, i + porLinea));
  if (extra.length) lines[lines.length - 1].push(...extra);
  return { q, a: "", w, keys: [key], marks: lines };
};
const f = (value: unknown) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? fecha(value) : a(value);
const mxn = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? dinero(value) : "";
const num = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? String(value) : a(value);
const fila = (table: unknown, concepto: string) => filas(table).find(row => row.concepto === concepto) ?? {};

const PERFIL: Array<[string, string]> = [["Quién es (edad aproximada y composición)", "Quien"], ["Capacidad y forma de pago previsible", "Pago"], ["Característica del inmueble a destacar", "Destacar"], ["Objeciones probables y cómo se atenderán", "Objeciones"], ["Mensaje principal del anuncio", "Mensaje"]];
const ENFASIS = [
  ["Familia joven", "Redes sociales, portales y referidos de vecinos", "Escuelas cercanas, seguridad, tamaño y espacios para crecer"],
  ["Persona sola o pareja profesionista", "Redes sociales, portales y contacto directo", "Ubicación, conectividad, diseño y amenidades"],
  ["Inversionista", "Referidos, contacto directo y portales", "Rentabilidad y demanda de la zona, solo con cifras respaldadas"],
  ["Adulto mayor o jubilado", "Referidos familiares, Facebook y recorrido de la zona", "Tranquilidad, seguridad, accesibilidad y servicios médicos cercanos"],
];
const AIDA = [
  ["Atención", "Aún no sabe que el inmueble existe", "Anuncio claro, fotografía principal de calidad, título con el beneficio principal y precio visible", "Publicar en los canales acordados con fotografías cuidadas y datos comprobables. Revisar consultas nuevas y, si la plataforma lo informa, visualizaciones."],
  ["Interés", "Vio el anuncio y quiere saber más", "Descripción detallada, plano, recorrido o video, ubicación y servicios cercanos", "Enviar la ficha y los materiales disponibles. Responder dentro del plazo acordado y confirmar necesidad, presupuesto, plazo y forma de pago."],
  ["Deseo", "Le gusta y empieza a imaginarse en el inmueble", "Visita ordenada, con el inmueble limpio e iluminado, y respuestas honestas", "Coordinar visitas con recorrido preparado, explicar ventajas y limitaciones con información comprobable y registrar objeciones. No se crea presión artificial ni se inventan interesados."],
  ["Acción", "Está listo para hacer una oferta", "Condiciones claras, proceso sencillo y confianza en quien lo acompaña", "Facilitar una oferta escrita con precio, forma de pago, condiciones y vigencia, y turnarla al propietario en el plazo pactado."],
];
const PERIODOS: Array<[string, string, string, string]> = [
  ["Días 1 a 7", "corte7", "Publicar los materiales aprobados, verificar anuncios, avisar a la red de referidos autorizada y responder cada consulta. Registrar contactos y visitas.", "Que la difusión funcione; corregir información, imágenes o datos de contacto."],
  ["Días 8 a 14", "corte14", "Dar seguimiento a los interesados, realizar visitas, recoger objeciones y revisar las métricas disponibles de cada canal.", "Mejoras de presentación, mensaje o atención según las respuestas."],
  ["Días 15 a 21", "corte21", "Retomar a los interesados, resolver dudas y facilitar ofertas escritas. Revisar los resultados de todas las etapas.", "Mantener el plan o proponer cambios sustentados de contenido, canales, acceso o precio."],
];
const REVISIONES = [
  ["Día 22 a 30", "Hay visitas, pero ninguna oferta", "Revisar presentación, fotografías, descripción y precio frente a la opinión de valor. Acordar si se mantiene o se ajusta el plan."],
  ["Día 31 a 60", "No hay ofertas concretas", "Renovar materiales y descripción, relanzar en los canales y evaluar con el propietario un ajuste de precio sustentado en datos."],
  ["Día 61 a 90", "Más de dos meses publicado", "Reunión con el propietario para revisar estrategia, precio y, si conviene, pausar y relanzar con una propuesta renovada."],
];
const INDICADORES = [
  ["Contactos y visitas", "Interesados únicos; se separan consultas, visitas agendadas y visitas realizadas, con el canal de origen."],
  ["Ofertas y objeciones", "Ofertas identificables sin duplicar revisiones y motivos por los que un interesado no avanza, con la siguiente acción."],
  ["Respuesta por canal", "Alcance o clics solo cuando la plataforma los informa. No se suman audiencias como si fueran personas únicas."],
  ["Tiempo y avance", "Días desde el lanzamiento y, si hay datos, relación entre ofertas y visitas realizadas."],
  ["Publicidad pagada", "Solo si fue contratada: presupuesto autorizado, gasto comprobado y saldo."],
];
const RESPONSABILIDADES = [
  ["Prepara los contenidos y las fichas del inmueble", "Facilita el acceso al inmueble y a la documentación"],
  ["Publica y mantiene actualizados los anuncios", "Informa de inmediato cualquier cambio en la disponibilidad o condiciones"],
  ["Atiende interesados, agenda y acompaña las visitas", "Atiende los trabajos de preparación acordados"],
  ["Presenta las ofertas por escrito y reporta los resultados", "Decide sobre ofertas, precio y gastos adicionales"],
];

export function planDocumento(d: Data): Documento {
  const calc = calcularPrecioTecnico(d);
  const comparables = filas(d.comparables), extras = filas(d.extras);
  const banos = [num(d.banos), num(d.mediosBanos)].some(Boolean) ? `${num(d.banos) || "—"} / ${num(d.mediosBanos) || "—"}` : "";
  const blocks: Block[] = [
    { kind: "form", label: "Datos del encargo", rows: [
      // El folio lo asigna el sistema.
      [c("Inmueble", a(d.inmueble), 4, ["inmueble"]), c("Folio", a(d.folio), 2)],
      [c("Propietario", a(d.propietario), 3, ["propietario"]), c("Folio real", a(d.folioReal), 3, ["folioReal"])],
      [c("Contrato de intermediación (folio y fecha)", a(d.contrato09), 3, ["contrato09"]), c("Asesor responsable", a(d.asesor), 3, ["asesor"])],
      [c("Fecha de elaboración", f(d.fecha), 2, ["fecha"]), marcas("Operación", "operacion", d, 2), c("Vigencia del plan", "90 días, con revisión cada 30 días", 2)],
    ] },
    { kind: "note", text: "Este plan define cómo Fortius presentará, promoverá y dará seguimiento a la comercialización del inmueble. No garantiza comprador, precio ni fecha de cierre y no modifica el contrato de intermediación." },

    { kind: "form", label: "1  El inmueble  ·  Datos físicos y legales", rows: [
      [marcas("Tipo de inmueble", "tipoInmueble", d, 6, 4)],
      [c("Clave catastral", a(d.claveCatastral), 2, ["claveCatastral"]), c("Terreno (m²)", num(d.terreno), 1, ["terreno"]), c("Construcción (m²)", num(d.construccion), 1, ["construccion"]), c("Año de construcción", a(d.anioConstruccion), 2, ["anioConstruccion"])],
      [c("Recámaras", num(d.recamaras), 2, ["recamaras"]), c("Baños (completos / medios)", banos, 2, ["banos", "mediosBanos"]), c("Estacionamientos", num(d.estacionamientos), 2, ["estacionamientos"])],
      [marcas("Situación legal", "situacionLegal", d, 3), { ...marcas("Gravámenes o hipotecas", "gravamen", d, 3, 8, [{ text: `Monto: ${mxn(d.montoGravamen) || "$"}` }]), keys: ["gravamen", "montoGravamen"] }],
      [marcas("Régimen de propiedad", "regimen", d, 3), c("Cuota de mantenimiento", mxn(d.cuotaMantenimiento) || "$", 3, ["cuotaMantenimiento"])],
      [marcas("Servicios y entorno cercano", "servicios", d, 6, 3)],
    ] },

    { kind: "form", label: "2  Precio de salida", rows: [] },
    { kind: "p", text: "El precio de salida se fija con datos del mercado y con la opinión de valor, no con expectativas. Un precio acorde con el mercado atrae ofertas desde las primeras semanas; uno superior suele reducir las visitas y alargar la venta. El propietario decide el precio final y puede modificarlo por escrito." },
    { kind: "label", text: "Inmuebles comparables" },
    { kind: "note", text: "Se reúnen de tres a cinco inmuebles del mismo tipo y operación, en la misma zona, publicados o vendidos en los últimos seis meses y con una diferencia de precio máxima de 20 %. Cada uno indica su fuente, su fecha y si es precio de oferta o de cierre." },
    { kind: "grid", zona: { keys: ["comparables"], label: "Inmuebles comparables" }, widths: [2.6, 0.9, 0.9, 0.6, 0.7, 1.5, 1.8], header: ["Dirección o referencia", "m² terreno", "m² const.", "Rec.", "Baños", "Precio", "Fuente y fecha"], minRow: 18,
      rows: Array.from({ length: Math.max(4, comparables.length) }, (_, i) => { const r = comparables[i] ?? {}; return [a(r.direccion), num(r.terreno), num(r.construccion), num(r.recamaras), num(r.banos), mxn(r.precio) || "$", a(r.fuente)]; }) },
    { kind: "form", label: "Cálculo y autorización", rows: [
      // Los calcula el panel con los comparables y la construcción del inmueble.
      [c("Precio promedio de los comparables por m² construido", mxn(calc.promedio) || "$", 3, ["comparables"]), c("Precio técnico (promedio por m² por superficie construida)", mxn(calc.tecnico) || "$", 3, ["comparables", "construccion"])],
      [marcas("Ajustes considerados", "ajustes", d, 6, 6)],
      [c("Valor de referencia de la opinión de valor", mxn(d.valorReferencia07) || "$", 2, ["valorReferencia07"]), c("Precio de salida recomendado por Fortius", mxn(d.precioRecomendado) || "$", 2, ["precioRecomendado"]), c("Precio de salida autorizado por el propietario", mxn(d.precioSalida) || "$", 2, ["precioSalida"])],
      [c("Margen de negociación acordado y motivo", a(d.margen), 6, ["margen"])],
    ] },
    { kind: "note", text: "El precio se publica completo y con su moneda. El margen de negociación se acuerda por escrito y se explica con datos. El neto estimado para el propietario se presenta por separado, con los costos de la operación." },

    { kind: "pagebreak" },
    { kind: "form", label: "3  A quién se dirigirá la comercialización", rows: [] },
    { kind: "p", text: "Definir al comprador más probable permite elegir canales y mensaje. Se identifica un perfil principal, que recibe la mayor parte del esfuerzo, y uno secundario. Lo que no se ha comprobado se anota como supuesto y se ajusta con las consultas y visitas reales." },
    { kind: "grid", widths: [2.4, 3, 3], header: ["Aspecto", "Perfil principal", "Perfil secundario"], labels: true, minRow: 20,
      rows: PERFIL.map(([label, key]) => [label, a(d[`perfil1${key}`]), a(d[`perfil2${key}`])]),
      keys: PERFIL.map(([, key]) => [undefined, [`perfil1${key}`], [`perfil2${key}`]]) },
    { kind: "form", rows: [[marcas("Motivo de compra · perfil principal", "perfil1Motivo", d, 3, 4), marcas("Motivo de compra · perfil secundario", "perfil2Motivo", d, 3, 4)]] },
    { kind: "label", text: "Referencia de canales y énfasis por tipo de comprador" },
    { kind: "grid", widths: [2.2, 3, 3.4], header: ["Si el comprador es", "Canales que se priorizan", "El mensaje debe enfatizar"], labels: true, rows: ENFASIS },

    { kind: "form", label: "4  Del anuncio a la oferta", rows: [] },
    { kind: "p", text: "Todo comprador pasa por cuatro etapas antes de ofertar. Fortius define una acción para cada una con el modelo AIDA (Atención, Interés, Deseo y Acción); un interesado puede volver a una etapa anterior si necesita más información." },
    { kind: "grid", widths: [1.2, 2.2, 2.8, 3.8], header: ["Etapa", "Estado del comprador", "Qué necesita ver o saber", "Qué hará Fortius"], labels: true, rows: AIDA },
    { kind: "form", label: "Atención de consultas y visitas", rows: [
      [c("Las consultas se responden por", a(d.mediosConsulta), 2, ["mediosConsulta"]), c("Plazo de respuesta", a(d.plazoRespuesta), 2, ["plazoRespuesta"]), c("Las visitas se realizan en (días y horarios)", a(d.horariosVisita), 2, ["horariosVisita"])],
    ] },
    { kind: "note", text: "Las ofertas se presentan por escrito y solo el propietario decide si las acepta; este plan no faculta al asesor para aceptarlas ni recibir apartados. Fortius solicita identificación y verifica la forma de pago conforme a la normativa aplicable. La viabilidad de un crédito se confirma desde las primeras conversaciones." },

    { kind: "form", label: "5  Preparación y materiales", rows: [] },
    { kind: "p", text: "El mayor efecto proviene del orden, la limpieza y la luz. Los trabajos previos se acuerdan con el propietario y la edición de fotografías nunca oculta daños ni condiciones relevantes." },
    { kind: "form", rows: [[{ q: "Antes de la sesión fotográfica", a: "", w: 6, keys: ["preparacion"], marks: PREPARACION.reduce<Marca[][]>((lines, item, i) => { if (i % 2 === 0) lines.push([]); lines[lines.length - 1].push({ text: item, check: marcado(d.preparacion, item) }); return lines; }, []) }]] },
    { kind: "label", text: "Materiales de difusión" },
    { kind: "grid", widths: [3, 1.4, 2.4, 1.6, 1.4], header: ["Material", "Incluye o no aplica", "Alcance", "Responsable", "Fecha"], labels: true, minRow: 18,
      rows: MATERIALES.map(([key, label]) => { const r = fila(d.materiales, key); return [label, a(r.incluye), a(r.alcance), a(r.responsable), f(r.fecha)]; }),
      keys: MATERIALES.map(() => [undefined, ["materiales"], ["materiales"], ["materiales"], ["materiales"]]) },
    { kind: "note", text: "Los videos, recorridos, dron y otros recursos se incorporan solo si su alcance y costo están acordados. El propietario o quien designe aprueba los contenidos antes de publicarlos." },
    { kind: "label", text: "Reglas para redactar el anuncio" },
    { kind: "p", text: "• El título combina la característica principal, el beneficio y la ubicación autorizada.\n• La descripción abre con el beneficio principal y cierra con una invitación clara a contactar.\n• Todo dato es comprobable. No se inventan interesados, urgencia ni rendimientos." },

    { kind: "form", label: "6  Dónde se publicará", rows: [] },
    { kind: "p", text: "Los canales se eligen por su relación con el perfil de comprador y se revisa la respuesta de cada uno. Una propuesta de difusión no autoriza por sí misma una publicación, una visita abierta, un gasto ni la entrega de datos personales." },
    { kind: "grid", widths: [2.2, 3.8, 2.2, 1.2], header: ["Canal", "Acciones", "Frecuencia", "Autorizado"], labels: true,
      rows: CANALES.map(([key, label, acciones, frecuencia]) => [label, acciones, frecuencia, a(fila(d.canales, key).autorizado)]),
      keys: CANALES.map(() => [undefined, undefined, undefined, ["canales"]]) },
    { kind: "form", rows: [[c("Contacto público que aparecerá en el anuncio", a(d.contactoPublico), 3, ["contactoPublico"]), c("Ubicación que puede difundirse", a(d.ubicacionPublicable), 3, ["ubicacionPublicable"])]] },
    { kind: "label", text: "Publicidad pagada (opcional)" },
    { kind: "note", text: "La difusión ordinaria contempla publicaciones gratuitas en portales cuando estén disponibles. La publicidad pagada no está incluida y corre por cuenta del propietario. Antes de contratarla se acuerda por escrito el canal, el periodo, el importe máximo con impuestos y la forma de pago. Si no se contrata, el importe autorizado es 0." },
    { kind: "grid", zona: { keys: ["extras"], label: "Publicidad pagada" }, widths: [3.4, 1.6, 2, 2.4], header: ["Concepto y periodo", "Total MXN", "A cargo de", "Autorización"], minRow: 18,
      rows: Array.from({ length: Math.max(2, extras.length) }, (_, i) => { const r = extras[i] ?? {}; return [a(r.concepto), mxn(r.importe) || "$", a(r.pagador), a(r.autorizacion)]; }) },

    { kind: "form", label: "7  Calendario y revisiones", rows: [] },
    { kind: "p", text: "El inmueble recibe la mayor parte de la atención, las visitas y las ofertas al inicio de su presencia en el mercado. Por eso el trabajo se concentra en las primeras tres semanas y se revisa con el propietario en tres cortes." },
    { kind: "form", rows: [[c("Fecha de inicio de la campaña (día 1)", f(d.fechaInicio), 3, ["fechaInicio"]), c("Responsable", a(d.responsableCampana), 3, ["responsableCampana"])]] },
    { kind: "grid", widths: [1.8, 4.4, 3.4], header: ["Periodo y corte", "Acciones del periodo", "Qué se revisa con el propietario"], labels: true,
      rows: PERIODOS.map(([periodo, key, acciones, revisa]) => [`${periodo}\nCorte: ${f(d[key])}`, acciones, revisa]),
      keys: PERIODOS.map(([, key]) => [[key], undefined, undefined]) },
    { kind: "note", text: "En cada corte se registran resultados, acciones siguientes, responsable y fecha. Los 21 días son una ventana de trabajo y evaluación; no garantizan comprador, precio ni fecha de cierre." },
    { kind: "label", text: "Revisiones después del día 21" },
    { kind: "note", text: "Son puntos de decisión, no ajustes automáticos: ningún cambio de precio, canal o inversión se aplica sin autorización del propietario. Las señales orientan la revisión, pero no prueban por sí solas que el precio sea la causa." },
    { kind: "grid", widths: [1.6, 2.6, 5.4], header: ["Momento", "Situación", "Revisión que se propone"], labels: true, rows: REVISIONES },

    { kind: "form", label: "8  Seguimiento y responsabilidades", rows: [
      [c("Medio de reporte", a(d.medioReporte), 1.5, ["medioReporte"]), c("Frecuencia pactada", a(d.frecuenciaReporte), 1.5, ["frecuenciaReporte"]), c("Próximo reporte", f(d.proximoReporte), 1.5, ["proximoReporte"]), c("Responsable", a(d.responsableReporte), 1.5, ["responsableReporte"])],
    ] },
    { kind: "grid", widths: [2.2, 7.4], header: ["Indicador", "Cómo se registra y para qué sirve"], labels: true, rows: INDICADORES },
    { kind: "note", text: "Cada reporte presenta las acciones realizadas, la respuesta del público, las objeciones recurrentes y una recomendación para el siguiente periodo. Cuando faltan datos, se señala." },
    { kind: "label", text: "Responsabilidades" },
    { kind: "grid", widths: [1, 1], header: ["Fortius", "El propietario"], rows: RESPONSABILIDADES },

    { kind: "form", label: "9  Decisiones para iniciar y aprobación", rows: [] },
    { kind: "p", text: "Para iniciar la campaña deben quedar resueltas las decisiones siguientes. Solo se consideran aprobados los alcances expresamente identificados. Este plan no amplía las facultades, honorarios, penalizaciones ni licencias del contrato de intermediación." },
    { kind: "grid", widths: [3, 6.6], header: ["Decisión", "Alcance aprobado o pendiente"], labels: true, minRow: 20,
      rows: DECISIONES.map(([key, label]) => [label, a(fila(d.decisiones, key).alcance)]),
      keys: DECISIONES.map(() => [undefined, ["decisiones"]]) },
    { kind: "form", rows: [
      [c("Plan aceptado por", a(d.aceptadoPor), 2, ["aceptadoPor"]), c("Fecha", f(d.fechaAceptacion), 2, ["fechaAceptacion"]), c("Medio de aceptación", a(d.medioAceptacion), 2, ["medioAceptacion"])],
      [c("Siguiente acción", a(d.siguienteAccion), 2, ["siguienteAccion"]), c("Responsable", a(d.responsableSiguiente), 2, ["responsableSiguiente"]), c("Fecha de la acción", f(d.fechaSiguiente), 2, ["fechaSiguiente"])],
    ] },
    { kind: "signatures", zona: { keys: ["propietario", "asesor"], label: "Firmas" }, line: true, parties: [{ role: "El propietario", name: a(d.propietario) ? `${a(d.propietario)}\nNombre y firma` : "Nombre y firma" }, { role: "Asesor de Fortius", name: a(d.asesor) ? `${a(d.asesor)}\nNombre y firma` : "Nombre y firma" }] },
  ];
  return { title: "Plan de comercialización", subject: `Formato 10 · ${a(d.folio)}`, blocks };
}
