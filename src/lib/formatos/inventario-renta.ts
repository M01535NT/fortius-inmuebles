import Decimal from "decimal.js";
import type { FormatoField } from "./catalog";

/*
  23 · Inventario y acta de entrega del inmueble arrendado (Anexo 2 del contrato 20). El titular
  aprobó el 13/11/2026 el texto que redactó el agente: el mismo documento sirve al entrar (entrega
  al arrendatario) y al salir (devolución al arrendador). La salida compara con la entrada y liquida
  el depósito como dice el contrato 20: solo rentas, servicios y cuotas pendientes y los daños que
  exceden el desgaste normal, cada uno con su comprobante.
*/

const field = (section: string, key: string, label: string, type: FormatoField["type"] = "text", required = true): FormatoField => ({ section, key, label, type, required });
const choice = (section: string, key: string, label: string, options: string[][], required = true): FormatoField => ({ ...field(section, key, label, "choice", required), options: options.map(([value, label]) => ({ value, label })) });
const SI_NO = [["no", "No"], ["si", "Sí"]];
const s = ["01 / Contrato e inmueble", "02 / Entrega al arrendatario", "03 / Devolución al arrendador", "04 / Liquidación del depósito"];

const ESTADO = [{ value: "bueno", label: "Bueno" }, { value: "regular", label: "Regular" }, { value: "dano", label: "Con daño" }];
const SALIDA = [{ value: "igual", label: "Igual" }, { value: "desgaste", label: "Desgaste normal" }, { value: "dano", label: "Con daño" }];
export type InventarioColumna = { key: string; label: string; options?: readonly { value: string; label: string }[]; salida?: boolean };
export const INVENTARIO_TABLAS: Record<"espacios" | "bienes" | "accesos", { label: string; columns: readonly InventarioColumna[] }> = {
  espacios: { label: "elemento", columns: [{ key: "espacio", label: "Espacio" }, { key: "elemento", label: "Elemento" }, { key: "estado", label: "Estado al entregar", options: ESTADO }, { key: "observaciones", label: "Observaciones al entregar" }, { key: "salida", label: "Al devolver", options: SALIDA, salida: true }, { key: "danoSalida", label: "Daño al devolver", salida: true }] },
  bienes: { label: "bien", columns: [{ key: "bien", label: "Bien" }, { key: "cantidad", label: "Cantidad" }, { key: "descripcion", label: "Marca o descripción" }, { key: "estado", label: "Estado al entregar", options: ESTADO }, { key: "salida", label: "Al devolver", options: SALIDA, salida: true }, { key: "danoSalida", label: "Daño al devolver", salida: true }] },
  accesos: { label: "acceso", columns: [{ key: "concepto", label: "Llave, control, tarjeta o tag" }, { key: "cantidad", label: "Cantidad entregada" }, { key: "devueltas", label: "Cantidad devuelta", salida: true }] },
};
export type InventarioTabla = keyof typeof INVENTARIO_TABLAS;
export type InventarioRow = Record<string, string>;

export const inventarioRentaFields: FormatoField[] = [
  field(s[0], "folio", "Folio del expediente"), field(s[0], "fechaContrato", "Fecha del contrato de arrendamiento", "date"),
  field(s[0], "arrendador", "Nombre del arrendador"), field(s[0], "arrendatario", "Nombre del arrendatario"), field(s[0], "inmueble", "Domicilio del inmueble", "long"),

  field(s[1], "fechaEntrega", "Fecha de entrega", "date"), field(s[1], "horaEntrega", "Hora de entrega", "time"), field(s[1], "presentes", "Personas presentes en la entrega", "long"),
  field(s[1], "espacios", "Estado de cada espacio", "inventarioRows"),
  choice(s[1], "bienesEstado", "Lo que se renta con el inmueble", [["ninguno", "Ninguno"], ["registrados", "Registrados"]]), field(s[1], "bienes", "Bienes que se rentan con el inmueble", "inventarioRows"),
  field(s[1], "medidorLuz", "Medidor o contrato de luz"), field(s[1], "lecturaLuz", "Lectura de luz al entregar"), choice(s[1], "luzCorriente", "¿La luz está al corriente?", SI_NO),
  field(s[1], "medidorAgua", "Medidor o contrato de agua"), field(s[1], "lecturaAgua", "Lectura de agua al entregar"), choice(s[1], "aguaCorriente", "¿El agua está al corriente?", SI_NO),
  choice(s[1], "tieneGas", "¿Tiene gas con medidor?", SI_NO), field(s[1], "medidorGas", "Medidor o contrato de gas"), field(s[1], "lecturaGas", "Lectura de gas al entregar"), choice(s[1], "gasCorriente", "¿El gas está al corriente?", SI_NO),
  field(s[1], "accesos", "Llaves, controles y accesos", "inventarioRows"),
  field(s[1], "numeroFotos", "Número de fotografías", "number"), field(s[1], "medioFotos", "Dónde se conservan las fotografías"),
  field(s[1], "diasObservaciones", "Días para informar daños que no se vieron al recibir", "number"),
  choice(s[1], "intervieneFortius", "¿Fortius elaboró el inventario?", SI_NO), field(s[1], "asesor", "Asesor que elaboró el inventario"),

  field(s[2], "fechaDevolucion", "Fecha de devolución", "date", false), field(s[2], "horaDevolucion", "Hora de devolución", "time", false), field(s[2], "presentesDevolucion", "Personas presentes en la devolución", "long", false),
  field(s[2], "lecturaFinalLuz", "Lectura final de luz", "text", false), field(s[2], "lecturaFinalAgua", "Lectura final de agua", "text", false), field(s[2], "lecturaFinalGas", "Lectura final de gas", "text", false),
  field(s[2], "faltantes", "Llaves o accesos que faltan, o «ninguno»", "long", false),

  field(s[3], "deposito", "Depósito recibido en MXN", "money", false),
  field(s[3], "rentasPendientes", "Rentas pendientes en MXN", "money", false), field(s[3], "comprobanteRentas", "Comprobante de las rentas pendientes", "text", false),
  field(s[3], "serviciosPendientes", "Servicios y cuotas pendientes en MXN", "money", false), field(s[3], "comprobanteServicios", "Comprobante de servicios y cuotas", "text", false),
  field(s[3], "reparaciones", "Reparación de daños que exceden el desgaste normal en MXN", "money", false), field(s[3], "comprobanteReparaciones", "Presupuesto o factura de las reparaciones", "text", false),
  field(s[3], "diasDevolucion", "Días para devolver el saldo", "number", false), field(s[3], "formaDevolucion", "Forma de devolución del saldo", "text", false),
  field(s[3], "plazoPagoDiferencia", "Plazo en que el arrendatario paga la diferencia", "text", false),
];

