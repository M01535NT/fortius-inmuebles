import Decimal from "decimal.js";
import type { FormatoField } from "./catalog";
import { FINANCIAL_SOURCES } from "@/data/financial-rules";

/*
  24 · Compraventa a plazos con reserva de dominio (DOC-14, RP-97). El titular aprobó el 13/11/2026
  el texto que redactó el agente: un solo contrato para la venta en que el propietario cobra en
  mensualidades y conserva la propiedad hasta el último pago. Con o sin intereses, con o sin interés
  moratorio, y en escritura pública o en documento privado. No cita artículos de ley; antes de
  firmarlo con clientes lo revisa el abogado (regla de formatos de AGENTS.md).

  En Baja California, la venta de un inmueble que vale más de 10,000 veces la UMA diaria se otorga en
  escritura pública: por encima de ese corte, o con precio en dólares, el documento privado no se
  ofrece y el contrato sale siempre con escritura.
*/

const field = (section: string, key: string, label: string, type: FormatoField["type"] = "text", required = true): FormatoField => ({ section, key, label, type, required });
const choice = (section: string, key: string, label: string, options: string[][]): FormatoField => ({ ...field(section, key, label, "choice"), options: options.map(([value, label]) => ({ value, label })) });
const SI_NO = [["no", "No"], ["si", "Sí"]];
const PERSONA = [["fisica", "Persona física"], ["moral", "Empresa (persona moral)"]];
const s = ["01 / Vendedor", "02 / Comprador", "03 / Inmueble", "04 / Precio y pagos", "05 / Escritura y entrega", "06 / Incumplimiento", "07 / Firma"];

export const UMA_DIARIA = FINANCIAL_SOURCES.uma2026.daily;
/** Corte de la escritura pública: 10,000 veces la UMA diaria vigente, en pesos. */
export const UMBRAL_ESCRITURA = new Decimal(UMA_DIARIA).mul(10000).toNumber();
export const MAX_MENSUALIDADES = 360;

