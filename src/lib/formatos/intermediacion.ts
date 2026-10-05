import type { FormatoField } from "./catalog";
import Decimal from "decimal.js";

const field = (section: string, key: string, label: string, type: FormatoField["type"] = "text", required = true): FormatoField => ({ section, key, label, type, required });
const choice = (section: string, key: string, label: string, options: string[][]): FormatoField => ({ ...field(section, key, label, "choice"), options: options.map(([value, label]) => ({ value, label })) });
const s = ["01 / Partes y facultades", "02 / Licencia y modelos", "03 / Inmueble y encargo", "04 / Precio, comisión y pena", "05 / Prospectos y anexos", "06 / Privacidad y firma"];
export const intermediacionFields: FormatoField[] = [
  field(s[0], "folio", "Folio del expediente"), field(s[0], "clientesContrato", "Clientes del contrato y firmantes", "intermediacionRows"),
  field(s[0], "prestador", "Nombre o razón social del prestador"), field(s[0], "rfcPrestador", "RFC del prestador"), choice(s[0], "comparecePrestador", "Comparecencia del prestador", [["propia", "Por propio derecho"], ["representante", "Por representante"]]),
  field(s[0], "representantePrestador", "Representante del prestador"), field(s[0], "calidadRepresentante", "Calidad del representante"), field(s[0], "facultadesPrestador", "Documento y facultades del representante", "long"),
  field(s[0], "domicilioPrestador", "Domicilio del prestador", "long"), field(s[0], "correoPrestador", "Correo del prestador"), field(s[0], "telefonoPrestador", "Teléfono del prestador"), field(s[0], "firmantePrestador", "Firmante por el prestador"), field(s[0], "calidadFirmaPrestador", "Calidad de la firma por el prestador"),
  choice(s[1], "licenciaEstado", "Estado de la licencia estatal", [["vigente", "Vigente con soporte"], ["pendiente", "Pendiente de comprobar"], ["no_aplica", "No aplica, con fundamento"]]), field(s[1], "licenciaNumero", "Número de licencia estatal"), field(s[1], "licenciaVigencia", "Fin de vigencia de la licencia", "date"), field(s[1], "licenciaSoporte", "Soporte o fundamento de la licencia", "long"),
  choice(s[1], "modeloEstatalEstado", "Estado del modelo estatal", [["aprobado", "Aprobado con copia"], ["pendiente", "Pendiente de cotejo"], ["no_aplica", "No aplica, con fundamento"]]), field(s[1], "modeloEstatalReferencia", "Datos de aprobación o fundamento del modelo estatal", "long"), field(s[1], "modeloEstatalCopia", "Referencia y versión de la copia estatal", "long"),
  choice(s[1], "profecoEstado", "Estado del registro PROFECO", [["no_registrado", "No registrado"], ["registrado", "Registro informado, pendiente de cotejo del modelo"], ["no_aplica", "No aplica, requiere revisión del supuesto"]]), field(s[1], "profecoNumero", "Número de registro informado"), field(s[1], "profecoFecha", "Fecha del registro informado", "date"), field(s[1], "profecoCopia", "Referencia de la copia registrada", "long"), field(s[1], "profecoFundamento", "Fundamento de no aplicación del registro", "long"),
  field(s[2], "inmueble", "Domicilio del inmueble", "long"), field(s[2], "idInmueble", "Identificador del inmueble"), field(s[2], "tipoInmueble", "Tipo de inmueble"), field(s[2], "destino", "Destino del inmueble"), field(s[2], "titulo", "Título"), field(s[2], "folioReal", "Folio real"), field(s[2], "claveCatastral", "Clave catastral"), field(s[2], "derecho", "Derecho objeto del encargo", "long"), field(s[2], "superficie", "Superficie y concepto según soporte"), field(s[2], "accesorios", "Accesorios incluidos o ninguno", "long"),
  field(s[2], "gravamenes", "Gravámenes o ausencia declarada", "long"), field(s[2], "ocupacion", "Ocupación informada", "long"), field(s[2], "restricciones", "Restricciones informadas o ninguna", "long"), field(s[2], "condicionesEncargo", "Condiciones del encargo", "long"),
  choice(s[2], "modalidad", "Modalidad del encargo", [["exclusiva", "Exclusiva"], ["no_exclusiva", "No exclusiva"]]), field(s[2], "inicio", "Inicio de vigencia", "date"), field(s[2], "fin", "Fin de vigencia, sin renovación automática", "date"),
  field(s[3], "precioAutorizado", "Precio total autorizado en MXN", "money"), field(s[3], "ivaVenta", "IVA de venta incluido en el precio, o cero", "money"), field(s[3], "ivaVentaFuente", "Validación fiscal del IVA de venta", "long"),
  field(s[3], "comisionPorcentaje", "Porcentaje de comisión sobre precio sin IVA de venta", "number"), field(s[3], "ivaComisionTasa", "Tasa de IVA de la comisión en porcentaje", "number"), field(s[3], "ivaComisionFuente", "Tratamiento fiscal de la comisión y soporte", "long"),
  field(s[3], "penaMaxima", "Máximo recíproco de pena en MXN", "money"), field(s[3], "presupuestoPena", "Referencia del presupuesto de inversión y servicios"), field(s[3], "fechaPresupuestoPena", "Fecha del presupuesto de inversión y servicios", "date"),
  field(s[4], "proteccionDias", "Días naturales de protección posterior, cero si no se pacta", "number"), choice(s[4], "excepcionesEstado", "Excepciones previas de prospectos", [["ninguna", "Ninguna"], ["registradas", "Registradas"]]), field(s[4], "excepcionesProspectos", "Excepciones previas identificadas", "intermediacionRows"),
  choice(s[4], "anexosEstado", "Anexos incorporados al contrato", [["ninguno", "Ninguno"], ["registrados", "Registrados"]]), field(s[4], "anexosContrato", "Anexos del contrato", "intermediacionRows"),
  field(s[5], "medioAvisoPrivacidad", "Medio donde se puso a disposición el aviso de privacidad"), field(s[5], "fechaAvisoPrivacidad", "Fecha de puesta a disposición del aviso", "date"), field(s[5], "referenciaAvisoPrivacidad", "Referencia y versión del aviso de privacidad 01"), field(s[5], "lugar", "Municipio de firma en Baja California"), field(s[5], "fecha", "Fecha de firma prevista", "date"),
];

