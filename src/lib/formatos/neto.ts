import Decimal from "decimal.js";

export const CARGOS_NETO = [
  { key: "comision", label: "Comisión inmobiliaria (sin IVA)" },
  { key: "iva_comision", label: "IVA de la comisión" },
  { key: "isr_estimado", label: "ISR estimado de la operación" },
  { key: "liquidacion_credito", label: "Liquidación de crédito" },
  { key: "cancelacion_gravamen", label: "Cancelación de gravamen" },
  { key: "predial", label: "Predial y contribuciones" },
  { key: "agua_servicios", label: "Agua y servicios" },
  { key: "condominio", label: "Cuotas de condominio" },
  { key: "regularizacion", label: "Regularización / formalización" },
] as const;
export type CargoNeto = { concepto: string; importe?: number; estado: string; justificacion: string; descripcion?: string };
const labelFor = (key: string) => CARGOS_NETO.find((item) => item.key === key)?.label ?? (key === "otro1" || key === "otro2" ? "Otro cargo" : key);
const required = (value: unknown) => typeof value === "string" && value.trim().length > 0;
const amount = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1e12;
const positive = (value: unknown) => amount(value) && (value as number) > 0;
const validDate = (value: unknown) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
const todayInTijuana = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Tijuana", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

export function validarNeto(data: Record<string, unknown>, today = todayInTijuana()): string[] {
  const errors: string[] = [];
  for (const [key, label] of [["folio", "Folio"], ["propietario", "Propietario"], ["inmueble", "Inmueble"], ["referencia07", "Referencia de opinión 07"], ["responsableEstimacion", "Responsable de la estimación"]]) {
    if (!required(data[key])) errors.push(label);
  }
  for (const [key, label] of [["fechaEmision", "Fecha de emisión"], ["fecha07", "Fecha de la opinión 07"], ["cierrePrevisto", "Cierre previsto"], ["respaldoFiscalValidoHasta", "Vigencia del respaldo fiscal"]]) {
    if (!validDate(data[key])) errors.push(label);
  }
  if (data.estadoOperacion !== "En estudio") errors.push("Estado de la operación");
  if (!positive(data.precioSugerido07)) errors.push("Valor sugerido según opinión 07");
  if (data.precioAcordado !== undefined && data.precioAcordado !== "" && !positive(data.precioAcordado)) errors.push("Precio acordado con el vendedor");
  if (!["acordado", "sugerido07"].includes(String(data.precioBase))) errors.push("Precio usado para el neto");
  if (data.precioBase === "acordado" && !positive(data.precioAcordado)) errors.push("Precio acordado con el vendedor");
  if (data.revisionCargos !== "Revisado") errors.push("Revisión de cargos");
  if (validDate(data.fechaEmision) && (data.fechaEmision as string) > today) errors.push("Fecha de emisión");
  if (validDate(data.fecha07) && validDate(data.fechaEmision) && (data.fecha07 as string) > (data.fechaEmision as string)) errors.push("Fecha de la opinión 07");
  if (validDate(data.cierrePrevisto) && ((data.cierrePrevisto as string) < today || validDate(data.fechaEmision) && (data.cierrePrevisto as string) < (data.fechaEmision as string))) errors.push("Cierre previsto");
  if (validDate(data.respaldoFiscalValidoHasta) && validDate(data.cierrePrevisto) && (data.respaldoFiscalValidoHasta as string) < (data.cierrePrevisto as string)) errors.push("Vigencia del respaldo fiscal");
  const basePrice = data.precioBase === "acordado" ? data.precioAcordado : data.precioSugerido07;
  if (!positive(data.precioRespaldoFiscal) || positive(basePrice) && new Decimal(data.precioRespaldoFiscal as number).minus(basePrice as number).abs().gt(0.01)) errors.push("Precio del respaldo fiscal");
  const rows = data.erogaciones;
  if (!Array.isArray(rows) || rows.length < CARGOS_NETO.length || rows.length > CARGOS_NETO.length + 2) errors.push("Erogaciones del propietario");
  else {
    const seen = new Set<string>();
    for (const item of rows) {
      if (!item || typeof item !== "object" || Array.isArray(item)) { errors.push("Erogaciones del propietario"); continue; }
      const cargo = item as Record<string, unknown>;
      const key = String(cargo.concepto ?? "");
      if (!CARGOS_NETO.some((fixed) => fixed.key === key) && key !== "otro1" && key !== "otro2") { errors.push("Concepto de erogación desconocido"); continue; }
      if (seen.has(key)) errors.push("Concepto de erogación repetido");
      seen.add(key);
      if ((key === "otro1" || key === "otro2") && !required(cargo.descripcion)) errors.push("Descripción de otro cargo");
      if (!required(cargo.justificacion)) errors.push(labelFor(key));
      if (cargo.estado === "No aplica") {
        if (cargo.importe !== undefined && cargo.importe !== "" && cargo.importe !== 0) errors.push(labelFor(key));
      } else if (["Estimado", "Confirmado"].includes(String(cargo.estado))) {
        if (!amount(cargo.importe)) errors.push(labelFor(key));
      } else errors.push(labelFor(key));
    }
    for (const item of CARGOS_NETO) if (!seen.has(item.key)) errors.push(item.label);
  }
  return [...new Set(errors)];
}

export function calcularNeto(data: Record<string, unknown>, today = todayInTijuana()) {
  const errors = validarNeto(data, today);
  if (errors.length) throw new Error(`Estimación incompleta: ${errors.join(", ")}`);
  const suggested = new Decimal(data.precioSugerido07 as number);
  const agreed = data.precioAcordado === undefined || data.precioAcordado === "" ? null : new Decimal(data.precioAcordado as number);
  const base = data.precioBase === "acordado" ? agreed! : suggested;
  const expenses = (data.erogaciones as CargoNeto[]).reduce((sum, item) => sum.plus(item.estado === "No aplica" ? 0 : item.importe ?? 0), new Decimal(0));
  const difference = agreed?.minus(suggested) ?? null;
  return {
    precioBase: base.toNumber(), diferenciaAbsoluta: difference?.toNumber() ?? null,
    diferenciaPorcentual: difference ? difference.div(suggested).mul(100).toDecimalPlaces(2).toNumber() : null,
    erogaciones: expenses.toNumber(), netoEstimado: base.minus(expenses).toNumber(),
  };
}