export const compraventaPlazosFields: FormatoField[] = [
  field(s[0], "folio", "Folio del expediente"),
  choice(s[0], "vendedorTipo", "El vendedor es", PERSONA),
  field(s[0], "vendedor", "Nombre o razón social del vendedor"),
  field(s[0], "vendedorNacionalidad", "Nacionalidad del vendedor"),
  field(s[0], "vendedorIdentificacion", "Identificación del vendedor"),
  field(s[0], "vendedorRfc", "RFC del vendedor"),
  field(s[0], "vendedorEstadoCivil", "Estado civil del vendedor"),
  field(s[0], "vendedorActa", "Acta constitutiva del vendedor", "long"),
  field(s[0], "vendedorRepresentante", "Representante del vendedor"),
  field(s[0], "vendedorPoder", "Poder del representante del vendedor", "long"),
  choice(s[0], "consentimientoConyuge", "¿Firma el cónyuge del vendedor?", SI_NO),
  field(s[0], "conyugeVendedor", "Nombre del cónyuge del vendedor"),
  field(s[0], "tituloPropiedad", "Escritura o título de propiedad", "long"),
  field(s[0], "datosRegistrales", "Datos de inscripción en el Registro Público"),
  choice(s[0], "gravamen", "Gravámenes del inmueble", [["libre", "Libre de gravámenes"], ["cancelar", "Tiene un gravamen que se cancelará"]]),
  field(s[0], "certificadoGravamen", "Certificado de libertad de gravamen", "long"),
  field(s[0], "gravamenDescripcion", "Gravamen (por ejemplo, hipoteca inscrita)", "long"),
  field(s[0], "acreedorGravamen", "A favor de quién está el gravamen"),
  field(s[0], "vendedorDomicilio", "Domicilio del vendedor para notificaciones", "long"),
  field(s[0], "vendedorCorreo", "Correo del vendedor"),

  choice(s[1], "compradorTipo", "El comprador es", PERSONA),
  field(s[1], "comprador", "Nombre o razón social del comprador"),
  field(s[1], "compradorNacionalidad", "Nacionalidad del comprador"),
  field(s[1], "compradorIdentificacion", "Identificación del comprador"),
  field(s[1], "compradorRfc", "RFC del comprador"),
  field(s[1], "compradorEstadoCivil", "Estado civil del comprador"),
  field(s[1], "compradorActa", "Acta constitutiva del comprador", "long"),
  field(s[1], "compradorRepresentante", "Representante del comprador"),
  field(s[1], "compradorPoder", "Poder del representante del comprador", "long"),
  choice(s[1], "porCuentaDeOtro", "¿Compra por cuenta de otra persona?", SI_NO),
  field(s[1], "beneficiario", "Persona por cuya cuenta compra"),
  field(s[1], "compradorDomicilio", "Domicilio del comprador para notificaciones", "long"),
  field(s[1], "compradorCorreo", "Correo del comprador"),

  field(s[2], "inmueble", "Domicilio del inmueble", "long"),
  field(s[2], "superficieTerreno", "Superficie de terreno (m²)", "number"),
  field(s[2], "superficieConstruccion", "Superficie de construcción (m²)", "number"),
  field(s[2], "claveCatastral", "Clave catastral"),
  field(s[2], "accesorios", "Lo que se vende con el inmueble (estacionamiento, bodega, muebles) o «ninguno»", "long"),
  choice(s[2], "condominio", "¿Está en condominio?", SI_NO),
  choice(s[2], "intervieneFortius", "¿Fortius promovió la venta?", SI_NO),

  choice(s[3], "moneda", "Moneda del precio", [["MXN", "Pesos (MXN)"], ["USD", "Dólares (USD)"]]),
  field(s[3], "precio", "Precio total", "money"),
  field(s[3], "enganche", "Enganche", "money"),
  choice(s[3], "enganchePagado", "El enganche", [["firma", "Se paga a la firma"], ["despues", "Se paga después"]]),
  field(s[3], "fechaEnganche", "Fecha límite para pagar el enganche", "date"),
  field(s[3], "numeroMensualidades", "Número de mensualidades", "number"),
  field(s[3], "fechaPrimeraMensualidad", "Fecha de la primera mensualidad", "date"),
  choice(s[3], "intereses", "¿El saldo causa intereses?", SI_NO),
  field(s[3], "tasaAnual", "Interés ordinario anual en porcentaje", "number"),
  choice(s[3], "moratorio", "¿Hay interés por pago tardío?", SI_NO),
  field(s[3], "tasaMoratoria", "Interés moratorio mensual en porcentaje", "number"),
  field(s[3], "banco", "Banco de la cuenta del vendedor"),
  field(s[3], "cuentaVendedor", "Cuenta o CLABE del vendedor"),

  choice(s[4], "formalizacion", "Cómo se formaliza", [["escritura", "Escritura pública desde la firma"], ["privado", "Documento privado con firmas ratificadas"]]),
  field(s[4], "notario", "Notario (número y ciudad)"),
  field(s[4], "fechaEscritura", "Fecha límite para firmar la escritura", "date"),
  field(s[4], "diasRatificacion", "Días para ratificar las firmas ante notario", "number"),
  field(s[4], "diasCancelacion", "Días para cancelar la reserva después del último pago", "number"),
  choice(s[4], "entrega", "Entrega de la posesión", [["firma", "A la firma"], ["enganche", "Al pagar el enganche"], ["fecha", "En una fecha fija"]]),
  field(s[4], "fechaEntrega", "Fecha de entrega de la posesión", "date"),
  choice(s[4], "seguro", "¿El comprador asegura el inmueble mientras paga?", SI_NO),
  field(s[4], "sumaAsegurada", "Suma asegurada mínima", "money"),

  field(s[5], "mensualidadesRescindir", "Mensualidades sin pagar que permiten rescindir", "number"),
  field(s[5], "diasGracia", "Días para ponerse al corriente después del aviso", "number"),
  field(s[5], "diasDesocupacion", "Días para devolver la posesión si se rescinde", "number"),
  field(s[5], "rentaCompensatoria", "Renta mensual por el uso si se rescinde", "money"),
  field(s[5], "penaRescision", "Pena al comprador, en porcentaje del precio", "number"),
  field(s[5], "penaVendedor", "Pena al vendedor, en porcentaje del precio", "number"),
  field(s[5], "diasDevolucion", "Días para devolver lo pagado si se rescinde", "number"),
  choice(s[5], "gastos", "Gastos de escritura, registro e impuesto de adquisición", [["comprador", "Los paga el comprador"], ["mitad", "Por mitad"]]),

  field(s[6], "municipioJurisdiccion", "Municipio de los tribunales"),
  field(s[6], "municipioFirma", "Municipio de firma"),
  field(s[6], "fechaFirma", "Fecha de firma", "date"),
  field(s[6], "testigo1", "Primer testigo"),
  field(s[6], "testigo2", "Segundo testigo"),
];

