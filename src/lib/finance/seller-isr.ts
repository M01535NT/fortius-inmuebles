import { SELLER_ISR_RULES as R } from "@/data/financial-rules";
import { isrFromGain } from "./closing";
import { D, cents, checkAmount, sumMoney, validIsoDate } from "./money";

/*
  ISR por la venta de un inmueble de persona física residente (HER-03). Estimación: el cálculo
  definitivo lo hace el notario (LISR 126). Cada regla viene de SELLER_ISR_RULES con su artículo;
  si falta un dato o la fecha queda fuera de la vigencia, el resultado es «pendiente» (RP-06).
*/

export type SellerIsrCase = {
  price: number;
  saleDate: string;
  acquisitionDate: string;
  /** Copropietarios en partes iguales (cónyuges incluidos); cada uno calcula su parte. */
  owners: number;
  /** «actualizado»: el costo ya actualizado (notario o Nuvigant). «historico»: se actualiza aquí. */
  costMode: "actualizado" | "historico";
  updatedCost: number | null;
  acquisitionCost: number | null;
  /** Parte del terreno en el costo histórico; vacío aplica el 20% (LISR 124, fr. I). */
  landCost: number | null;
  inpcAcquisition: number | null;
  inpcSale: number | null;
  /** Construcciones, mejoras y ampliaciones, ya actualizadas (LISR 121, fr. II). */
  improvements: number | null;
  /** Gastos notariales, impuestos, derechos y avalúo de compra y venta, actualizados (LISR 121, fr. III). */
  expenses: number | null;
  /** Comisiones pagadas por el vendedor (LISR 121, fr. IV). */
  commission: number | null;
  homeExemption: boolean;
  /** El vendedor manifiesta que no usó la exención en los tres años anteriores. */
  noPriorExemption: boolean;
  udiValue: number | null;
};

export type SellerIsrOwner = { owner: number; price: number; gain: number; exempt: number; taxableGain: number; quotient: number; provisional: number; state: number; federal: number };
export type SellerIsrResult =
  | { status: "pendiente"; missing: string[] }
  | {
      status: "ok";
      years: number;
      yearsForTax: number;
      depreciationYears: number;
      factor: number | null;
      land: number | null;
      construction: number | null;
      depreciatedConstruction: number | null;
      updatedCost: number;
      costFloorApplied: boolean;
      deductions: number;
      gain: number;
      exemptLimit: number | null;
      exemptionApplied: boolean;
      owners: SellerIsrOwner[];
      provisional: number;
      state: number;
      federal: number;
    };

/** Años completos entre dos fechas ISO (aniversarios cumplidos). */
export function completedYears(from: string, to: string): number {
  const [fy, fm, fd] = from.split("-").map(Number), [ty, tm, td] = to.split("-").map(Number);
  return ty - fy - (tm < fm || (tm === fm && td < fd) ? 1 : 0);
}

/** Factor de actualización (CFF 17-A): al diezmilésimo y nunca menor a 1. */
export function updateFactor(inpcAcquisition: number, inpcSale: number): number {
  const factor = new D(inpcSale).div(inpcAcquisition).toDecimalPlaces(4, D.ROUND_DOWN);
  return D.max(1, factor).toNumber();
}