export const INTERMEDIACION_TABLES = {
  clientesContrato: { label: "cliente del contrato", columns: [{ key: "nombre", label: "Nombre o razón social" }, { key: "rfc", label: "RFC" }, { key: "identificacion", label: "Identificación" }, { key: "derechoFacultad", label: "Titularidad o facultad" }, { key: "comparecencia", label: "Comparece por propio derecho o representante" }, { key: "representante", label: "Representante o no aplica" }, { key: "calidadRepresentante", label: "Calidad del representante o no aplica" }, { key: "facultades", label: "Documento de facultades o fundamento de no aplicación" }, { key: "domicilio", label: "Domicilio" }, { key: "correo", label: "Correo" }, { key: "telefono", label: "Teléfono" }, { key: "firmante", label: "Nombre del firmante" }, { key: "calidadFirma", label: "Calidad del firmante" }] },
  excepcionesProspectos: { label: "excepción de prospecto", columns: [{ key: "persona", label: "Persona exceptuada" }, { key: "referencia", label: "Referencia para identificarla y alcance de la excepción" }] },
  anexosContrato: { label: "anexo del contrato", columns: [{ key: "documento", label: "Documento" }, { key: "fecha", label: "Fecha del anexo" }, { key: "version", label: "Versión" }, { key: "referencia", label: "Referencia de la copia que se incorporará" }] },
} as const;
export type IntermediacionTable = keyof typeof INTERMEDIACION_TABLES;
export type IntermediacionRow = Record<string, string>;

export function mostrarCampoIntermediacion(key: string, data: Record<string, unknown>): boolean {
  if (["representantePrestador", "calidadRepresentante", "facultadesPrestador"].includes(key)) return data.comparecePrestador === "representante";
  if (["licenciaNumero", "licenciaVigencia"].includes(key)) return data.licenciaEstado === "vigente";
  if (key === "modeloEstatalCopia") return data.modeloEstatalEstado === "aprobado";
  if (["profecoNumero", "profecoFecha", "profecoCopia"].includes(key)) return data.profecoEstado === "registrado";
  if (key === "profecoFundamento") return data.profecoEstado === "no_aplica";
  if (key === "excepcionesProspectos") return data.excepcionesEstado === "registradas";
  if (key === "anexosContrato") return data.anexosEstado === "registrados";
  return true;
}

const cash = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 999999999999.99 && new Decimal(value).decimalPlaces() <= 2;
const percentage = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
const date = (value: unknown): value is string => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime()) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;