/** Por encima del corte (o con precio en dólares) la venta va en escritura pública. */
export function exigeEscritura(d: Record<string, unknown>): boolean {
  if (d.moneda === "USD") return true;
  return typeof d.precio === "number" && Number.isFinite(d.precio) && d.precio > UMBRAL_ESCRITURA;
}
/** Forma con que sale el contrato: la elegida, salvo que el precio exija escritura. */
export function formaContrato(d: Record<string, unknown>): "escritura" | "privado" | null {
  if (exigeEscritura(d)) return "escritura";
  return d.formalizacion === "escritura" || d.formalizacion === "privado" ? d.formalizacion : null;
}

/** Campos que solo aplican según lo elegido. */
export function mostrarCampoCompraventaPlazos(key: string, d: Record<string, unknown>): boolean {
  const moralV = d.vendedorTipo === "moral", moralC = d.compradorTipo === "moral";
  if (["vendedorNacionalidad", "vendedorIdentificacion", "vendedorEstadoCivil", "consentimientoConyuge"].includes(key)) return !moralV;
  if (["vendedorActa", "vendedorRepresentante", "vendedorPoder"].includes(key)) return moralV;
  if (key === "conyugeVendedor") return !moralV && d.consentimientoConyuge === "si";
  if (key === "certificadoGravamen") return d.gravamen !== "cancelar";
  if (["gravamenDescripcion", "acreedorGravamen"].includes(key)) return d.gravamen === "cancelar";
  if (["compradorNacionalidad", "compradorIdentificacion", "compradorEstadoCivil"].includes(key)) return !moralC;
  if (["compradorActa", "compradorRepresentante", "compradorPoder"].includes(key)) return moralC;
  if (key === "beneficiario") return d.porCuentaDeOtro === "si";
  if (key === "fechaEnganche") return d.enganchePagado === "despues";
  if (key === "tasaAnual") return d.intereses === "si";
  if (key === "tasaMoratoria") return d.moratorio === "si";
  if (key === "formalizacion") return !exigeEscritura(d);
  if (["notario", "fechaEscritura"].includes(key)) return formaContrato(d) !== "privado";
  if (["diasRatificacion", "testigo1", "testigo2"].includes(key)) return formaContrato(d) === "privado";
  if (key === "fechaEntrega") return d.entrega === "fecha";
  if (key === "sumaAsegurada") return d.seguro === "si";
  return true;
}

export type Mensualidad = { numero: number; fecha: string; importe: number; interes: number; capital: number; saldo: number };

const fechaValida = (value: unknown): value is string => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime()) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
const positivo = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value > 0;

/** Misma fecha del mes, n meses después; si el mes es más corto, su último día. */
export function sumarMeses(inicio: string, n: number): string {
  const [y, m, day] = inicio.split("-").map(Number);
  const total = (m - 1) + n, year = y + Math.floor(total / 12), month = total % 12;
  const ultimo = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(day, ultimo))).toISOString().slice(0, 10);
}

/** Saldo después del enganche, o null si falta precio o enganche. */
export function saldoCompraventa(d: Record<string, unknown>): number | null {
  if (!positivo(d.precio) || typeof d.enganche !== "number" || !Number.isFinite(d.enganche) || d.enganche < 0 || d.enganche >= d.precio) return null;
  return new Decimal(d.precio).minus(d.enganche).toDecimalPlaces(2).toNumber();
}

