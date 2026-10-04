export type FormatoField = {
  key: string;
  label: string;
  type: "text" | "date" | "money" | "number" | "long";
  required: boolean;
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
const f = (id: string, title: string, extension: "docx" | "xlsx", phase: FormatoDefinition["phase"], fields: FormatoField[], readyForEmission = false): FormatoDefinition => ({ id, title: title.replaceAll("_", " "), source: `${id}.${title}.${extension}`, phase, fields, readyForEmission });
const inmueble = field("inmueble", "Inmueble y domicilio");
const fecha = field("fecha", "Fecha", "date");
const asesor = field("asesor", "Asesor responsable");
const propietario = field("propietario", "Propietario o representante");
const comprador = field("comprador", "Comprador o representante");
const folio = field("folio", "Folio del expediente");
const moneda = field("moneda", "Moneda");
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
  f("08", "Estimacion_del_neto_del_propietario", "xlsx", 2, [folio, fecha, propietario, moneda, field("precioSugerido07", "Precio sugerido por la opinión 07", "money"), field("precioPactado", "Precio pactado", "money"), field("erogaciones", "Erogaciones y fuentes", "long"), field("netoEstimado", "Neto estimado", "money")]),
  f("09", "Contrato_de_intermediacion_inmobiliaria_para_venta", "docx", 3, [fecha, propietario, inmueble, field("prestador", "Prestador y representación"), field("precio", "Precio autorizado", "money"), moneda, field("honorarios", "Honorarios y condiciones", "long"), field("plazo", "Plazo"), field("modalidad", "Modalidad del encargo")]),
  f("10", "Plan_de_comercializacion", "docx", 3, [folio, inmueble, propietario, asesor, fecha, field("objetivo", "Objetivo del propietario", "long"), field("estrategia", "Estrategia", "long"), field("precioSalida", "Precio de salida", "money"), field("periodo", "Periodo de trabajo")]),
  f("11", "Reporte_de_comercializacion_al_propietario", "docx", 3, [folio, inmueble, propietario, asesor, field("periodo", "Periodo informado"), fecha, field("resultados", "Resultados del periodo", "long"), field("siguienteDecision", "Siguiente decisión", "long")]),
  f("12", "Entrevista_y_perfil_del_comprador", "docx", 3, [fecha, asesor, comprador, field("contacto", "Contacto"), field("busqueda", "Inmueble buscado", "long"), field("presupuesto", "Presupuesto", "money"), moneda, field("formaPago", "Forma de pago")]),
  f("13", "Registro_de_visita_y_retroalimentacion", "docx", 3, [fecha, asesor, inmueble, comprador, field("estadoCita", "Estado de la cita"), field("retroalimentacion", "Retroalimentación", "long")]),
  f("14", "Oferta_de_compra_y_respuesta_del_propietario", "docx", 3, [fecha, inmueble, propietario, comprador, field("precioPropuesto", "Precio propuesto", "money"), moneda, field("condiciones", "Pago y condiciones", "long"), field("respuestaPropietario", "Respuesta del propietario", "long")]),
  f("15", "Promesa_de_compraventa", "docx", 4, [fecha, inmueble, propietario, comprador, field("precio", "Precio", "money"), moneda, field("formaPago", "Forma de pago", "long"), field("plazo", "Plazo para escriturar"), field("obligaciones", "Obligaciones y condiciones", "long")]),
  f("16", "Acta_de_entrega_y_recepcion_del_inmueble", "docx", 4, [folio, fecha, inmueble, field("entrega", "Quien entrega"), field("recibe", "Quien recibe"), field("resultado", "Resultado de la entrega"), field("estado", "Estado observado", "long"), field("pendientes", "Pendientes", "long")]),
  f("17", "Cierre_del_expediente", "docx", 4, [folio, fecha, inmueble, field("resultado", "Resultado de la operación"), field("soporte", "Documento de soporte"), field("pendientes", "Pendientes y responsables", "long")]),
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
  f("19", "Presupuesto_de_rehabilitacion", "xlsx", 4, [folio, inmueble, fecha, field("alcance", "Alcance de la rehabilitación", "long"), field("partidas", "Partidas y cantidades", "long"), field("total", "Total presupuestado", "money")]),
];

export function formatoById(id: string): FormatoDefinition {
  const formato = FORMATOS.find((item) => item.id === id);
  if (!formato) throw new Error("Formato desconocido");
  return formato;
}

export function validateFormato(id: string, data: Record<string, unknown>): string[] {
  const errors = formatoById(id).fields.filter((item) => {
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
    return typeof value !== "string";
  }).map((item) => item.label);
  if (id === "18") {
    if (!["total", "parcial"].includes(String(data.pagoParcialTotal))) errors.push("Pago parcial o total");
    if (data.pagoParcialTotal === "total" && data.saldo !== 0) errors.push("Saldo pendiente");
    if (data.pagoParcialTotal === "parcial" && data.saldo !== "por confirmar" && !(typeof data.saldo === "number" && data.saldo > 0)) errors.push("Saldo pendiente");
    if (data.monedaSaldo !== data.moneda) errors.push("Moneda del saldo");
  }
  return [...new Set(errors)];
}