export function calcularIntermediacion(data: Record<string, unknown>) {
  const errors: string[] = [];
  for (const [key, label] of [["precioAutorizado", "Precio autorizado"], ["ivaVenta", "IVA de venta"], ["penaMaxima", "Máximo de pena"]]) if (!cash(data[key]) || key === "precioAutorizado" && data[key] === 0) errors.push(label);
  for (const [key, label] of [["comisionPorcentaje", "Porcentaje de comisión"], ["ivaComisionTasa", "Tasa de IVA de comisión"]]) if (!percentage(data[key])) errors.push(label);
  if (cash(data.precioAutorizado) && cash(data.ivaVenta) && data.ivaVenta >= data.precioAutorizado) errors.push("El IVA de venta debe ser menor que el precio total");
  if (errors.length) return { errors, basePrecio: null, comision: null, ivaComision: null, total: null, basePena: null };
  const basePrecio = new Decimal(data.precioAutorizado as number).minus(data.ivaVenta as number);
  const comision = basePrecio.mul(data.comisionPorcentaje as number).div(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const ivaComision = comision.mul(data.ivaComisionTasa as number).div(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  return { errors, basePrecio: basePrecio.toNumber(), comision: comision.toNumber(), ivaComision: ivaComision.toNumber(), total: comision.add(ivaComision).toNumber(), basePena: Decimal.min(data.penaMaxima as number, comision).toNumber() };
}

/** Aritmética de la cláusula novena, para revisión; no determina si jurídicamente procede cobrar. */
export function calcularPenaIntermediacion(data: Record<string, unknown>, termination: string, debtor: string, paid: number) {
  const base = calcularIntermediacion(data); const errors = [...base.errors];
  if (!date(data.inicio) || !date(data.fin) || data.fin < data.inicio) errors.push("Vigencia válida con inicio y fin");
  if (!date(termination) || !date(data.inicio) || !date(data.fin) || termination < data.inicio || termination > data.fin) errors.push("La terminación efectiva debe estar dentro de la vigencia");
  if (!["cliente", "prestador"].includes(debtor) || !cash(paid)) errors.push("Deudor y pagos abonables válidos");
  if (errors.length) return { errors, diasVigencia: null, diasPendientes: null, penaAntesAbonos: null, abono: null, estimacion: null };
  const utc = (value: string) => new Date(`${value}T00:00:00Z`).getTime();
  const diasVigencia = (utc(data.fin as string) - utc(data.inicio as string)) / 86400000 + 1;
  const diasPendientes = (utc(data.fin as string) - utc(termination)) / 86400000;
  const pena = new Decimal(base.basePena!).mul(diasPendientes).div(diasVigencia).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const abono = debtor === "cliente" ? Decimal.min(pena, paid) : new Decimal(0);
  return { errors, diasVigencia, diasPendientes, penaAntesAbonos: pena.toNumber(), abono: abono.toNumber(), estimacion: pena.minus(abono).toNumber() };
}

export function validarIntermediacion(data: Record<string, unknown>): string[] {
  const errors = [...calcularIntermediacion(data).errors];
  const filled = (value: unknown) => typeof value === "string" && value.trim().length > 0;
  for (const [key, config] of Object.entries(INTERMEDIACION_TABLES)) {
    const entries = data[key] ?? [];
    const required = key === "clientesContrato" || key === "excepcionesProspectos" && data.excepcionesEstado === "registradas" || key === "anexosContrato" && data.anexosEstado === "registrados";
    if (!Array.isArray(entries) || entries.length > 30 || required && entries.length === 0 || !required && entries.length > 0) { errors.push(config.label); continue; }
    for (const row of entries) {
      if (!row || typeof row !== "object" || Array.isArray(row) || config.columns.some((column) => !filled(row[column.key]))) { errors.push(`${config.label}: fila incompleta`); continue; }
      if (key === "clientesContrato" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.correo)) errors.push("Correo de cada cliente");
      if (key === "anexosContrato" && !date(row.fecha)) errors.push("Fecha de cada anexo");
    }
    if (key === "clientesContrato" && new Set(entries.map((row) => `${String(row?.nombre ?? "").trim().toLowerCase()}|${String(row?.rfc ?? "").trim().toUpperCase()}`)).size !== entries.length) errors.push("Cliente duplicado en el contrato");
    if (key === "anexosContrato" && date(data.fecha) && entries.some((row) => date(row?.fecha) && row.fecha > String(data.fecha))) errors.push("Aviso de privacidad o anexos posteriores a la firma prevista");
  }
  if (date(data.fecha) && date(data.fechaAvisoPrivacidad) && data.fechaAvisoPrivacidad > data.fecha) errors.push("Aviso de privacidad o anexos posteriores a la firma prevista");
  if (!date(data.inicio) || !date(data.fin) || data.fin < data.inicio) errors.push("Vigencia válida con inicio y fin");
  if (!Number.isSafeInteger(data.proteccionDias) || (data.proteccionDias as number) < 0) errors.push("Protección posterior en días naturales enteros");
  if (data.licenciaEstado === "vigente" && date(data.licenciaVigencia) && date(data.fin) && data.licenciaVigencia < data.fin) errors.push("Revisar vigencia de licencia durante el encargo");
  return [...new Set(errors)];
}
