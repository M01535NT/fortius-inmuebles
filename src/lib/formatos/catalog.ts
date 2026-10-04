import { validarPresupuesto } from "./presupuesto";
import { validarNeto } from "./neto";
import { validarEntrega } from "./entrega";
import { validarOferta } from "./oferta";

export type FormatoField = {
  key: string;
  label: string;
  type: "text" | "date" | "time" | "money" | "number" | "long" | "choice" | "partidas" | "pagos" | "netoCargos" | "entregaRows";
  required: boolean;
  options?: readonly { value: string; label: string }[];
};

export type FormatoDefinition = {
  id: string;
  title: string;
  source: string;
  phase: 1 | 2 | 3 | 4;
  fields: FormatoField[];
  readyForEmission: boolean;
};

const field = (key: string, label: string, type: FormatoField["type"] = "text", required = true): FormatoField => ({ key, label, type, required });
const choice = (key: string, label: string, options: readonly { value: string; label: string }[], required = true): FormatoField => ({ key, label, type: "choice", options, required });
const f = (id: string, title: string, extension: "docx" | "xlsx", phase: FormatoDefinition["phase"], fields: FormatoField[], readyForEmission = false): FormatoDefinition => ({ id, title: title.replaceAll("_", " "), source: `${id}.${title}.${extension}`, phase, fields, readyForEmission });
const inmueble = field("inmueble", "Inmueble y domicilio");
const fecha = field("fecha", "Fecha", "date");
const asesor = field("asesor", "Asesor responsable");
const propietario = field("propietario", "Propietario o representante");
const comprador = field("comprador", "Comprador o representante");
const folio = field("folio", "Folio del expediente");
const moneda = field("moneda", "Moneda");
const controlStates = [
  { value: "comprobado", label: "Comprobado" },
  { value: "pendiente", label: "Pendiente" },
  { value: "no_aplica", label: "No aplica" },
] as const;
const levantamiento = [folio, inmueble, fecha, asesor, field("superficieTerreno", "Superficie de terreno", "number"), field("superficieConstruccion", "Superficie construida", "number", false), field("estadoObservado", "Estado observado", "long"), field("fotografias", "Referencias de fotografías", "long")];