/**
  Calendario del Anexo 1. Sin intereses: el saldo en partes iguales y la última absorbe los centavos.
  Con intereses: pago fijo sobre saldos insolutos (interés mensual = tasa anual / 12); el interés de
  cada mes se redondea al centavo y la última mensualidad liquida lo que quede. Null si faltan datos.
*/
export function calendarioPagos(d: Record<string, unknown>): Mensualidad[] | null {
  const saldo = saldoCompraventa(d), n = d.numeroMensualidades;
  if (saldo === null || !Number.isSafeInteger(n) || (n as number) < 1 || (n as number) > MAX_MENSUALIDADES || !fechaValida(d.fechaPrimeraMensualidad)) return null;
  const meses = n as number;
  const conIntereses = d.intereses === "si";
  if (conIntereses && !positivo(d.tasaAnual)) return null;
  if (!conIntereses && d.intereses !== "no") return null;
  const r = conIntereses ? new Decimal(d.tasaAnual as number).div(1200) : new Decimal(0);
  const cuota = r.isZero()
    ? new Decimal(saldo).div(meses).toDecimalPlaces(2, Decimal.ROUND_DOWN)
    : new Decimal(saldo).mul(r).div(new Decimal(1).minus(new Decimal(1).plus(r).pow(-meses))).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  let resto = new Decimal(saldo);
  const pagos: Mensualidad[] = [];
  for (let i = 1; i <= meses; i++) {
    const interes = resto.mul(r).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const ultima = i === meses;
    let capital = ultima ? resto : cuota.minus(interes);
    if (capital.gt(resto)) capital = resto;
    resto = resto.minus(capital);
    pagos.push({ numero: i, fecha: sumarMeses(d.fechaPrimeraMensualidad as string, i - 1), importe: capital.plus(interes).toNumber(), interes: interes.toNumber(), capital: capital.toNumber(), saldo: resto.toNumber() });
  }
  return pagos;
}

const entero = (value: unknown, min: number, max: number) => value === undefined || value === null || value === "" || (Number.isSafeInteger(value) && (value as number) >= min && (value as number) <= max);
const correo = (value: unknown) => value === undefined || value === null || value === "" || (typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()));

/** Reglas de congruencia; un dato vacío no es error aquí (sale como línea en blanco, RP-77). */
export function validarCompraventaPlazos(d: Record<string, unknown>): string[] {
  const errors: string[] = [];
  if (d.precio === 0) errors.push("Precio mayor que cero");
  if (typeof d.precio === "number" && typeof d.enganche === "number" && d.enganche >= d.precio) errors.push("El enganche debe ser menor que el precio");
  if (!entero(d.numeroMensualidades, 1, MAX_MENSUALIDADES)) errors.push(`Número de mensualidades entre 1 y ${MAX_MENSUALIDADES}`);
  if (d.intereses === "si" && d.tasaAnual === 0) errors.push("Interés ordinario mayor que cero, o elige sin intereses");
  if (d.moratorio === "si" && d.tasaMoratoria === 0) errors.push("Interés moratorio mayor que cero, o elige sin interés por pago tardío");
  for (const [key, label] of [["tasaAnual", "Interés ordinario"], ["tasaMoratoria", "Interés moratorio"], ["penaRescision", "Pena al comprador"], ["penaVendedor", "Pena al vendedor"]] as const)
    if (d[key] !== undefined && d[key] !== "" && (typeof d[key] !== "number" || d[key] < 0 || d[key] > 100)) errors.push(`${label} entre 0 y 100`);
  for (const [key, label, min] of [["mensualidadesRescindir", "Mensualidades para rescindir", 1], ["diasGracia", "Días para ponerse al corriente", 0], ["diasDesocupacion", "Días para devolver la posesión", 0], ["diasDevolucion", "Días para devolver lo pagado", 0], ["diasRatificacion", "Días para ratificar las firmas", 0], ["diasCancelacion", "Días para cancelar la reserva", 0]] as const)
    if (!entero(d[key], min, 9999)) errors.push(`${label} en número entero`);
  if (Number.isSafeInteger(d.mensualidadesRescindir) && Number.isSafeInteger(d.numeroMensualidades) && (d.mensualidadesRescindir as number) > (d.numeroMensualidades as number)) errors.push("Las mensualidades para rescindir no pueden ser más que el total");
  if (!correo(d.vendedorCorreo)) errors.push("Correo del vendedor");
  if (!correo(d.compradorCorreo)) errors.push("Correo del comprador");
  const firma = fechaValida(d.fechaFirma) ? d.fechaFirma : null;
  if (firma) for (const [key, label, aplica] of [["fechaPrimeraMensualidad", "La primera mensualidad", true], ["fechaEnganche", "El pago del enganche", d.enganchePagado === "despues"], ["fechaEscritura", "La escritura", formaContrato(d) !== "privado"], ["fechaEntrega", "La entrega", d.entrega === "fecha"]] as const)
    if (aplica && fechaValida(d[key]) && (d[key] as string) < firma) errors.push(`${label} no puede ser anterior a la firma`);
  // Si el precio exige escritura, el contrato ya sale con ella aunque antes se eligiera el documento
  // privado (formaContrato); no se pide corregir un dato que ya no se ve.
  return errors;
}