export function calculateSellerIsrCase(input: SellerIsrCase): SellerIsrResult {
  const missing: string[] = [];
  const need = (value: number | null, label: string) => { if (value === null) missing.push(label); };
  if (!validIsoDate(input.saleDate)) missing.push("Fecha estimada de la escritura");
  else if (input.saleDate < R.validFrom || input.saleDate > R.validTo) missing.push(`Tarifa del ISR para ${input.saleDate.slice(0, 4)} (las reglas cargadas son de ${R.validFrom.slice(0, 4)})`);
  if (!validIsoDate(input.acquisitionDate)) missing.push("Fecha en que se compró");
  else if (validIsoDate(input.saleDate) && input.acquisitionDate >= input.saleDate) missing.push("Fecha de compra anterior a la venta");
  if (input.costMode === "actualizado") need(input.updatedCost, "Costo de adquisición actualizado");
  else {
    need(input.acquisitionCost, "Precio en que se compró");
    need(input.inpcAcquisition, "INPC del mes en que se compró");
    need(input.inpcSale, "INPC del mes anterior a la venta");
    if (input.acquisitionCost !== null && input.landCost !== null && input.landCost > input.acquisitionCost) missing.push("Valor del terreno no mayor que el precio de compra");
  }
  need(input.improvements, "Mejoras y ampliaciones (0 si no hubo)");
  need(input.expenses, "Gastos notariales, impuestos y avalúo deducibles (0 si no hay)");
  need(input.commission, "Comisión de la venta");
  if (input.homeExemption && input.noPriorExemption) need(input.udiValue, "Valor de la UDI en la fecha de la escritura");
  if (!Number.isInteger(input.owners) || input.owners < 1 || input.owners > 10) missing.push("Número de propietarios (1 a 10)");
  if (missing.length) return { status: "pendiente", missing };

  [input.price, input.improvements!, input.expenses!, input.commission!].forEach(checkAmount);
  const years = Math.max(1, completedYears(input.acquisitionDate, input.saleDate));
  const yearsForTax = Math.min(R.maxYears, years);
  let factor: number | null = null, land: number | null = null, construction: number | null = null, depreciated: number | null = null, cost: number;
  if (input.costMode === "actualizado") { checkAmount(input.updatedCost!); cost = input.updatedCost!; }
  else {
    checkAmount(input.acquisitionCost!);
    factor = updateFactor(input.inpcAcquisition!, input.inpcSale!);
    land = input.landCost ?? cents(new D(input.acquisitionCost!).mul(R.landWhenUnknownPercent).div(100));
    construction = cents(new D(input.acquisitionCost!).minus(land));
    const kept = D.max(new D(100).minus(new D(R.depreciationPercent).mul(years)), R.depreciationFloorPercent);
    depreciated = cents(new D(construction).mul(kept).div(100));
    cost = cents(new D(land).plus(depreciated).mul(factor));
  }
  const floor = cents(new D(input.price).mul(R.costFloorPercent).div(100));
  const updatedCost = Math.max(cost, floor);
  const deductions = sumMoney([input.improvements!, input.expenses!, input.commission!]);
  const gain = cents(D.max(0, new D(input.price).minus(updatedCost).minus(deductions)));
  const exemptionApplied = input.homeExemption && input.noPriorExemption;
  const exemptLimit = exemptionApplied ? cents(new D(R.homeExemptionUdis).mul(input.udiValue!)) : null;

  const owners: SellerIsrOwner[] = [];
  const share = (value: number, i: number) => {
    // Partes iguales; el último propietario absorbe los centavos para que la suma cuadre.
    const part = cents(new D(value).div(input.owners));
    return i === input.owners - 1 ? cents(new D(value).minus(new D(part).mul(input.owners - 1))) : part;
  };
  for (let i = 0; i < input.owners; i++) {
    const price = share(input.price, i), ownerGain = share(gain, i);
    // LISR 93, XIX, a): por el excedente sobre 700,000 UDIS, deducciones en proporción excedente / precio.
    const excess = exemptLimit === null ? price : Math.max(0, cents(new D(price).minus(exemptLimit)));
    const taxableGain = exemptLimit === null ? ownerGain : price === 0 ? 0 : cents(new D(ownerGain).mul(excess).div(price));
    const tax = isrFromGain(taxableGain, yearsForTax);
    if (!tax) return { status: "pendiente", missing: ["Renglón de la tarifa para una ganancia muy pequeña"] };
    owners.push({ owner: i + 1, price, gain: ownerGain, exempt: cents(new D(price).minus(excess)), taxableGain, quotient: tax.quotient, provisional: tax.provisional, state: tax.state, federal: tax.federal });
  }
  return {
    status: "ok", years, yearsForTax, depreciationYears: years, factor, land, construction, depreciatedConstruction: depreciated,
    updatedCost, costFloorApplied: updatedCost > cost, deductions, gain, exemptLimit, exemptionApplied, owners,
    provisional: sumMoney(owners.map(o => o.provisional)), state: sumMoney(owners.map(o => o.state)), federal: sumMoney(owners.map(o => o.federal)),
  };
}