/** Saldo del depósito: lo recibido menos rentas, servicios y reparaciones. Negativo si el arrendatario adeuda. */
export function saldoDeposito(d: Record<string, unknown>): number | null {
  if (typeof d.deposito !== "number" || !Number.isFinite(d.deposito)) return null;
  const resta = ["rentasPendientes", "serviciosPendientes", "reparaciones"].reduce((acc, key) => acc.plus(typeof d[key] === "number" && Number.isFinite(d[key]) ? d[key] as number : 0), new Decimal(0));
  return new Decimal(d.deposito).minus(resta).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
}

const positivo = (value: unknown) => typeof value === "number" && value > 0;

/** Campos que solo aplican según lo elegido. */
export function mostrarCampoInventario(key: string, d: Record<string, unknown>): boolean {
  if (key === "bienes") return d.bienesEstado === "registrados";
  if (["medidorGas", "lecturaGas", "gasCorriente", "lecturaFinalGas"].includes(key)) return d.tieneGas === "si";
  if (key === "asesor") return d.intervieneFortius === "si";
  if (key === "comprobanteRentas") return positivo(d.rentasPendientes);
  if (key === "comprobanteServicios") return positivo(d.serviciosPendientes);
  if (key === "comprobanteReparaciones") return positivo(d.reparaciones);
  if (key === "plazoPagoDiferencia") return (saldoDeposito(d) ?? 0) < 0;
  return true;
}

const filled = (value: unknown) => typeof value === "string" && value.trim().length > 0;
const fechaValida = (value: unknown): value is string => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime()) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;

/** Reglas de congruencia; las columnas de devolución se llenan al salir y no cuentan como faltantes antes. */
export function validarInventario(d: Record<string, unknown>): string[] {
  const errors: string[] = [];
  for (const [key, config] of Object.entries(INVENTARIO_TABLAS)) {
    const rows = d[key] ?? [];
    const required = key !== "bienes" || d.bienesEstado === "registrados";
    if (!Array.isArray(rows) || rows.length > 80 || required && rows.length === 0 || !required && rows.length > 0) { errors.push(key === "espacios" ? "Estado de cada espacio" : key === "bienes" ? "Bienes que se rentan con el inmueble" : "Llaves, controles y accesos"); continue; }
    for (const row of rows) {
      if (!row || typeof row !== "object" || Array.isArray(row) || config.columns.some(c => !c.salida && !filled((row as InventarioRow)[c.key]))) { errors.push(`Cada ${config.label}: falta un dato de la entrega`); continue; }
      const r = row as InventarioRow;
      if (config.columns.some(c => c.options && filled(r[c.key]) && !c.options.some(o => o.value === r[c.key]))) errors.push(`Cada ${config.label}: estado no válido`);
      if (r.salida === "dano" && !filled(r.danoSalida)) errors.push(`Cada ${config.label} con daño al devolver: describe el daño`);
    }
  }
  for (const [key, label] of [["numeroFotos", "Número de fotografías"], ["diasObservaciones", "Días para informar daños"], ["diasDevolucion", "Días para devolver el saldo"]] as const)
    if (d[key] !== undefined && d[key] !== "" && (!Number.isSafeInteger(d[key]) || (d[key] as number) < 0)) errors.push(`${label} en número entero`);
  if (fechaValida(d.fechaEntrega) && fechaValida(d.fechaContrato) && d.fechaEntrega < d.fechaContrato) errors.push("La entrega no puede ser anterior al contrato");
  if (fechaValida(d.fechaDevolucion) && fechaValida(d.fechaEntrega) && d.fechaDevolucion < d.fechaEntrega) errors.push("La devolución no puede ser anterior a la entrega");
  return errors;
}