/** Source names are recorded for traceability; the source files are never served publicly. */
export const FORMATOS: readonly FormatoDefinition[] = [
  f("01", "Aviso_de_privacidad", "docx", 1, [field("responsable", "Responsable del tratamiento"), field("domicilioResponsable", "Domicilio del responsable"), field("contactoPrivacidad", "Contacto de privacidad"), fecha]),
  f("02", "Entrevista_inicial", "docx", 1, [folio, fecha, asesor, propietario, inmueble, field("contacto", "Datos de contacto"), field("relacionInmueble", "Relación con el inmueble"), field("necesidad", "Objetivo declarado", "long")]),
  f("03", "Tablero_y_control_comercial", "xlsx", 1, [field("periodoInicio", "Inicio del periodo", "date"), field("periodoFin", "Fin del periodo", "date"), asesor, field("criterio", "Criterios del reporte", "long")]),
  f("04A", "Levantamiento_terreno", "docx", 1, levantamiento),
  f("04B", "Levantamiento_casa", "docx", 1, levantamiento),
  f("04C", "Levantamiento_departamento", "docx", 1, levantamiento),
  f("04D", "Levantamiento_oficina", "docx", 1, levantamiento),
  f("04E", "Levantamiento_local", "docx", 1, levantamiento),
  f("04F", "Levantamiento_nave_bodega", "docx", 1, levantamiento),
  f("04G", "Levantamiento_plaza_conjunto", "docx", 1, levantamiento),
  f("05", "Revision_juridica_y_control_de_cierre", "docx", 2, [folio, inmueble, fecha, propietario, field("documentos", "Documentos examinados", "long"), field("hallazgos", "Hallazgos y soporte", "long"), field("pendientes", "Pendientes y responsables", "long")]),
  f("06", "Opinion_juridica_del_inmueble", "docx", 2, [folio, inmueble, fecha, propietario, field("conclusion", "Conclusión ejecutiva", "long"), field("antecedentes", "Antecedentes y documentos", "long"), field("analisis", "Análisis jurídico", "long"), field("recomendaciones", "Recomendaciones y próximos pasos", "long")]),
  f("07", "Opinion_de_valor_comercial", "xlsx", 2, [folio, inmueble, fecha, field("antecedentes", "Antecedentes", "long"), field("comparables", "Comparables y fuentes", "long"), field("metodos", "Métodos y conciliación", "long"), field("valorConcluido", "Valor comercial concluido", "money")]),
  f("08", "Estimacion_del_neto_del_propietario", "xlsx", 2, [
    folio, field("fechaEmision", "Fecha de emisión", "date"), propietario, inmueble,
    field("referencia07", "Referencia y versión de la opinión 07"), field("fecha07", "Fecha de la opinión 07", "date"),
    choice("estadoOperacion", "Estado de la operación", [
      { value: "En estudio", label: "En estudio" }, { value: "Cancelada", label: "Cancelada" },
      { value: "Cambio de operación", label: "Cambio de operación" },
    ]),
    field("precioSugerido07", "Valor sugerido según opinión 07", "money"),
    field("precioAcordado", "Precio acordado con el vendedor", "money", false),
    choice("precioBase", "Precio usado para el neto", [
      { value: "sugerido07", label: "Sugerido del 07" }, { value: "acordado", label: "Acordado" },
    ]),
    field("erogaciones", "Erogaciones a cargo del propietario", "netoCargos"),
    field("precioRespaldoFiscal", "Precio del respaldo fiscal", "money"),
    field("respaldoFiscalValidoHasta", "Respaldo fiscal válido hasta", "date"),
    field("cierrePrevisto", "Cierre previsto", "date"),
    choice("revisionCargos", "Revisión de cargos", [
      { value: "Pendiente", label: "Pendiente" }, { value: "Revisado", label: "Revisado" },
    ]),
    field("responsableEstimacion", "Responsable de la estimación"),
  ], true),
  f("09", "Contrato_de_intermediacion_inmobiliaria_para_venta", "docx", 3, [fecha, propietario, inmueble, field("prestador", "Prestador y representación"), field("precio", "Precio autorizado", "money"), moneda, field("honorarios", "Honorarios y condiciones", "long"), field("plazo", "Plazo"), field("modalidad", "Modalidad del encargo")]),
  f("10", "Plan_de_comercializacion", "docx", 3, [folio, inmueble, propietario, asesor, fecha, field("objetivo", "Objetivo del propietario", "long"), field("estrategia", "Estrategia", "long"), field("precioSalida", "Precio de salida", "money"), field("periodo", "Periodo de trabajo")]),
  f("11", "Reporte_de_comercializacion_al_propietario", "docx", 3, [folio, inmueble, propietario, asesor, field("periodo", "Periodo informado"), fecha, field("resultados", "Resultados del periodo", "long"), field("siguienteDecision", "Siguiente decisión", "long")]),
  f("12", "Entrevista_y_perfil_del_comprador", "docx", 3, [
    folio, field("fechaEntrevista", "Fecha de entrevista", "date"), asesor, comprador,
    field("telefono", "Teléfono"), field("correo", "Correo electrónico"),
    choice("medioContacto", "Medio de contacto preferido", [
      { value: "llamada", label: "Llamada" }, { value: "mensajeria", label: "Mensajería" }, { value: "correo", label: "Correo" },
    ]), field("participantesDecision", "Quién más participa en la decisión"),
    choice("tipoInmueble", "Tipo de inmueble buscado", [
      { value: "casa", label: "Casa" }, { value: "departamento", label: "Departamento" }, { value: "terreno", label: "Terreno" },
      { value: "local", label: "Local" }, { value: "oficina", label: "Oficina" }, { value: "nave_bodega", label: "Nave / bodega" }, { value: "otro", label: "Otro" },
    ]),
    choice("usoInmueble", "Uso previsto", [
      { value: "vivienda", label: "Vivienda" }, { value: "comercial", label: "Comercial" },
      { value: "industrial", label: "Industrial" }, { value: "otro_por_definir", label: "Otro / por definir" },
    ]),
    field("zonas", "Zonas donde busca", "long"), field("indispensables", "Características indispensables", "long"),
    field("flexible", "Características en que puede ser flexible", "long"), field("descarta", "Características que descarta", "long"),
    choice("motivoCompra", "Motivo de la compra", [
      { value: "habitar", label: "Habitar" }, { value: "invertir", label: "Invertir" },
      { value: "negocio", label: "Operar un negocio" }, { value: "otro", label: "Otro" },
    ]),
    field("precioDeseado", "Precio que le gustaría pagar", "money"), field("precioMaximo", "Precio máximo que puede pagar", "money"), moneda,
    choice("gastosIncluidos", "¿El precio máximo incluye gastos de compra?", [
      { value: "si", label: "Sí" }, { value: "no", label: "No" }, { value: "por_definir", label: "Por definir" },
    ]), field("reservaGastos", "Dinero reservado para gastos de compra", "money"), field("monedaReserva", "Moneda de la reserva"),
    choice("formaPago", "Forma de pago prevista", [
      { value: "recursos_propios", label: "Recursos propios" }, { value: "credito", label: "Crédito" },
      { value: "combinacion", label: "Combinación de ambos" }, { value: "por_definir", label: "Por definir" },
    ]),
    field("recursosPropios", "Recursos propios disponibles, importe declarado", "money", false),
    field("monedaRecursos", "Moneda de los recursos propios", "text", false),
    field("creditoPrevisto", "Crédito que prevé solicitar, importe", "money", false),
    field("monedaCredito", "Moneda del crédito", "text", false),
    field("institucionCredito", "Institución de crédito", "text", false),
    choice("etapaCredito", "Etapa del crédito", [
      { value: "sin_iniciar", label: "Sin iniciar" }, { value: "en_tramite", label: "En trámite" },
      { value: "precalificado", label: "Precalificado" }, { value: "autorizado_con_soporte", label: "Autorizado con soporte" },
      { value: "no_aplica", label: "No aplica" },
    ], false),
    field("soporteCredito", "Soporte de crédito revisado", "text", false),
    field("fechaSoporte", "Fecha del soporte", "date", false),
    field("vigenciaSoporte", "Vigencia del soporte", "date", false),
    field("plazoCompra", "Para cuándo quiere comprar"),
    choice("fechaFlexible", "¿Puede cambiar esa fecha?", [
      { value: "si", label: "Sí" }, { value: "no", label: "No" }, { value: "por_definir", label: "Por definir" },
    ]),
    field("dependencias", "De qué depende la compra", "long"), field("diasVisita", "Días disponibles para visitas"),
    field("horarioVisita", "Horario disponible para visitas"), field("siguienteAccion", "Siguiente acción", "long"),
    field("responsableSeguimiento", "Responsable del siguiente paso"), field("fechaAcordada", "Fecha acordada", "date"),
  ], true),
  f("13", "Registro_de_visita_y_retroalimentacion", "docx", 3, [
    folio, field("fechaCita", "Fecha de la cita", "date"), field("horaCita", "Hora de la cita", "time"), asesor,
    inmueble, field("folioInmueble", "Folio del inmueble"), field("unidad", "Unidad visitada", "text", false),
    field("interesado", "Nombre del interesado"), field("folioInteresado", "Folio del interesado", "text", false),
    field("acompanantes", "Acompañantes", "text", false),
    choice("estadoCita", "Estado de la cita", [
      { value: "realizada", label: "Realizada" }, { value: "cancelada", label: "Cancelada" },
      { value: "no_acudio", label: "No acudió" }, { value: "reprogramada", label: "Reprogramada" },
    ]),
    field("gusto", "¿Qué le gustó del inmueble?", "long", false),
    field("noConvencio", "¿Qué no le convenció?", "long", false),
    field("dudas", "¿Qué dudas o información necesita resolver?", "long", false),
    choice("cumpleNecesidades", "¿El inmueble cumple sus necesidades?", [
      { value: "si", label: "Sí" }, { value: "en_parte", label: "En parte" },
      { value: "no", label: "No" }, { value: "por_definir", label: "Por definir" },
    ], false),
    choice("pasoSiguiente", "¿Qué quiere hacer después?", [
      { value: "oferta", label: "Presentar oferta" }, { value: "otra_visita", label: "Otra visita" },
      { value: "comparar", label: "Comparar opciones" }, { value: "descartar", label: "Descartarlo" },
      { value: "por_definir", label: "Por definir" },
    ], false),
    field("motivoDecision", "Motivo de su decisión", "long", false),
    field("observacionesAsesor", "Observaciones del asesor, distinguiendo hechos de interpretación", "long", false),
    field("accionAcordada", "Acción acordada", "long"), field("responsableSeguimiento", "Responsable del seguimiento"),
    field("fechaSeguimiento", "Fecha de seguimiento", "date"), field("pendientesComprobar", "Pendientes por comprobar", "long"),
  ], true),
  f("14", "Oferta_de_compra_y_respuesta_del_propietario", "docx", 3, [
    folio, field("lugarPropuesta", "Lugar de la propuesta"), field("fechaPropuesta", "Fecha de la propuesta", "date"),
    propietario, comprador, field("representacionComprador", "Representación del comprador o cuenta propia"),
    field("derechoAdquirir", "Derecho que se propone adquirir"), inmueble,
    field("folioInmueble", "Folio del inmueble y unidad o no aplica"),
    field("precioPropuesto", "Precio propuesto", "money"), moneda,
    field("impuestosPrecio", "Impuestos incluidos o excluidos del precio"),
    field("bienesIncluidos", "Bienes y accesorios incluidos o ninguno", "long"),
    field("bienesExcluidos", "Bienes y accesorios excluidos o ninguno", "long"),
    field("recursosPropios", "Recursos propios", "money"), field("credito", "Crédito previsto", "money"),
    field("institucionCredito", "Institución del crédito", "text", false),
    field("estadoCredito", "Estado del crédito", "text", false),
    field("calendarioPagos", "Importe y momento de cada pago", "long"),
    field("condiciones", "Condiciones, documentos o revisiones pendientes", "long"),
    field("fechaCondiciones", "Límite para resolver condiciones", "date"),
    field("fechaFormalizacion", "Fecha propuesta para formalizar", "date"),
    field("fechaEntrega", "Fecha propuesta para la entrega", "date"),
    field("gastosComprador", "Gastos a cargo del comprador", "long"),
    field("gastosPropietario", "Gastos a cargo del propietario", "long"),
    field("fechaLimitePropuesta", "Límite de respuesta a la propuesta", "date"),
    field("horaLimitePropuesta", "Hora límite de la propuesta", "time"),
    field("zonaHoraria", "Zona horaria"),
    choice("estadoRespuesta", "Estado de la respuesta del propietario", [
      { value: "pendiente", label: "Pendiente: emitir sólo la propuesta" },
      { value: "registrada", label: "Respuesta registrada" },
    ]),
    field("lugarRespuesta", "Lugar de la respuesta", "text", false),
    field("fechaRespuesta", "Fecha de la respuesta", "date", false),
    field("horaRespuesta", "Hora de la respuesta", "time", false),
    field("caracterPropietario", "Carácter y facultades del propietario", "text", false),
    choice("decisionPropietario", "Decisión del propietario", [
      { value: "aceptar", label: "Acepta las bases para negociar" },
      { value: "contraoferta", label: "Propone cambios" },
      { value: "rechazar", label: "Rechaza la propuesta" },
    ], false),
    field("motivoRespuesta", "Motivo de la respuesta", "long", false),
    field("confirmacionVigencia", "Confirmación de vigencia por el comprador", "long", false),
    field("precioContraoferta", "Precio de la contraoferta", "money", false),
    choice("monedaContraoferta", "Moneda de la contraoferta", [{ value: "MXN", label: "MXN" }, { value: "USD", label: "USD" }], false),
    field("impuestosContraoferta", "Impuestos de la contraoferta", "long", false),
    field("cambiosContraoferta", "Cambios precisos de la contraoferta", "long", false),
    field("fechaLimiteContraoferta", "Límite de respuesta a la contraoferta", "date", false),
    field("horaLimiteContraoferta", "Hora límite de la contraoferta", "time", false),
  ], true),
  f("15", "Promesa_de_compraventa", "docx", 4, [fecha, inmueble, propietario, comprador, field("precio", "Precio", "money"), moneda, field("formaPago", "Forma de pago", "long"), field("plazo", "Plazo para escriturar"), field("obligaciones", "Obligaciones y condiciones", "long")]),
  f("16", "Acta_de_entrega_y_recepcion_del_inmueble", "docx", 4, [
    folio, field("lugar", "Lugar del acto"), fecha, field("horaInicio", "Hora de inicio", "time"), inmueble,
    field("contratoReferencia", "Contrato y fecha de referencia"),
    field("quienEntrega", "Nombre de quien entrega"), field("caracterEntrega", "Carácter de quien entrega"),
    field("identificacionEntrega", "Identificación y representación de quien entrega"),
    field("quienRecibe", "Nombre de quien recibe"), field("caracterRecibe", "Carácter de quien recibe"),
    field("identificacionRecibe", "Identificación y representación de quien recibe"),
    field("presentes", "Personas presentes", "long"),
    choice("resultadoEntrega", "Resultado de la entrega", [
      { value: "total", label: "Total" }, { value: "parcial", label: "Parcial" }, { value: "no_realizada", label: "No realizada" },
    ]),
    field("motivoNoEntrega", "Motivo de la entrega no realizada", "long", false),
    field("recepcionFecha", "Fecha de recepción efectiva", "date", false), field("recepcionHora", "Hora de recepción efectiva", "time", false),
    field("areasEntregadas", "Áreas y bienes entregados", "long", false), field("areasSinEntregar", "Áreas sin entregar o ninguna", "long"),
    field("ocupantesTerceros", "Ocupantes y bienes de terceros observados o ninguno", "long"),
    field("areasRevisadas", "Áreas revisadas o ninguna", "long"), field("areasNoRevisadas", "Áreas no revisadas y motivo o ninguna", "long"),
    choice("estadoDiferencias", "Estado de daños y diferencias", [{ value: "sin_diferencias", label: "Sin diferencias en el alcance revisado" }, { value: "registradas", label: "Diferencias registradas" }, { value: "sin_revision", label: "No se revisó" }]),
    field("diferencias", "Daños, faltantes o diferencias", "entregaRows", false),
    choice("estadoAccesos", "Estado de llaves y accesos", [{ value: "ninguno", label: "Ninguno" }, { value: "registrados", label: "Accesos registrados" }]),
    field("accesos", "Llaves y accesos", "entregaRows", false),
    choice("estadoDocumentos", "Estado de documentos adicionales", [{ value: "ninguno", label: "Ninguno" }, { value: "registrados", label: "Documentos registrados" }]),
    field("documentos", "Documentos adicionales entregados", "entregaRows", false),
    choice("estadoServicios", "Estado de lecturas de servicios", [{ value: "no_aplica", label: "No aplica" }, { value: "registrados", label: "Lecturas registradas" }]),
    field("servicios", "Servicios y lecturas", "entregaRows", false),
    choice("estadoPendientes", "Estado de pendientes", [{ value: "ninguno", label: "Ninguno" }, { value: "registrados", label: "Pendientes registrados" }]),
    field("pendientes", "Acciones pendientes", "entregaRows", false),
    field("manifestacionEntrega", "Manifestación de quien entrega o ninguna", "long"),
    field("reservasRecibe", "Reservas de quien recibe o ninguna", "long"),
    field("manifestacionesNoComprobadas", "Manifestaciones no comprobadas o ninguna", "long"),
    field("anexos", "Fotografías o inventario complementario o ninguno", "long"),
    field("horaFinal", "Hora final", "time"), field("ausenciasFirma", "Ausencias de firma y motivo o no aplica", "long"),
  ], true),
  f("17", "Cierre_del_expediente", "docx", 4, [
    folio, field("fechaRegistro", "Fecha de registro", "date"), inmueble,
    choice("resultadoOperacion", "Resultado de la operación", [
      { value: "realizada", label: "Realizada" }, { value: "cancelada", label: "Cancelada" }, { value: "sustituida", label: "Sustituida" },
    ]),
    field("soporteResultado", "Documento y fecha que soportan el resultado"),
    field("motivoCambio", "Motivo de cancelación o cambio", "long", false),
    field("expedienteRelacionado", "Expediente relacionado, si existe", "text", false),
    choice("estadoExpediente", "Estado del expediente", [
      { value: "cerrado_sin_pendientes", label: "Cerrado sin pendientes" },
      { value: "terminado_con_seguimiento", label: "Terminado con seguimiento" },
      { value: "no_procede_cerrar", label: "No procede cerrar" },
    ]),
    choice("tableroEstado", "Resultado actualizado en tablero 03", controlStates), field("tableroReferencia", "Referencia del tablero 03"),
    choice("juridicaEstado", "Situación jurídica actualizada en 05", controlStates), field("juridicaReferencia", "Referencia de la revisión 05"),
    choice("entregaEstado", "Entrega documentada en 16, si aplica", controlStates), field("entregaReferencia", "Referencia de entrega o motivo de no aplicación"),
    choice("publicacionesEstado", "Publicaciones actualizadas", controlStates), field("publicacionesReferencia", "Referencia de publicaciones"),
    choice("accesosEstado", "Accesos bajo custodia devueltos, si aplica", controlStates), field("accesosReferencia", "Referencia de accesos o motivo de no aplicación"),
    field("accionesPendientes", "Acciones pendientes o ninguno", "long"),
    field("responsablePendientes", "Responsable de los pendientes", "text", false),
    field("proximaRevision", "Próxima revisión", "date", false),
    field("ubicacionExpediente", "Ubicación del expediente completo"),
    field("custodiaOriginales", "Originales bajo custodia y destino, o no aplica", "long"),
    field("responsableRegistro", "Responsable del registro"),
  ], true),
  f("18", "Recibo_de_pago_de_honorarios", "docx", 4, [
    field("numeroRecibo", "Número de recibo"), field("lugarEmision", "Lugar de emisión"), field("fechaPago", "Fecha del pago", "date"),
    field("pagador", "Quien paga"), field("importeRecibido", "Importe recibido", "money"), moneda,
    field("importeLetra", "Importe en letra"), field("concepto", "Concepto de honorarios"),
    field("contratoFecha", "Contrato y fecha"), inmueble, folio, field("beneficiario", "Beneficiario"),
    field("representacionBeneficiario", "Cuenta propia o representación"), field("caracter", "Carácter o autorización"),
    field("medioPago", "Medio de pago"), field("referenciaPago", "Referencia del pago"), field("soporteRecepcion", "Soporte de recepción"),
    field("pagoParcialTotal", "Pago parcial o total"), field("saldo", "Saldo pendiente", "money"), field("monedaSaldo", "Moneda del saldo"),
    field("soporteSaldo", "Contrato y pagos previos"), field("observaciones", "Observaciones", "long"),
    field("cfdiEstado", "Folio fiscal o estado del CFDI"), field("receptor", "Nombre de quien recibe"),
  ], true),
  f("19", "Presupuesto_de_rehabilitacion", "xlsx", 4, [
    folio, inmueble, field("fechaCorte", "Fecha de corte", "date"), field("responsable", "Responsable"), moneda,
    field("alcance", "Alcance de la rehabilitación", "long"),
    field("reservaImprevistos", "Reserva para imprevistos", "money"),
    field("partidas", "Partidas del presupuesto", "partidas"),
    field("pagos", "Pagos registrados", "pagos", false),
    choice("sinPagosConfirmado", "Confirma que no hubo pagos al corte", [
      { value: "si", label: "Sí, no hubo pagos" }, { value: "no", label: "Hay pagos por registrar" },
    ], false),
  ], true),
];

