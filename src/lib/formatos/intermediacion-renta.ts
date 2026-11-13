import Decimal from "decimal.js";
import type { FormatoField } from "./catalog";
import { validarTablasIntermediacion } from "./intermediacion";

/*
  21 · Contrato de intermediación inmobiliaria para renta. El titular aprobó el 13/11/2026 el
  texto que redactó el agente (borrador en tmp/contratos), con la forma del 09: condiciones
  particulares en una tabla y después las cláusulas. Usa las mismas tablas del 09 (clientes,
  excepciones de prospectos y anexos) y los mismos datos del prestador. Fortius no recibe rentas,
  depósitos ni garantías; los honorarios son por resultado. No cita artículos de ley; antes de
  firmarlo con clientes lo revisa el abogado (regla de formatos de AGENTS.md).
*/

const field = (section: string, key: string, label: string, type: FormatoField["type"] = "text", required = true): FormatoField => ({ section, key, label, type, required });
const choice = (section: string, key: string, label: string, options: string[][]): FormatoField => ({ ...field(section, key, label, "choice"), options: options.map(([value, label]) => ({ value, label })) });
const SI_NO = [["no", "No"], ["si", "Sí"]];
const s = ["01 / Partes", "02 / Inmueble", "03 / Condiciones de renta", "04 / Encargo y honorarios", "05 / Prospectos y anexos", "06 / Privacidad y firma"];

export const intermediacionRentaFields: FormatoField[] = [
  field(s[0], "folio", "Folio del expediente"), field(s[0], "clientesContrato", "Clientes del contrato y firmantes", "intermediacionRows"),
  field(s[0], "prestador", "Nombre o razón social del prestador"), field(s[0], "rfcPrestador", "RFC del prestador"), choice(s[0], "comparecePrestador", "Comparecencia del prestador", [["propia", "Por propio derecho"], ["representante", "Por representante"]]),
  field(s[0], "representantePrestador", "Representante del prestador"), field(s[0], "calidadRepresentante", "Calidad del representante"), field(s[0], "facultadesPrestador", "Documento y facultades del representante", "long"),
  field(s[0], "domicilioPrestador", "Domicilio del prestador", "long"), field(s[0], "correoPrestador", "Correo del prestador"), field(s[0], "telefonoPrestador", "Teléfono del prestador"), field(s[0], "firmantePrestador", "Firmante por el prestador"), field(s[0], "calidadFirmaPrestador", "Calidad de la firma por el prestador"),

  field(s[1], "inmueble", "Domicilio del inmueble", "long"), field(s[1], "idInmueble", "Identificador del inmueble"), field(s[1], "claveCatastral", "Clave catastral"),
  field(s[1], "tipoInmueble", "Tipo de inmueble"), field(s[1], "superficie", "Superficie y concepto según soporte"), field(s[1], "accesorios", "Lo que se renta con el inmueble (estacionamiento, bodega, muebles) o «ninguno»", "long"),
  field(s[1], "derecho", "Carácter del cliente (propietario, copropietario, apoderado, usufructuario o administrador) y documento", "long"),
  field(s[1], "ocupacion", "Ocupación actual", "long"), field(s[1], "condominioReglamento", "Condominio y reglamento, o «no aplica»", "long"), field(s[1], "restricciones", "Restricciones o adeudos informados, o «ninguno»", "long"),

  choice(s[2], "uso", "Uso del inmueble", [["habitacion", "Casa habitación"], ["comercial", "Comercial u oficina"]]), field(s[2], "giro", "Giro o actividad permitida", "long"),
  field(s[2], "rentaAutorizada", "Renta mensual autorizada en MXN, sin IVA", "money"), choice(s[2], "causaIva", "¿La renta causa IVA?", SI_NO),
  field(s[2], "mesesDeposito", "Meses de renta de depósito", "number"),
  choice(s[2], "garantia", "Garantía que se pedirá", [["fiador", "Fiador"], ["obligado", "Obligado solidario"], ["ninguna", "Solo el depósito"]]),
  field(s[2], "plazoMinimo", "Plazo mínimo del arrendamiento en meses (plazo forzoso)", "number"), choice(s[2], "mascotas", "¿Se permiten mascotas?", SI_NO),

  choice(s[3], "modalidad", "Modalidad del encargo", [["exclusiva", "Exclusiva"], ["no_exclusiva", "No exclusiva"]]), field(s[3], "inicio", "Inicio de vigencia", "date"), field(s[3], "fin", "Fin de vigencia, sin renovación automática", "date"),
  choice(s[3], "honorariosModo", "Honorarios", [["meses", "Meses de renta"], ["porcentaje", "Porcentaje de la renta del plazo forzoso"]]),
  field(s[3], "mesesHonorarios", "Meses de renta de honorarios", "number"), field(s[3], "porcentajeHonorarios", "Porcentaje de la renta total del plazo forzoso", "number"),
  field(s[3], "ivaHonorariosTasa", "Tasa de IVA de los honorarios en porcentaje", "number"),
  choice(s[3], "renovacion", "Renovación con el mismo arrendatario", [["sin", "Sin honorarios"], ["con", "Con honorarios"]]), field(s[3], "porcentajeRenovacion", "Porcentaje de una renta mensual por cada renovación", "number"),
  field(s[3], "penaMaxima", "Máximo recíproco de pena en MXN", "money"),

  field(s[4], "proteccionDias", "Días naturales de protección posterior, cero si no se pacta", "number"), choice(s[4], "excepcionesEstado", "Excepciones previas de prospectos", [["ninguna", "Ninguna"], ["registradas", "Registradas"]]), field(s[4], "excepcionesProspectos", "Excepciones previas identificadas", "intermediacionRows"),
  choice(s[4], "anexosEstado", "Anexos incorporados al contrato", [["ninguno", "Ninguno"], ["registrados", "Registrados"]]), field(s[4], "anexosContrato", "Anexos del contrato", "intermediacionRows"),

  field(s[5], "medioAvisoPrivacidad", "Medio donde se puso a disposición el aviso de privacidad"), field(s[5], "fechaAvisoPrivacidad", "Fecha de puesta a disposición del aviso", "date"),
  field(s[5], "ciudad", "Ciudad de los tribunales"), field(s[5], "lugar", "Municipio de firma en Baja California"), field(s[5], "fecha", "Fecha de firma prevista", "date"),
];

