import { calcularExtras, type PlanRow } from "../plan";
import { dinero, fecha, filas, m, v, type Block, type Documento } from "./modelo";

/*
  10 · Plan de comercialización, con el texto y el orden de la plantilla
  (Metodología/10.Plan_de_comercializacion.docx). Cada espacio en blanco se llena con
  el dato capturado; si falta, queda la línea para completarse a mano.
*/

type Data = Record<string, unknown>;
const row = (data: Data, table: string, concepto: string) => filas(data[table]).find(r => r.concepto === concepto) ?? {};
const AIDA: Array<[string, string]> = [
  ["Atención", "Presentaremos el inmueble con una fotografía principal clara, su tipo, la zona autorizada, el precio y un atributo comprobado. Lo difundiremos en los canales seleccionados. Revisaremos consultas nuevas y, cuando la plataforma lo permita, visualizaciones o clics para saber si el anuncio está llegando al público previsto."],
  ["Interés", "Al recibir una consulta, enviaremos la ficha y las imágenes o el video disponibles. Aclararemos condiciones y confirmaremos necesidad, presupuesto, plazo y forma prevista de pago. Las respuestas y solicitudes de visita nos ayudarán a distinguir una consulta inicial de un interesado con posibilidad de avanzar."],
  ["Deseo", "En la visita mostraremos cómo los espacios y condiciones del inmueble responden a lo que busca el prospecto. Explicaremos ventajas y limitaciones con información comprobable. Registraremos sus objeciones y acordaremos el siguiente paso, sin ocultar defectos ni crear presión artificial."],
  ["Acción", "Cuando exista interés suficiente, facilitaremos una oferta escrita que indique precio, forma de pago, condiciones y vigencia. La remitiremos al propietario dentro del plazo pactado en el contrato 09. Este plan no faculta al asesor para aceptar ofertas ni recibir apartados."],
];
const INDICADORES: Array<[string, string]> = [
  ["Contactos y visitas", "Contar interesados únicos; separar consultas, visitas agendadas y realizadas. Identificar el canal de origen."],
  ["Ofertas y objeciones", "Contar ofertas identificables sin duplicar sus revisiones; resumir motivos de no avanzar y siguiente acción."],
  ["Respuesta por canal", "Usar alcance o clics sólo si la plataforma los informa. No sumar audiencias como personas únicas ni comparar periodos distintos."],
  ["Tiempo y conversión", "Días desde el lanzamiento y, si hay datos, ofertas / visitas realizadas. Si no hay visitas, la razón no se calcula."],
  ["Publicidad pagada", "Sólo si fue contratada: distinguir presupuesto autorizado, fondos recibidos, gasto comprobado y saldo."],
];