export function formatoById(id: string): FormatoDefinition {
  const formato = FORMATOS.find((item) => item.id === id);
  if (!formato) throw new Error("Formato desconocido");
  return formato;
}

export function validateFormato(id: string, data: Record<string, unknown>): string[] {
  const errors = formatoById(id).fields.filter((item) => {
    if (item.type === "partidas" || item.type === "pagos" || item.type === "netoCargos" || item.type === "entregaRows") return false;
    const value = data[item.key];
    if (value === undefined || value === null || String(value).trim() === "") return item.required;
    if (item.type === "money" || item.type === "number") {
      if (id === "18" && item.key === "saldo" && value === "por confirmar") return false;
      return typeof value !== "number" || !Number.isFinite(value) || value < 0;
    }
    if (item.type === "date") {
      if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return true;
      const parsed = new Date(`${value}T00:00:00Z`);
      return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value;
    }
    if (item.type === "time") return typeof value !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value);
    if (item.type === "choice") return typeof value !== "string" || !item.options?.some((option) => option.value === value);
    return typeof value !== "string";
  }).map((item) => item.label);
  if (id === "08") errors.push(...validarNeto(data));
  if (id === "16") errors.push(...validarEntrega(data));
  if (id === "14") errors.push(...validarOferta(data));
  if (id === "19") errors.push(...validarPresupuesto(data));
  if (id === "12") {
    if (typeof data.precioDeseado === "number" && typeof data.precioMaximo === "number" && data.precioDeseado > data.precioMaximo) errors.push("Precio que le gustaría pagar");
    if (data.precioDeseado === 0) errors.push("Precio que le gustaría pagar");
    if (data.precioMaximo === 0) errors.push("Precio máximo que puede pagar");
    if (typeof data.correo === "string" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.correo)) errors.push("Correo electrónico");
    if (["recursos_propios", "combinacion"].includes(String(data.formaPago))) {
      if (typeof data.recursosPropios !== "number" || data.recursosPropios <= 0) errors.push("Recursos propios disponibles, importe declarado");
      if (!String(data.monedaRecursos ?? "").trim()) errors.push("Moneda de los recursos propios");
    }
    if (["credito", "combinacion"].includes(String(data.formaPago))) {
      if (typeof data.creditoPrevisto !== "number" || data.creditoPrevisto <= 0) errors.push("Crédito que prevé solicitar, importe");
      if (!String(data.monedaCredito ?? "").trim()) errors.push("Moneda del crédito");
      if (!["sin_iniciar", "en_tramite", "precalificado", "autorizado_con_soporte"].includes(String(data.etapaCredito))) errors.push("Etapa del crédito");
      if (data.etapaCredito === "autorizado_con_soporte") {
        if (!String(data.soporteCredito ?? "").trim()) errors.push("Soporte de crédito revisado");
        if (!String(data.fechaSoporte ?? "").trim()) errors.push("Fecha del soporte");
        if (!String(data.vigenciaSoporte ?? "").trim()) errors.push("Vigencia del soporte");
      }
    }
  }
  if (id === "13" && data.estadoCita === "realizada") {
    const requiredOnVisit = ["gusto", "noConvencio", "dudas", "cumpleNecesidades", "pasoSiguiente", "motivoDecision"];
    for (const key of requiredOnVisit) {
      const item = formatoById(id).fields.find((candidate) => candidate.key === key)!;
      const value = data[key];
      if (typeof value !== "string" || !value.trim() || (item.type === "choice" && !item.options?.some((option) => option.value === value))) errors.push(item.label);
    }
  }
  if (id === "17") {
    if (["cancelada", "sustituida"].includes(String(data.resultadoOperacion)) && !String(data.motivoCambio ?? "").trim()) errors.push("Motivo de cancelación o cambio");
    const controls = ["tableroEstado", "juridicaEstado", "entregaEstado", "publicacionesEstado", "accesosEstado"];
    if (data.estadoExpediente === "cerrado_sin_pendientes") {
      if (controls.some((key) => data[key] === "pendiente")) errors.push("Estado del expediente");
      if (String(data.accionesPendientes ?? "").trim().toLocaleLowerCase("es-MX") !== "ninguno") errors.push("Acciones pendientes o ninguno");
    }
    if (data.estadoExpediente === "terminado_con_seguimiento") {
      if (String(data.accionesPendientes ?? "").trim().toLocaleLowerCase("es-MX") === "ninguno") errors.push("Acciones pendientes o ninguno");
      if (!String(data.responsablePendientes ?? "").trim()) errors.push("Responsable de los pendientes");
      if (!String(data.proximaRevision ?? "").trim()) errors.push("Próxima revisión");
    }
  }
  if (id === "18") {
    if (!["total", "parcial"].includes(String(data.pagoParcialTotal))) errors.push("Pago parcial o total");
    if (data.pagoParcialTotal === "total" && data.saldo !== 0) errors.push("Saldo pendiente");
    if (data.pagoParcialTotal === "parcial" && data.saldo !== "por confirmar" && !(typeof data.saldo === "number" && data.saldo > 0)) errors.push("Saldo pendiente");
    if (data.monedaSaldo !== data.moneda) errors.push("Moneda del saldo");
  }
  return [...new Set(errors)];
}
