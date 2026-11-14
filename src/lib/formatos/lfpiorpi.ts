import Decimal from "decimal.js";

/*
  LFPIORPI en la operación inmobiliaria (Metodología M-05, decisión del titular del 14/11/2026:
  el pago en efectivo por encima del límite se impide, no solo se avisa).

  Art. 32 fr. I LFPIORPI: está prohibido liquidar o recibir en efectivo (moneda nacional o
  extranjera) o en metales preciosos una operación con inmuebles por un valor igual o mayor a 8,025
  veces la UMA diaria, medida el día del pago. Para esta prohibición sí cuentan las contribuciones y
  los accesorios (Reglamento, art. 6, párr. 3). Fuentes: Ley, última reforma DOF 16-07-2025;
  Reglamento, última reforma DOF 27-03-2026; UMA según INEGI. Verificado el 26/10/2026.

  La UMA se publica cada enero y rige desde el 1 de febrero. Un pago con fecha fuera de la tabla se
  bloquea hasta agregar la UMA de ese periodo: nunca se usa de memoria la de otro año.
*/
export const UMBRAL_EFECTIVO_UMA = 8025;
export const UMA_DIARIA: ReadonlyArray<{ desde: string; hasta: string; valor: number }> = [
  { desde: "2026-02-01", hasta: "2027-01-31", valor: 117.31 },
];
export function umaDiaria(fecha: string) { return UMA_DIARIA.find(u => fecha >= u.desde && fecha <= u.hasta)?.valor; }
export function umbralEfectivo(fecha: string) { const uma = umaDiaria(fecha); return uma === undefined ? undefined : new Decimal(uma).mul(UMBRAL_EFECTIVO_UMA).toNumber(); }

/** Medio de pago en efectivo o metales: el valor elegido «efectivo» o un texto libre que lo diga. */
export function esEfectivo(medio: unknown) {
  return typeof medio === "string" && /efectivo|cash|metal(es)?\s+precioso|\boro\b|\bplata\b|centenario/i.test(medio.normalize("NFD").replace(/[̀-ͯ]/g, ""));
}

export type PagoOperacion = { importe?: unknown; fecha?: unknown; medio?: unknown };
/**
  Lo que impide pagar así la operación. Suma los pagos en efectivo en pesos (los de dólares, con el
  tipo de cambio del día del pago) y los compara con el límite vigente en la fecha de cada uno.
*/
export function efectivoBlockers(input: { pagos: readonly PagoOperacion[]; moneda?: unknown; tipoCambio?: unknown }): string[] {
  const cash = input.pagos.filter(p => esEfectivo(p.medio));
  if (!cash.length) return [];
  const usd = input.moneda === "USD";
  const rate = typeof input.tipoCambio === "number" && input.tipoCambio > 0 ? input.tipoCambio : undefined;
  if (usd && rate === undefined) return ["Indica el tipo de cambio del día del pago en efectivo para revisar el límite de la ley"];
  const blockers: string[] = [];
  let total = new Decimal(0);
  for (const pago of cash) {
    const fecha = typeof pago.fecha === "string" ? pago.fecha.slice(0, 10) : "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) { blockers.push("Indica la fecha de cada pago en efectivo para revisar el límite de la ley"); continue; }
    const limite = umbralEfectivo(fecha);
    if (limite === undefined) { blockers.push(`Falta la UMA vigente para el pago del ${fecha}: actualízala antes de seguir`); continue; }
    if (typeof pago.importe !== "number" || !Number.isFinite(pago.importe) || pago.importe < 0) continue;
    total = total.add(new Decimal(pago.importe).mul(usd ? rate! : 1));
    if (total.gte(limite)) {
      blockers.push(`La ley prohíbe recibir en efectivo $${limite.toLocaleString("es-MX", { minimumFractionDigits: 2 })} o más en una operación con inmuebles (8,025 UMA). Cambia el medio de pago a transferencia, cheque o crédito.`);
      break;
    }
  }
  return [...new Set(blockers)];
}