export function planDocumento(d: Data): Documento {
  const extras = filas(d.extras) as PlanRow[];
  const totals = calcularExtras(extras);
  const accepted = d.estadoAprobacion === "registrada";
  const blocks: Block[] = [
    { kind: "title", text: "Plan de comercialización" },
    { kind: "p", text: `Proponemos ${m(d.estrategia)} para alcanzar ${m(d.objetivo)}. Este plan explica qué comunicaremos, cómo atenderemos a los interesados y qué revisaremos durante el lanzamiento. Encargo: ${m(d.modalidadEncargo)}.` },
    { kind: "band", widths: [3816, 3816, 2592], rows: [
      [{ label: "Inmueble", value: v(d.inmueble) }, { label: "Propietario", value: v(d.propietario) }, { label: "Folio", value: v(d.folio) }],
      [{ label: "Operación", value: d.operacion === "renta" ? "Renta" : d.operacion === "venta" ? "Venta" : v(d.operacion) }, { label: "Asesor", value: `${v(d.asesor)}${d.contactoAsesor ? ` · ${String(d.contactoAsesor)}` : ""}` }, { label: "Fecha", value: fecha(d.fecha) }],
    ] },

    { kind: "h1", text: "01 La estrategia para su inmueble" },
    { kind: "h2", text: "Precio y posicionamiento" },
    { kind: "table", widths: [3816, 3816, 2592], header: ["Referencia de valor · 07", "Precio de salida autorizado", "Siguiente decisión"], rows: [[
      `${dinero(d.valorReferencia07, d.moneda)}\n${v(d.referencia07)}`,
      `${dinero(d.precioSalida, d.moneda)}\n${v(d.baseFiscal)}\n${v(d.autorizacionPrecio)}`,
      `${v(d.decisionPrecio)}\n${v(d.periodo)}\n${fecha(d.fechaRevision)}`,
    ]] },
    { kind: "p", text: `El precio de salida se apoya en la opinión de valor identificada arriba. La diferencia entre ambos se explica por ${m(d.justificacionDiferencia)}. Usaremos esa referencia para conversar con los interesados y evaluar sus ofertas. El propietario decide si acepta una propuesta o cambia el precio; el neto estimado se presenta por separado en el formato 08.` },
    { kind: "h2", text: "Qué diferencia al inmueble" },
    { kind: "p", text: `Destacaremos ${m(d.diferenciador)} porque responde a lo que busca el público previsto. Frente a la objeción, explicaremos: ${m(d.objecionRespuesta)}. La comparación con otras opciones consta en ${m(d.competencia)}.` },
    { kind: "table", widths: [3408, 3408, 3408], header: ["Atributo o condición", "Evidencia y alcance", "Mensaje comercial"], rows: (filas(d.atributos).length ? filas(d.atributos) : [{}, {}]).map(r => [v(r.atributo), v(r.evidencia), v(r.mensaje)]) },
    { kind: "h2", text: "A quién dirigiremos la campaña" },
    { kind: "p", text: `Buscaremos interesados con este perfil: ${m(d.publicoPrimario)}. Si corresponde, atenderemos también a ${m(d.publicoSecundario)}. Probaremos el mensaje «${v(d.mensajePrueba)}» y lo ajustaremos con las consultas y visitas recibidas; lo validaremos con ${m(d.evidenciaValidacion)}. Información pendiente de comprobar: ${m(d.pendientesCampana)}. Lo declarado se identificará como tal.` },

    { kind: "h1", text: "02 Del anuncio a la oferta" },
    { kind: "p", text: "Aplicaremos AIDA —Atención, Interés, Deseo y Acción— para acompañar al interesado desde el primer contacto hasta una oferta escrita. Cada etapa orienta una acción concreta; un prospecto puede regresar a una etapa anterior si necesita más información." },
    ...AIDA.flatMap(([title, text]): Block[] => [{ kind: "h2", text: title }, { kind: "p", text }]),
    { kind: "h2", text: "Cómo atenderemos las visitas" },
    { kind: "p", text: `Responderemos por ${m(d.mediosAtencion)}, ${m(d.tiempoRespuesta)}. Las visitas se realizarán en ${m(d.horariosVisita)}, con ${v(d.responsableAcceso)}. Confirmaremos la cita y prepararemos el recorrido. Después registraremos la respuesta del prospecto y su próxima acción en los formatos 12 y 13; las ofertas se presentarán en el 14.` },
    { kind: "p", text: `Formas de pago a evaluar: ${m(d.formasPago)}. La viabilidad de un crédito depende del comprador, del inmueble y de la institución. Documentos de acceso restringido: ${m(d.documentosRestringidos)}. Custodio: ${v(d.custodioDocumentos)}. La confidencialidad o evidencia financiera se solicitarán sólo cuando correspondan al alcance aprobado; no se publica documentación personal.` },

    { kind: "h1", text: "03 Preparación de la campaña" },
    { kind: "h2", text: "Antes de publicar" },
    { kind: "p", text: `El lanzamiento depende de ${m(d.condicionesLanzamiento)}. Antes de producir las imágenes, acordaremos limpieza, orden, iluminación y acceso seguro. Retiraremos documentos y objetos personales de las tomas. Los trabajos previos serán: ${m(d.preparacion)}. La edición de fotografías no ocultará daños ni condiciones relevantes.` },
    { kind: "table", widths: [2592, 4224, 3408], header: ["Etapa", "Entregable o condición", "Responsable y fecha"], rows: [["Preparación", "preparacion"], ["Producción", "produccion"], ["Lanzamiento", "lanzamiento"], ["Cortes 7, 14 y 21", "cortes"], ["Continuidad", "continuidad"]].map(([label, key]) => { const r = row(d, "hitos", key); return [label, v(r.entregable), `${v(r.responsable)} · ${fecha(r.fecha)}`]; }) },
    { kind: "h2", text: "Materiales que utilizaremos" },
    { kind: "p", text: `Seleccionaremos las piezas que permitan entender este inmueble. Los videos, planos, recorridos 360°, dron u otros recursos se incorporarán sólo si su alcance y costo están acordados. Responsable de aprobar contenidos: ${v(d.aprobadorContenido)}.` },
    { kind: "table", widths: [2592, 4224, 3408], header: ["Pieza seleccionada", "Alcance para este inmueble", "Responsable y fecha"], rows: [["Fotografías", "fotografias"], ["Ficha comercial", "ficha"], ["Video o plano", "video"], ["Otras piezas", "otras"]].map(([label, key]) => { const r = row(d, "piezas", key); return [label, v(r.alcance), `${v(r.responsable)} · ${fecha(r.fecha)}`]; }) },
    { kind: "h2", text: "Dónde publicaremos" },
    { kind: "p", text: "Elegiremos los canales por su relación con el público previsto y revisaremos la respuesta que genere cada uno. El anuncio mostrará precio, moneda, atributos comprobables, ubicación autorizada y contacto. No inventaremos interesados, urgencia, créditos disponibles o rendimientos." },
    { kind: "table", widths: [3408, 3408, 3408], header: ["Canal / motivo de elección", "Pieza · periodo / frecuencia", "Estado / autorización"], rows: [["Portales gratuitos", "portales"], ["Sitio web y redes de Fortius", "mnt"], ["Referidos y colaboración", "referidos"]].map(([label, key]) => { const r = row(d, "canales", key); return [`${label}\n${v(r.motivo)}`, v(r.piezaPeriodo), v(r.autorizacion)]; }) },
    { kind: "p", text: `Contacto público: ${v(d.contactoPublico)}. Ubicación que puede difundirse: ${v(d.ubicacionPublicable)}. Red de referidos y colaboración: ${m(d.colaboracion)}. Una propuesta de difusión no autoriza por sí misma una publicación, una visita abierta, un gasto o la entrega de datos personales.` },
    { kind: "h2", text: "Alcance para plazas o conjuntos" },
    { kind: "p", text: `Cuando se comercialicen varias unidades, el alcance será ${m(d.unidadesFases)}. Cada anuncio deberá corresponder a la disponibilidad real de su unidad. Los usos permitidos, servicios, potencia eléctrica y demás atributos se comunicarán únicamente con respaldo específico del inmueble.` },

    { kind: "h1", text: "04 Los primeros 21 días" },
    { kind: "p", text: `La campaña comenzará el ${fecha(d.fechaLanzamiento)}, una vez aprobados el precio, las piezas y los canales. Ese lanzamiento será el día 1. Durante los primeros 21 días concentraremos el trabajo inicial y revisaremos la respuesta en tres cortes. Responsable: ${v(d.asesor)}.` },
    { kind: "table", widths: [2592, 3816, 3816], header: ["Periodo y fecha de corte", "Acciones del periodo", "Qué revisaremos con el propietario"], rows: [
      [`Días 1 a 7\nCorte: ${fecha(d.corte7)}`, "Publicar piezas aprobadas, verificar anuncios, activar referidos autorizados y responder consultas. Medir Atención e Interés.", "Confirmar que la difusión funciona; corregir información, imágenes o contacto si hace falta."],
      [`Días 8 a 14\nCorte: ${fecha(d.corte14)}`, "Dar seguimiento, realizar visitas, recoger objeciones y completar información. Medir Interés y Deseo.", "Acordar mejoras de presentación, mensaje o atención según las respuestas obtenidas."],
      [`Días 15 a 21\nCorte: ${fecha(d.corte21)}`, "Retomar interesados, resolver dudas y facilitar ofertas escritas sin presión artificial. Revisar todas las etapas.", "Mantener el plan o proponer cambios sustentados de contenido, canales, acceso o precio."],
    ] },
    { kind: "p", text: `En cada corte registraremos resultados, acciones siguientes, responsable y fecha. Si la campaña se pausa, anotaremos el motivo y las fechas reales. Los 21 días son una ventana de trabajo y evaluación; no garantizan comprador, precio o fecha de cierre. Después continuaremos con revisiones con esta frecuencia: ${v(d.frecuencia09)}.` },
    { kind: "h2", text: "Publicidad pagada y servicios adicionales" },
    { kind: "p", text: "La difusión ordinaria contempla publicaciones gratuitas en portales cuando estén disponibles. La publicidad pagada en portales, redes u otros medios no está incluida y será a cargo del propietario. Antes de contratarla, acordaremos por escrito canal, periodo, importe máximo con impuestos y forma de pago. Cada pieza opcional tendrá alcance y pagador definidos." },
    { kind: "table", widths: [3408, 1872, 2208, 2736], header: ["Concepto y periodo", "Total MXN", "A cargo de", "Autorización y soporte"], rows: (extras.length ? extras : [{}, {}, {}]).map(r => [v(r.concepto), dinero(r.importe), v(r.pagador), r.estado ? `${r.estado === "autorizado" ? "Autorizado" : "Propuesto"} · ${v(r.soporte)}` : v(r.soporte)]) },
    { kind: "p", text: `Extras propuestos: ${dinero(totals.propuesto, "MXN")}. Extras autorizados: ${dinero(totals.autorizado, "MXN")}. Cotización: ${d.estadoPublicidad === "no_contratada" ? "No contratado" : v(extras.map(r => r.soporte).filter(Boolean).join("; "))}. Si no se contrata publicidad pagada, se indicará “No contratado” y su importe autorizado será 0; los demás extras se registran por separado. El presupuesto no modifica la comisión ni la pena del contrato 09 y no permite cobrar dos veces el mismo concepto.` },

    { kind: "h1", text: "05 Seguimiento y decisiones" },
    { kind: "h2", text: "Qué recibirá el propietario" },
    { kind: "p", text: `Entregaremos el reporte 11 por ${m(d.medioReporte)}, con la frecuencia pactada en el contrato 09: ${v(d.frecuencia09)}. El próximo reporte será el ${fecha(d.proximoCorte)}, dirigido a ${v(d.destinatarioReporte)}. Presentará acciones realizadas, respuesta del público, objeciones recurrentes y una recomendación para el siguiente periodo. Los registros de trabajo permanecerán en el formato 03.` },
    { kind: "table", widths: [3000, 7224], header: ["Indicador", "Cómo se contará / para qué sirve"], rows: INDICADORES.map(([a, b]) => [a, b]) },
    { kind: "h2", text: "Cuándo cambiaremos la estrategia" },
    { kind: "p", text: "Si el anuncio recibe poca exposición, revisaremos canales y piezas. Si hay consultas sin visitas, revisaremos información, seguimiento y acceso. Si hay visitas sin ofertas, analizaremos objeciones y condiciones. Estas señales orientan la revisión; por sí solas no prueban que el precio sea el problema." },
    { kind: "p", text: `Aplicaremos el criterio ${m(d.criterioRevision)} en los días 7, 14 y 21 y después con la frecuencia convenida. Cuando falten datos, lo señalaremos. Un cambio de precio deberá apoyarse en la opinión de valor y contar con autorización del propietario. No habrá descuentos automáticos ni publicidad pagada activada por el solo paso del tiempo. Los cambios y cancelaciones se comunicarán conforme al contrato 09.` },
    { kind: "h2", text: "Responsabilidades y aprobación" },
    { kind: "p", text: "La inmobiliaria prepara los contenidos, atiende interesados, mantiene las publicaciones y reporta resultados. El propietario facilita acceso, informa cambios de disponibilidad, atiende los trabajos acordados y decide sobre ofertas, precio y gastos adicionales. Para iniciar, deberán quedar resueltas las siguientes decisiones." },
    { kind: "table", widths: [3816, 6408], header: ["Decisión para iniciar", "Alcance aprobado o pendiente"], rows: [["Precio, canales y materiales", "difusion"], ["Presupuesto, acceso y datos", "gastos"], ["Pendientes / responsable / fecha", "pendientes"]].map(([label, key]) => [label, v(row(d, "decisiones", key).alcance)]) },
    { kind: "p", text: `Aceptación del plan: ${accepted ? v(d.nombreAprobador) : v("")}, el ${accepted ? fecha(d.fechaAprobacion) : v("")}, mediante ${accepted ? v(d.acuseAprobacion) : v("")}. Sólo se consideran aprobados los alcances expresamente identificados. Este plan no amplía las facultades, honorarios, penalizaciones ni licencias del contrato.` },
    { kind: "p", text: `Siguiente acción: ${v(d.siguienteAccion)}. Responsable: ${v(d.responsableSiguiente)}. Fecha: ${fecha(d.fechaSiguiente)}.` },
  ];
  return { title: "Plan de comercialización", subject: `Formato 10 · ${v(d.folio)}`, blocks };
}