/** Campos que solo aplican según lo elegido. */
export function mostrarCampoIntermediacionRenta(key: string, d: Record<string, unknown>): boolean {
  if (["representantePrestador", "calidadRepresentante", "facultadesPrestador"].includes(key)) return d.comparecePrestador === "representante";
  if (key === "giro") return d.uso === "comercial";
  if (key === "mesesHonorarios") return d.honorariosModo !== "porcentaje";
  if (key === "porcentajeHonorarios") return d.honorariosModo === "porcentaje";
  if (key === "porcentajeRenovacion") return d.renovacion === "con";
  if (key === "excepcionesProspectos") return d.excepcionesEstado === "registradas";
  if (key === "anexosContrato") return d.anexosEstado === "registrados";
  return true;
}

const numero = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;
const vacio = (value: unknown) => value === undefined || value === null || value === "";
const fechaValida = (value: unknown): value is string => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime()) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;

/**
  Honorarios estimados a la renta autorizada: meses de renta, o el porcentaje de la renta de todo
  el plazo forzoso. La pena es el menor entre el máximo pactado y esos honorarios sin IVA (cláusula novena).
*/
export function calcularIntermediacionRenta(d: Record<string, unknown>) {
  const nada = { honorarios: null, ivaHonorarios: null, total: null, basePena: null } as const;
  if (!numero(d.rentaAutorizada) || !numero(d.ivaHonorariosTasa)) return nada;
  let base: Decimal;
  if (d.honorariosModo === "porcentaje") {
    if (!numero(d.porcentajeHonorarios) || !numero(d.plazoMinimo)) return nada;
    base = new Decimal(d.rentaAutorizada).mul(d.plazoMinimo).mul(d.porcentajeHonorarios).div(100);
  } else if (d.honorariosModo === "meses") {
    if (!numero(d.mesesHonorarios)) return nada;
    base = new Decimal(d.rentaAutorizada).mul(d.mesesHonorarios);
  } else return nada;
  const honorarios = base.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const ivaHonorarios = honorarios.mul(d.ivaHonorariosTasa).div(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  return { honorarios: honorarios.toNumber(), ivaHonorarios: ivaHonorarios.toNumber(), total: honorarios.add(ivaHonorarios).toNumber(), basePena: numero(d.penaMaxima) ? Decimal.min(d.penaMaxima, honorarios).toNumber() : null };
}

/** Reglas de congruencia; un dato vacío lo reporta el catálogo como faltante, aquí solo se revisa lo capturado. */
export function validarIntermediacionRenta(d: Record<string, unknown>): string[] {
  const errors = validarTablasIntermediacion(d);
  if (d.rentaAutorizada === 0) errors.push("Renta autorizada mayor que cero");
  for (const [key, label] of [["porcentajeHonorarios", "Porcentaje de honorarios"], ["ivaHonorariosTasa", "Tasa de IVA de los honorarios"], ["porcentajeRenovacion", "Porcentaje por renovación"]] as const)
    if (!vacio(d[key]) && (typeof d[key] !== "number" || d[key] > 100)) errors.push(`${label} entre 0 y 100`);
  for (const [key, label, min] of [["mesesDeposito", "Meses de depósito", 0], ["plazoMinimo", "Plazo mínimo", 1], ["proteccionDias", "Protección posterior en días naturales", 0]] as const)
    if (!vacio(d[key]) && (!Number.isSafeInteger(d[key]) || (d[key] as number) < min)) errors.push(`${label} en número entero`);
  if (!vacio(d.mesesHonorarios) && (typeof d.mesesHonorarios !== "number" || d.mesesHonorarios <= 0 || d.mesesHonorarios > 12)) errors.push("Meses de honorarios mayores que cero y hasta 12");
  if (fechaValida(d.inicio) && fechaValida(d.fin) && d.fin < d.inicio) errors.push("Vigencia válida con inicio y fin");
  if (fechaValida(d.fecha) && fechaValida(d.fechaAvisoPrivacidad) && d.fechaAvisoPrivacidad > d.fecha) errors.push("Aviso de privacidad o anexos posteriores a la firma prevista");
  if (typeof d.correoPrestador === "string" && d.correoPrestador.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.correoPrestador.trim())) errors.push("Correo del prestador");
  return [...new Set(errors)];
}
