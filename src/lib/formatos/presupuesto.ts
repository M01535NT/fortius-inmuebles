import Decimal from "decimal.js";

export type Partida = {
  id: string; area: string; concepto: string; tipoCosto: string; unidad: string;
  cantidad: number; precioUnitario: number; estado: string; soporte: string;
};
export type Pago = {
  fechaPago: string; partidaId: string; proveedor: string; concepto: string;
  importe: number; medio: string; comprobante: string; estado: string;
};
export const importePartida = (partida: Partida) => new Decimal(partida.cantidad).mul(partida.precioUnitario).toDecimalPlaces(2).toNumber();

const tipos = new Set(["Material", "Mano de obra", "Equipo", "Servicio", "Indirecto"]);
const unidades = new Set(["pieza", "m2", "m3", "metro", "jornada", "lote", "servicio"]);
const estadosPartida = new Set(["Por cotizar", "Cotizado", "Autorizado", "Descartado"]);
const medios = new Set(["Transferencia", "Efectivo", "Tarjeta", "Cheque", "Otro"]);
const estadosPago = new Set(["Pagado", "Por confirmar", "Anulado"]);
const text = (value: unknown) => typeof value === "string" && value.trim().length > 0;
const money = (value: unknown, positive = false) => typeof value === "number" && Number.isFinite(value) && value >= (positive ? 0.01 : 0) && value <= 1e12;
const date = (value: unknown) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
const rows = (value: unknown): Record<string, unknown>[] | null => Array.isArray(value) && value.every((item) => item && typeof item === "object" && !Array.isArray(item)) ? value as Record<string, unknown>[] : null;

export function validarPresupuesto(data: Record<string, unknown>): string[] {
  const errors: string[] = [];
  const partidas = rows(data.partidas);
  const pagos = rows(data.pagos);
  if (!partidas || partidas.length === 0 || partidas.length > 50) errors.push("Captura de 1 a 50 partidas");
  if (!pagos || pagos.length > 70) errors.push("Captura de pagos inválida");
  if (!money(data.reservaImprevistos)) errors.push("Reserva para imprevistos");
  if (!partidas || !pagos) return errors;
  const ids = new Set<string>();
  for (const [index, partida] of partidas.entries()) {
    const id = String(partida.id ?? "").trim();
    const label = id || `fila ${index + 1}`;
    if (!id) errors.push(`Partida ${label}: ID`);
    if (ids.has(id)) errors.push("ID de partida repetido");
    ids.add(id);
    if (!text(partida.concepto)) errors.push(`Partida ${label}: concepto`);
    if (!estadosPartida.has(String(partida.estado))) errors.push(`Partida ${label}: estado`);
    if (partida.estado === "Por cotizar") errors.push(`Partida ${label}: por cotizar`);
    if (!text(partida.area)) errors.push(`Partida ${label}: área`);
    if (!text(partida.soporte)) errors.push(`Partida ${label}: soporte`);
    if (partida.estado === "Descartado") continue;
    if (!tipos.has(String(partida.tipoCosto))) errors.push(`Partida ${label}: tipo de costo`);
    if (!unidades.has(String(partida.unidad))) errors.push(`Partida ${label}: unidad`);
    if (!money(partida.cantidad, true)) errors.push(`Partida ${label}: cantidad`);
    if (!money(partida.precioUnitario)) errors.push(`Partida ${label}: precio unitario`);
  }
  if (!partidas.some((item) => item.estado === "Cotizado" || item.estado === "Autorizado")) errors.push("Al menos una partida cotizada");
  const paymentKeys = new Set<string>();
  for (const [index, pago] of pagos.entries()) {
    const label = `Pago ${index + 1}`;
    if (!estadosPago.has(String(pago.estado))) errors.push(`${label}: estado`);
    if (pago.estado === "Por confirmar") errors.push(`${label}: por confirmar`);
    if (!date(pago.fechaPago)) errors.push(`${label}: fecha`);
    if (!ids.has(String(pago.partidaId ?? ""))) errors.push(`${label}: ID de partida`);
    if (!text(pago.proveedor)) errors.push(`${label}: proveedor`);
    if (!text(pago.concepto)) errors.push(`${label}: concepto`);
    if (!money(pago.importe, true)) errors.push(`${label}: importe`);
    if (!medios.has(String(pago.medio))) errors.push(`${label}: medio`);
    if (!text(pago.comprobante)) errors.push(`${label}: comprobante`);
    if (pago.estado === "Anulado") continue;
    const key = [pago.comprobante, pago.fechaPago, pago.importe, pago.partidaId].join("|");
    if (paymentKeys.has(key)) errors.push("Pago duplicado");
    paymentKeys.add(key);
  }
  if (pagos.length === 0 && data.sinPagosConfirmado !== "si") errors.push("Confirma que no hubo pagos");
  return [...new Set(errors)];
}

export function calcularPresupuesto(data: Record<string, unknown>) {
  const errors = validarPresupuesto(data);
  if (errors.length) throw new Error(`Presupuesto incompleto: ${errors.join(", ")}`);
  const partidas = data.partidas as Partida[];
  const pagos = data.pagos as Pago[];
  const subtotal = partidas.filter((item) => item.estado === "Cotizado" || item.estado === "Autorizado").reduce((sum, item) => sum.plus(importePartida(item)), new Decimal(0));
  const authorized = partidas.filter((item) => item.estado === "Autorizado").reduce((sum, item) => sum.plus(importePartida(item)), new Decimal(0));
  const reserve = new Decimal(data.reservaImprevistos as number);
  const paid = pagos.filter((item) => item.estado === "Pagado").reduce((sum, item) => sum.plus(item.importe), new Decimal(0));
  const estimation = subtotal.plus(reserve);
  return {
    subtotalCotizado: subtotal.toNumber(), importeAutorizado: authorized.toNumber(),
    reservaImprevistos: reserve.toNumber(), estimacionConReserva: estimation.toNumber(),
    totalPagado: paid.toNumber(), autorizadoMenosPagado: partidas.some((item) => item.estado === "Autorizado") ? authorized.minus(paid).toNumber() : null,
    excesoSobreEstimacion: Decimal.max(0, paid.minus(estimation)).toNumber(),
  };
}
