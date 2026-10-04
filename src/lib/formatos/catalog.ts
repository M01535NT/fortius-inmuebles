import { validarPresupuesto } from "./presupuesto";
import { validarNeto } from "./neto";
import { validarEntrega } from "./entrega";
import { validarOferta } from "./oferta";
import { validarPlan } from "./plan";
import { validarReporte } from "./reporte";
import { entrevistaFields, validarEntrevista } from "./entrevista";
import { validarAviso } from "./aviso";
import { validarJuridica } from "./juridica";
import { levantamientoFields, isLevantamiento, validarLevantamiento } from "./levantamiento";
import { valorFields, mostrarCampoValor } from "./valor-fields";
import { validarValor } from "./valor";
import { promesaFields, mostrarCampoPromesa, validarPromesa } from "./promesa";
import { intermediacionFields, mostrarCampoIntermediacion, validarIntermediacion } from "./intermediacion";

export type FormatoField = {
  key: string;
  label: string;
  type: "text" | "date" | "time" | "money" | "number" | "long" | "choice" | "partidas" | "pagos" | "netoCargos" | "entregaRows" | "planRows" | "reporteRows" | "entrevistaRows" | "juridicaRows" | "levantamientoRows" | "valorRows" | "promesaRows" | "intermediacionRows";
  required: boolean;
  section?: string;
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
const sectionField = (section: string, key: string, label: string, type: FormatoField["type"] = "text"): FormatoField => ({ ...field(key, label, type), section });
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

/** Source names are recorded for traceability; the source files are never served publicly. */
export const FORMATOS: readonly FormatoDefinition[] = [
  f("01", "Aviso_de_privacidad", "docx", 1, [
    sectionField("Responsable y contacto", "folio", "Folio del expediente"),
    sectionField("Responsable y contacto", "fechaEmision", "Fecha de emisión", "date"),
    sectionField("Responsable y contacto", "responsable", "Identidad del responsable"),
    sectionField("Responsable y contacto", "domicilioResponsable", "Domicilio completo del responsable"),
    sectionField("Responsable y contacto", "contactoPrivacidad", "Persona que atiende privacidad"),
    sectionField("Responsable y contacto", "correoPrivacidad", "Correo para derechos de privacidad"),
    sectionField("Titular y operación", "titular", "Nombre del titular"),
    { ...choice("tipoTitular", "Calidad del titular", [{ value: "propietario", label: "Propietario" }, { value: "comprador", label: "Comprador" }, { value: "arrendatario", label: "Arrendatario" }, { value: "representante", label: "Representante" }, { value: "otro", label: "Otra" }]), section: "Titular y operación" },
    sectionField("Titular y operación", "operacion", "Operación o servicio"),
    { ...sectionField("Titular y operación", "representante", "Nombre del representante"), required: false },
    { ...sectionField("Titular y operación", "documentoRepresentante", "Documento de representación"), required: false },
    { ...choice("consentimientoPatrimonial", "Datos patrimoniales y financieros", [{ value: "si", label: "Consiente expresamente" }, { value: "no", label: "No consiente" }, { value: "no_aplica", label: "No aplica en esta etapa" }, { value: "pendiente", label: "Pendiente de decisión" }]), section: "Decisiones del titular" },
    { ...choice("consentimientoPublicidad", "Publicidad y oportunidades adicionales", [{ value: "si", label: "Autoriza" }, { value: "no", label: "No autoriza" }, { value: "pendiente", label: "Pendiente de decisión" }]), section: "Decisiones del titular" },
    { ...choice("publicidadCorreo", "Publicidad por correo", [{ value: "si", label: "Autoriza" }, { value: "no", label: "No autoriza" }], false), section: "Decisiones del titular" },
    { ...choice("publicidadTelefono", "Publicidad por teléfono", [{ value: "si", label: "Autoriza" }, { value: "no", label: "No autoriza" }], false), section: "Decisiones del titular" },
    { ...choice("publicidadMensajeria", "Publicidad por mensajería", [{ value: "si", label: "Autoriza" }, { value: "no", label: "No autoriza" }], false), section: "Decisiones del titular" },
    { ...choice("transferenciaAsesor", "Transferencia a asesor independiente", [{ value: "si", label: "Autoriza" }, { value: "no", label: "No autoriza" }, { value: "no_aplica", label: "No aplica" }, { value: "pendiente", label: "Pendiente" }]), section: "Transferencias" },
    { ...sectionField("Transferencias", "asesorDestinatario", "Destinatario asesor"), required: false },
    { ...sectionField("Transferencias", "asesorPais", "País del asesor"), required: false },
    { ...choice("transferenciaFinanciera", "Transferencia a entidad de financiamiento", [{ value: "si", label: "Autoriza" }, { value: "no", label: "No autoriza" }, { value: "no_aplica", label: "No aplica" }, { value: "pendiente", label: "Pendiente" }]), section: "Transferencias" },
    { ...sectionField("Transferencias", "financieroDestinatario", "Entidad financiera"), required: false },
    { ...sectionField("Transferencias", "financieroPais", "País de la entidad financiera"), required: false },
    { ...choice("transferenciaOperacion", "Transferencia a contraparte o notaría", [{ value: "si", label: "Autoriza cuando sea necesaria" }, { value: "no", label: "No autoriza" }, { value: "no_aplica", label: "No aplica" }, { value: "pendiente", label: "Pendiente" }]), section: "Transferencias" },
    { ...sectionField("Transferencias", "operacionDestinatario", "Contraparte o notaría"), required: false },
    { ...sectionField("Transferencias", "operacionPais", "País de la contraparte o notaría"), required: false },
    { ...choice("acuseEstado", "Estado de firma del aviso", [{ value: "pendiente", label: "Pendiente de firma" }, { value: "firmado_fuera", label: "Firmado fuera del panel" }]), section: "Recepción del aviso" },
    { ...sectionField("Recepción del aviso", "fechaAcuse", "Fecha de firma externa", "date"), required: false },
    { ...sectionField("Recepción del aviso", "referenciaAcuse", "Referencia del acuse firmado"), required: false },
  ], true),
  f("02", "Entrevista_inicial", "docx", 1, entrevistaFields, true),
  f("03", "Tablero_y_control_comercial", "xlsx", 1, [field("periodoInicio", "Inicio del periodo", "date"), field("periodoFin", "Fin del periodo", "date"), asesor, field("criterio", "Criterios del reporte", "long")]),
  f("04A", "Levantamiento_terreno", "docx", 1, levantamientoFields("04A"), true),
  f("04B", "Levantamiento_casa", "docx", 1, levantamientoFields("04B"), true),
  f("04C", "Levantamiento_departamento", "docx", 1, levantamientoFields("04C"), true),
  f("04D", "Levantamiento_oficina", "docx", 1, levantamientoFields("04D"), true),
  f("04E", "Levantamiento_local", "docx", 1, levantamientoFields("04E"), true),
  f("04F", "Levantamiento_nave_bodega", "docx", 1, levantamientoFields("04F"), true),
  f("04G", "Levantamiento_plaza_conjunto", "docx", 1, levantamientoFields("04G"), true),
  f("05", "Revision_juridica_y_control_de_cierre", "docx", 2, [
    sectionField("01 / Encargo e identificación", "folio", "ID de operación"),
    sectionField("01 / Encargo e identificación", "idInmueble", "ID de inmueble"),
    sectionField("01 / Encargo e identificación", "fechaCorte", "Fecha de corte", "date"),
    sectionField("01 / Encargo e identificación", "versionRevision", "Versión de la revisión"),
    sectionField("01 / Encargo e identificación", "inmueble", "Domicilio y unidad"),
    sectionField("01 / Encargo e identificación", "municipio", "Municipio"),
    sectionField("01 / Encargo e identificación", "claveCatastral", "Clave catastral o pendiente"),
    sectionField("01 / Encargo e identificación", "folioReal", "Folio real o antecedente"),
    sectionField("01 / Encargo e identificación", "solicitante", "Parte solicitante y calidad"),
    sectionField("01 / Encargo e identificación", "operacion", "Operación y etapa a decidir"),
    sectionField("01 / Encargo e identificación", "alcance", "Alcance de la revisión"),
    sectionField("02 / Personas y facultades", "personas", "Personas y facultades", "juridicaRows"),
    sectionField("02 / Personas y facultades", "estadoCivilAdquisicion", "Estado civil al adquirir y fecha"),
    sectionField("02 / Personas y facultades", "estadoCivilActual", "Estado civil actual y cambios acreditados"),
    sectionField("02 / Personas y facultades", "regimen", "Régimen patrimonial y evidencia"),
    sectionField("02 / Personas y facultades", "consentimientos", "Consentimientos y firmas necesarios con fundamento", "long"),
    sectionField("02 / Personas y facultades", "representacion", "Representación, acto, límites, vigencia y verificación", "long"),
    sectionField("03 / Control documental", "documentos", "Control documental", "juridicaRows"),
    sectionField("04 / Título y descripción", "tracto", "Cadena de titularidad", "juridicaRows"),
    sectionField("04 / Título y descripción", "conclusionTracto", "Conclusión del tracto con evidencia", "long"),
    sectionField("04 / Título y descripción", "contraste", "Contraste de identidad", "juridicaRows"),
    sectionField("05 / Gravámenes y controversias", "cargas", "Cargas y limitaciones", "juridicaRows"),
    sectionField("05 / Gravámenes y controversias", "consultas", "Consultas registrales y judiciales: alcance, fecha y resultado", "long"),
    sectionField("06 / Posesión y compromisos", "ocupacion", "Ocupante, título y plazo", "long"),
    sectionField("06 / Posesión y compromisos", "compromisos", "Contratos, promesas, opciones y exclusivas vigentes", "long"),
    sectionField("06 / Posesión y compromisos", "posesion", "Condiciones y conflictos de posesión", "long"),
    sectionField("07 / Controles especiales", "especiales", "Controles especiales", "juridicaRows"),
    sectionField("08 / Fiscal, adeudos y formalización", "predial", "Predial: cuenta, periodo, saldo, fuente y fecha", "long"),
    sectionField("08 / Fiscal, adeudos y formalización", "agua", "CESPT: cuenta, saldo, fuente y fecha", "long"),
    sectionField("08 / Fiscal, adeudos y formalización", "otrosAdeudos", "Otros adeudos y evidencia", "long"),
    sectionField("08 / Fiscal, adeudos y formalización", "responsableAdeudos", "Responsable de pago y pendientes", "long"),
    sectionField("08 / Fiscal, adeudos y formalización", "fiscal", "ISR y posible exención: declarado, comprobado y validación profesional", "long"),
    sectionField("08 / Fiscal, adeudos y formalización", "credito", "Crédito, avalúo y requisitos de banco o notaría", "long"),
    sectionField("08 / Fiscal, adeudos y formalización", "gastos", "Impuestos y gastos: cálculo validado, fecha y responsable", "long"),
    { ...choice("hallazgosEstado", "Estado de hallazgos", [{ value: "ninguno", label: "No se identificaron" }, { value: "abiertos", label: "Hay hallazgos abiertos" }, { value: "cerrados", label: "Subsanados con evidencia" }]), section: "09 / Hallazgos" },
    sectionField("09 / Hallazgos", "hallazgos", "Hallazgos y subsanación", "juridicaRows"),
    { ...choice("resultado", "Resultado jurídico", [{ value: "factible", label: "Factible para esta etapa" }, { value: "condiciones", label: "Factible con condiciones" }, { value: "no_factible_temporal", label: "No factible temporalmente" }, { value: "no_recomendable", label: "No recomendable" }, { value: "indeterminada", label: "Indeterminada" }]), section: "10 / Conclusión" },
    sectionField("10 / Conclusión", "conclusion", "Conclusión jurídica y razones determinantes", "long"),
    sectionField("10 / Conclusión", "puedeHacerse", "Qué puede hacerse hoy y qué debe esperar", "long"),
    sectionField("10 / Conclusión", "limitaciones", "Limitaciones y riesgo residual", "long"),
    sectionField("10 / Conclusión", "actualizar", "Hecho o fecha para actualizar", "long"),
    sectionField("11 / Decisión por etapa", "etapas", "Decisión por etapa", "juridicaRows"),
    sectionField("12 / Control de cierre", "cierre", "Condiciones de cierre", "juridicaRows"),
    sectionField("12 / Control de cierre", "cambioOperacion", "Cancelación o cambio de operación y versión", "long"),
    sectionField("12 / Control de cierre", "pendientes", "Pendientes, responsable y próxima revisión", "long"),
    sectionField("12 / Control de cierre", "abogado", "Nombre completo del abogado responsable"),
    sectionField("12 / Control de cierre", "cedula", "Cédula profesional"),
    sectionField("12 / Control de cierre", "fechaRevision", "Fecha de revisión", "date"),
    sectionField("12 / Control de cierre", "integrador", "Quién integró la captura y fecha"),
  ], true),
  f("06", "Opinion_juridica_del_inmueble", "docx", 2, [
    sectionField("Referencia de la opinión", "folio", "Identificador de la operación"),
    sectionField("Referencia de la opinión", "fechaEmision", "Fecha de emisión", "date"),
    sectionField("Referencia de la opinión", "destinatario", "Destinatario"),
    sectionField("Referencia de la opinión", "inmueble", "Domicilio y referencia del inmueble"),
    sectionField("Referencia de la opinión", "operacion", "Operación y etapa examinadas"),
    sectionField("01 / Conclusión ejecutiva", "conclusion", "Conclusión ejecutiva", "long"),
    sectionField("01 / Conclusión ejecutiva", "sustento", "Evidencia y fundamento de la conclusión", "long"),
    sectionField("02 / Objeto y alcance", "objeto", "Objeto del encargo", "long"),
    sectionField("02 / Objeto y alcance", "alcance", "Alcance de la revisión", "long"),
    sectionField("03 / Antecedentes y documentación", "antecedentes", "Antecedentes relevantes", "long"),
    sectionField("03 / Antecedentes y documentación", "documentos", "Documentación examinada y localizadores", "long"),
    sectionField("04 / Análisis jurídico", "titularidad", "Titularidad y facultades para disponer", "long"),
    sectionField("04 / Análisis jurídico", "registro", "Situación registral e identidad del inmueble", "long"),
    sectionField("04 / Análisis jurídico", "impedimentos", "Impedimentos y condiciones de la operación", "long"),
    sectionField("05 / Recomendaciones", "recomendaciones", "Recomendaciones y próximos pasos", "long"),
    sectionField("05 / Recomendaciones", "responsables", "Responsables y acciones pendientes", "long"),
    sectionField("06 / Límites y actualización", "limites", "Límites de la opinión", "long"),
    sectionField("06 / Límites y actualización", "actualizacion", "Hechos y momento para actualizar la opinión", "long"),
    sectionField("Emisión de la opinión", "abogado", "Nombre completo del abogado responsable"),
    sectionField("Emisión de la opinión", "cedula", "Cédula profesional"),
  ], true),
  f("07", "Opinion_de_valor_comercial", "xlsx", 2, valorFields, true),
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
  f("09", "Contrato_de_intermediacion_inmobiliaria_para_venta", "docx", 3, intermediacionFields),
  f("10", "Plan_de_comercializacion", "docx", 3, [
    folio, inmueble, propietario, asesor, field("contactoAsesor", "Contacto del asesor"), fecha,
    choice("operacion", "Operación", [{ value: "venta", label: "Venta" }, { value: "renta", label: "Renta" }]),
    field("modalidadEncargo", "Modalidad del encargo"),
    field("valorReferencia07", "Valor de referencia 07", "money"), field("referencia07", "Referencia y fecha de la opinión 07"),
    field("precioSalida", "Precio de salida autorizado", "money"), moneda,
    field("baseFiscal", "Base fiscal y alcance del precio"), field("autorizacionPrecio", "Soporte de autorización del precio"),
    field("decisionPrecio", "Siguiente decisión de precio"), field("justificacionDiferencia", "Justificación de diferencia entre valor y precio", "long"),
    field("objetivo", "Objetivo del propietario", "long"), field("estrategia", "Estrategia propuesta", "long"),
    field("periodo", "Primer periodo de trabajo"), field("fechaRevision", "Fecha de revisión", "date"),
    field("condicionesLanzamiento", "Condiciones para lanzar", "long"),
    field("diferenciador", "Fortaleza comprobable", "long"), field("objecionRespuesta", "Objeción y respuesta sustentada", "long"),
    field("competencia", "Competencia y referencia del 07", "long"), field("pendientesCampana", "Pendientes que limitan la campaña", "long"),
    field("atributos", "Atributos, evidencia y mensaje", "planRows"),
    field("publicoPrimario", "Público prioritario: uso, presupuesto, zona y plazo", "long"),
    field("publicoSecundario", "Público secundario o no aplica", "long"),
    field("mensajePrueba", "Mensaje a probar", "long"), field("evidenciaValidacion", "Evidencia para validar el público", "long"),
    field("fechaLanzamiento", "Fecha prevista de lanzamiento", "date"), field("aprobadorContenido", "Responsable de aprobar contenidos"),
    field("preparacion", "Trabajos previos: acción, responsable y fecha", "long"),
    field("hitos", "Preparación y calendario", "planRows"), field("piezas", "Materiales de difusión", "planRows"),
    field("contactoPublico", "Contacto público autorizado"), field("ubicacionPublicable", "Ubicación que puede difundirse"),
    field("colaboracion", "Referidos y colaboración autorizados", "long"), field("canales", "Canales y piezas seleccionados", "planRows"),
    field("corte7", "Corte del día 7", "date"), field("corte14", "Corte del día 14", "date"), field("corte21", "Corte del día 21", "date"),
    choice("estadoPublicidad", "Estado de la publicidad pagada", [
      { value: "no_contratada", label: "No contratada" }, { value: "contratada", label: "Contratada con autorización" },
    ]),
    field("extras", "Publicidad pagada y extras", "planRows", false), field("unidadesFases", "Unidades y fases o no aplica", "long"),
    field("mediosAtencion", "Medios para atender consultas"), field("tiempoRespuesta", "Tiempo de respuesta y horario"),
    field("horariosVisita", "Horarios y condiciones de visita"), field("responsableAcceso", "Responsable de acceso"),
    field("formasPago", "Formas de pago a evaluar y condiciones", "long"),
    field("documentosRestringidos", "Documentación de acceso restringido", "long"), field("custodioDocumentos", "Custodio de documentos"),
    field("medioReporte", "Medio de entrega del reporte 11"), field("frecuencia09", "Frecuencia pactada en el 09"),
    field("proximoCorte", "Próximo corte", "date"), field("destinatarioReporte", "Destinatario del reporte"),
    field("criterioRevision", "Criterio acordado para revisar la estrategia", "long"),
    field("decisiones", "Decisiones para iniciar", "planRows"),
    choice("estadoAprobacion", "Estado de aceptación del plan", [
      { value: "pendiente", label: "Pendiente de aceptación expresa" }, { value: "registrada", label: "Aceptación registrada" },
    ]),
    field("nombreAprobador", "Propietario o representante que aceptó", "text", false),
    field("fechaAprobacion", "Fecha de aceptación", "date", false),
    field("acuseAprobacion", "Firma o referencia del acuse", "text", false),
    field("siguienteAccion", "Siguiente acción"), field("responsableSiguiente", "Responsable de la siguiente acción"),
    field("fechaSiguiente", "Fecha de la siguiente acción", "date"),
  ], true),
  f("11", "Reporte_de_comercializacion_al_propietario", "docx", 3, [
    folio, field("numeroReporte", "Número de reporte"), inmueble, propietario,
    field("periodoInicio", "Inicio del periodo informado", "date"), field("periodoFin", "Fin del periodo informado", "date"),
    asesor, field("contactoAsesor", "Contacto del asesor"), field("fechaEmision", "Fecha de emisión", "date"),
    field("estadoReporte", "Estado del reporte"), field("precioVigente", "Precio vigente", "money"), moneda,
    field("baseFiscal", "Base fiscal y alcance del precio"), field("fechaPrecio", "Fecha del precio", "date"),
    field("soportePrecio", "Soporte del precio"), field("primeraPublicacion", "Primera publicación", "date"),
    field("diasActivos", "Días activos en el mercado", "number"), field("pausasPeriodo", "Pausas del periodo o ninguna", "long"),
    field("operacionEstado", "Operación y estado"), field("versionPlan", "Versión del plan 10"),
    field("reportePrevio", "Reporte previo o ninguno"), field("resumen", "Resumen y resultado principal", "long"),
    field("cambios", "Cambios de precio o estado y autorizaciones o ninguno", "long"),
    choice("contactosEstado", "Estado del registro de contactos nuevos", [{ value: "comprobado", label: "Comprobado" }, { value: "pendiente", label: "Pendiente de registro" }]),
    field("contactos", "Contactos nuevos", "number", false),
    choice("visitasEstado", "Estado del registro de visitas realizadas", [{ value: "comprobado", label: "Comprobado" }, { value: "pendiente", label: "Pendiente de registro" }]),
    field("visitas", "Visitas realizadas", "number", false),
    choice("ofertasEstado", "Estado del registro de ofertas nuevas", [{ value: "comprobado", label: "Comprobado" }, { value: "pendiente", label: "Pendiente de registro" }]),
    field("ofertas", "Ofertas recibidas", "number", false),
    field("comparacion", "Avance respecto al periodo anterior y límites", "long"),
    field("canales", "Canales y actividad", "reporteRows"),
    field("comentarios", "Comentarios de interesados y frecuencia", "long"),
    field("interpretacion", "Interpretación sustentada y límites", "long"),
    field("respuestaPropuesta", "Respuesta comercial propuesta", "long"),
    choice("registroVisitas", "Estado del registro detallado de citas", [{ value: "comprobado", label: "Comprobado" }, { value: "pendiente", label: "Pendiente de registro" }]),
    field("agendadas", "Visitas agendadas", "number", false), field("realizadas", "Visitas realizadas de las citas", "number", false),
    field("canceladas", "Visitas canceladas", "number", false), field("reprogramadas", "Visitas reprogramadas", "number", false),
    field("pendientes", "Visitas pendientes al corte", "number", false),
    field("ofertasActualizadas", "Ofertas actualizadas o retiradas o ninguna", "long"),
    field("oportunidades", "Oportunidades en seguimiento", "reporteRows", false),
    choice("publicidadEstado", "Estado de publicidad pagada", [{ value: "no_contratada", label: "No contratada" }, { value: "contratada", label: "Contratada" }]),
    choice("monedaPublicidad", "Moneda de publicidad", [{ value: "MXN", label: "MXN" }, { value: "USD", label: "USD" }], false),
    field("publicidad", "Publicidad pagada", "reporteRows", false),
    field("saldoInicial", "Saldo inicial de fondos", "money", false), field("fondosRecibidos", "Fondos recibidos", "money", false),
    field("fondosAplicados", "Fondos aplicados", "money", false), field("fondosDevueltos", "Fondos devueltos", "money", false),
    field("pagosDirectos", "Pagos directos al portal", "money", false),
    field("soporteSaldo", "Soporte y destino del saldo", "long", false),
    field("acciones", "Acciones del siguiente periodo", "reporteRows"),
    field("decisionSolicitada", "Decisión solicitada al propietario", "long"),
    field("motivoDecision", "Motivo de la decisión", "long"), field("alcanceDecision", "Alcance de la decisión", "long"),
    field("fechaLimiteDecision", "Fecha límite para la decisión", "date"),
    choice("estadoRespuestaPropietario", "Estado de respuesta del propietario", [{ value: "pendiente", label: "Pendiente" }, { value: "recibida", label: "Recibida" }]),
    field("constanciaRespuesta", "Constancia de respuesta del propietario", "long", false),
    field("proximoReporte", "Fecha del próximo reporte", "date"), field("medioProximoReporte", "Medio del próximo reporte"),
    field("elaborador", "Elaboró"), field("revisor", "Revisó"), field("soportes", "Documentos de respaldo", "long"),
    choice("entregaInformeEstado", "Estado de entrega del informe", [{ value: "pendiente", label: "Pendiente" }, { value: "entregado", label: "Entregado" }]),
    field("fechaEntregaInforme", "Fecha de entrega del informe", "date", false),
    field("medioEntregaInforme", "Medio de entrega del informe", "text", false),
    field("acuseInforme", "Acuse de entrega", "text", false),
  ], true),
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
  f("15", "Promesa_de_compraventa", "docx", 4, promesaFields, true),
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
    if (id === "07" && !mostrarCampoValor(item.key, data)) return false;
    if (id === "15" && !mostrarCampoPromesa(item.key, data)) return false;
    if (id === "09" && !mostrarCampoIntermediacion(item.key, data)) return false;
    if (item.type === "valorRows" || item.type === "promesaRows" || item.type === "intermediacionRows") return false;
    if (item.type === "partidas" || item.type === "pagos" || item.type === "netoCargos" || item.type === "entregaRows" || item.type === "planRows" || item.type === "reporteRows" || item.type === "entrevistaRows" || item.type === "juridicaRows" || item.type === "levantamientoRows") return false;
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
  if (id === "10") errors.push(...validarPlan(data));
  if (id === "11") errors.push(...validarReporte(data));
  if (id === "02") errors.push(...validarEntrevista(data));
  if (id === "01") errors.push(...validarAviso(data));
  if (id === "05") errors.push(...validarJuridica(data));
  if (isLevantamiento(id)) errors.push(...validarLevantamiento(id, data));
  if (id === "07") errors.push(...validarValor(data));
  if (id === "15") errors.push(...validarPromesa(data));
  if (id === "09") errors.push(...validarIntermediacion(data));
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
