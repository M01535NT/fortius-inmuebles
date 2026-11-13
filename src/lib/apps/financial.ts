import { z } from "zod";
import type Decimal from "decimal.js";
import { D, cents, localToday, MAX_MONEY, sumMoney, validIsoDate } from "@/lib/finance/money";
import { calculateMortgage, type Installment } from "@/lib/finance/mortgage";
import { calculateSellerIsrCase, type SellerIsrCase, type SellerIsrResult } from "@/lib/finance/seller-isr";
import { FINANCIAL_SOURCES, SELLER_ISR_RULES } from "@/data/financial-rules";
import type { AppInput, AppResult } from "./types";

const numeric = (min = 0, max = MAX_MONEY) => z.preprocess((value) => {
  if (typeof value === "string" && /^-?\d+(?:\.\d+)?$/.test(value.trim())) {
    const converted = Number(value);
    return Number.isFinite(converted) && new D(value.trim()).eq(converted) ? converted : value;
  }
  return value;
}, z.number({ error: "Captura un número válido sin exceder la precisión admitida" }).finite().min(min).max(max));
const amount = numeric().refine((v) => new D(v).decimalPlaces() <= 2, "Usa como máximo dos decimales");
const signedAmount = numeric(-MAX_MONEY).refine((v) => new D(v).decimalPlaces() <= 2, "Usa como máximo dos decimales");
const optional = <T extends z.ZodType>(schema: T) => z.preprocess((v) => v === "" || v === null ? null : v, schema.nullable());
const percentage = numeric(0, 100);
const date = z.string().refine((v) => validIsoDate(v) && v >= "1900-01-01" && v <= "2200-12-31", "Captura una fecha válida (1900–2200)");
const name = z.string().trim().min(1, "Captura el concepto o nombre").max(160);
const currency = z.enum(["MXN", "USD"]);
// Format Decimal directly: Number cannot preserve cents at large converted values.
function decimalText(value: Decimal.Value, minimum = 0, maximum = 8): string {
  const rounded = new D(value).toDecimalPlaces(maximum);
  const places = Math.max(minimum, rounded.decimalPlaces());
  const [integer, fraction] = rounded.abs().toFixed(places).split(".");
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${rounded.isNegative() && !rounded.isZero() ? "-" : ""}${grouped}${fraction === undefined ? "" : `.${fraction}`}`;
}
function moneyText(value: Decimal.Value, code = "MXN"): string {
  const rounded = new D(value).toDecimalPlaces(2);
  return `${rounded.isNegative() && !rounded.isZero() ? "-" : ""}$${decimalText(rounded.abs(), 2, 2)} ${code}`;
}
// Captured assumptions retain their precision; calculated ratios are explicitly rounded.
const percentText = (value: Decimal.Value) => {
  const decimal = new D(value);
  return `${decimal.toFixed(Math.max(2, decimal.decimalPlaces()))}%`;
};
const ratioText = (value: Decimal.Value) => {
  const rounded = new D(value).toDecimalPlaces(2);
  return `${rounded.isZero() ? "0.00" : rounded.toFixed(2)}%`;
};
const summary = (label: string, value: string) => ({ label, value });
const total = (values: number[]) => sumMoney(values);
const blank = "No determinado";

function parse<T extends z.ZodType>(schema: T, input: AppInput): z.output<T> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(`Revisa ${issue.path.join(" · ") || "los datos"}: ${issue.message}`);
  }
  return parsed.data;
}

export function getFinancialDefaults(slug: string): AppInput {
  switch (slug) {
    case "hipoteca": return { price: "", downPercent: "", annualRate: "", months: 240, firstPayment: localToday(), insurance: null, monthlyFee: null, openingFee: null, extraMonthly: 0, extraOnce: 0, extraMonth: 1, prepaymentFee: null, prepaymentMode: "term" };
    case "neto-propietario": return netDefaults();
    case "comisiones": return { currency: "MXN", mode: "porcentaje", base: null, percent: null, fixed: null, taxPercent: null, withholding: null, shares: [] };
    case "inversiones": return { currency: "MXN", priceBasis: "nominal", taxBasis: "antes", costsComplete: false, rates: { proyecto: null, deuda: null, capital: null }, flows: [], notes: "" };
    case "rehabilitacion": return { currency: "MXN", contingencyPercent: "", items: [], payments: [] };
    case "conversor": return { category: "area", amount: "", from: "m2", to: "ft2", rate: null, rateSource: "", rateDate: "" };
    default: throw new Error("Herramienta financiera desconocida");
  }
}

const mortgageSchema = z.object({
  price: amount, downPercent: percentage, annualRate: numeric(0, 25), months: numeric(1, 360).refine(Number.isInteger, "El plazo debe ser entero"), firstPayment: date,
  insurance: optional(amount), monthlyFee: optional(amount), openingFee: optional(amount), extraMonthly: amount, extraOnce: amount,
  extraMonth: numeric(1, 360).refine(Number.isInteger), prepaymentFee: optional(amount), prepaymentMode: z.enum(["term", "payment"]),
}).strict();
function mortgage(input: AppInput): AppResult {
  const data = parse(mortgageSchema, input);
  const result = calculateMortgage(data);
  const columns = ["Mes", "Fecha", "Pago del crédito", "Interés", "Capital", "Anticipo", "Saldo", "Desembolso conocido"];
  const rows = (schedule: Installment[]) => schedule.map((r) => [String(r.month), r.date, moneyText(r.payment), moneyText(r.interest), moneyText(r.principal), moneyText(r.extra), moneyText(r.balance), moneyText(r.knownOutlay)]);
  return { title: "Estimación hipotecaria", summary: [summary("Crédito", moneyText(result.principal)), summary("Enganche", moneyText(result.downPayment)), summary("Mensualidad inicial conocida", moneyText(result.knownMonthlyPayment)), summary("Intereses", moneyText(result.interest)), summary("Costo conocido del crédito", moneyText(result.totalKnownCost)), summary("Intereses ahorrados", moneyText(result.interestSaved)), summary("Meses ahorrados", String(result.monthsSaved))], sections: [
    { title: "Amortización con anticipos", columns, rows: rows(result.schedule) },
    { title: "Escenario sin anticipos", columns, rows: rows(result.baseline) },
    { title: "Supuestos", text: `MXN. Tasa nominal anual ${percentText(data.annualRate)}, dividida entre 12; plazo ${data.months} meses. Anticipos aplicados después de la cuota; ${data.prepaymentMode === "term" ? "reducen plazo" : "recalculan la cuota"}. Los cargos de apertura y prepago son importes únicos y no integran la mensualidad. La comisión de prepago corresponde al total capturado para los anticipos del escenario. No incluye gastos de compraventa ni constituye una oferta de crédito.` },
  ], warnings: [...result.pending.map((v) => `Estimación preliminar: falta conocer ${v.toLowerCase()}.`)] };
}

/*
  ISR y neto del vendedor (HER-03). Reemplaza a «Neto del propietario» con el mismo slug, así que
  los trabajos guardados se siguen abriendo: los anteriores (sin `isrMode`) se leen con el ISR
  incluido en «Impuestos de la operación» y la comisión como importe, igual que cuando se hicieron.
*/
function netDefaults(): AppInput {
  return {
    currency: "MXN", salePrice: "", loan: null,
    commissionMode: "porcentaje", commissionPercent: null, commissionVat: 16, commission: null,
    isrMode: "calcular", isrAmount: null,
    saleDate: localToday(), acquisitionDate: "", owners: 1, homeExemption: false, noPriorExemption: false, udiValue: null,
    costMode: "historico", updatedCost: null, acquisitionCost: null, landCost: null, inpcAcquisition: null, inpcSale: null,
    improvements: null, acquisitionExpenses: null, taxes: null, expenses: [],
  };
}
/** Completa la captura con los valores por omisión; un trabajo anterior a HER-03 conserva su lectura. */
export function netInput(input: AppInput): AppInput {
  const legacy = Object.keys(input).length > 0 && !("isrMode" in input) && ("taxes" in input || "commission" in input);
  return { ...netDefaults(), ...(legacy ? { commissionMode: "importe", isrMode: "incluido" } : {}), ...input };
}
const inpc = optional(numeric(0.000001, 100000));
const netSchema = z.object({
  currency, salePrice: amount, loan: optional(amount),
  commissionMode: z.enum(["porcentaje", "importe"]), commissionPercent: optional(numeric(0, 20)), commissionVat: z.preprocess(v => typeof v === "string" && v !== "" ? Number(v) : v, z.union([z.literal(0), z.literal(8), z.literal(16)])), commission: optional(amount),
  isrMode: z.enum(["calcular", "importe", "incluido"]), isrAmount: optional(amount),
  saleDate: z.string(), acquisitionDate: z.string(), owners: numeric(1, 10).refine(Number.isInteger, "Los propietarios deben ser un número entero"),
  homeExemption: z.boolean(), noPriorExemption: z.boolean(), udiValue: optional(numeric(0.000001, 1000)),
  costMode: z.enum(["historico", "actualizado"]), updatedCost: optional(amount), acquisitionCost: optional(amount), landCost: optional(amount), inpcAcquisition: inpc, inpcSale: inpc,
  improvements: optional(amount), acquisitionExpenses: optional(amount), taxes: optional(amount),
  expenses: z.array(z.object({ concept: name, amount: optional(amount), status: z.enum(["pagado", "pendiente"]) }).strict()).max(200),
}).strict();
type NetData = z.output<typeof netSchema>;

/** Gastos que suelen tocarle al vendedor; se agregan sin importe para que el asesor los confirme. */
export const NET_COMMON_EXPENSES = ["Certificado de libertad de gravamen", "Constancia de no adeudo de predial", "Constancia de no adeudo de agua", "Avalúo", "Cancelación de hipoteca"] as const;

const ESTIMATE = "Estimación: no sustituye el cálculo del notario ni la asesoría de un contador.";

function netCommission(data: NetData) {
  if (data.commissionMode === "importe") return { fee: null, vat: null, total: data.commission };
  if (data.commissionPercent === null) return { fee: null, vat: null, total: null };
  const fee = cents(new D(data.salePrice).mul(data.commissionPercent).div(100));
  const vat = cents(new D(fee).mul(data.commissionVat).div(100));
  return { fee, vat, total: total([fee, vat]) };
}

function isrCase(data: NetData, commission: number | null): SellerIsrCase {
  return { price: data.salePrice, saleDate: data.saleDate, acquisitionDate: data.acquisitionDate, owners: data.owners, costMode: data.costMode, updatedCost: data.updatedCost, acquisitionCost: data.acquisitionCost, landCost: data.landCost, inpcAcquisition: data.inpcAcquisition, inpcSale: data.inpcSale, improvements: data.improvements, expenses: data.acquisitionExpenses, commission, homeExemption: data.homeExemption, noPriorExemption: data.noPriorExemption, udiValue: data.udiValue };
}

/** Hoja de cálculo del ISR para entregar al propietario. */
function isrSheet(data: NetData, isr: SellerIsrResult, commission: number | null): AppResult {
  const fmt = (n: number) => moneyText(n);
  const plain = (n: number) => moneyText(n).replace(/ MXN$/, "");
  const c = isrCase(data, commission);
  const sources = `Ley del ISR (${SELLER_ISR_RULES.lawReform}, revisada el ${SELLER_ISR_RULES.reviewedAt}): artículos 120, 121, 124, 126 y 127; casa habitación, ${SELLER_ISR_RULES.homeExemptionArticle}. ${SELLER_ISR_RULES.updateFactorArticle}. Tarifa del ${FINANCIAL_SOURCES.isr.article} del SAT para 2026. Vigencia cargada: del ${SELLER_ISR_RULES.validFrom} al ${SELLER_ISR_RULES.validTo}. ${SELLER_ISR_RULES.url}`;
  const captured = [
    ["Precio de venta", fmt(data.salePrice)], ["Fecha estimada de la escritura", data.saleDate || "Pendiente"], ["Fecha en que se compró", data.acquisitionDate || "Pendiente"],
    ["Propietarios (partes iguales)", String(data.owners)], ["Casa habitación del vendedor", data.homeExemption ? data.noPriorExemption ? "Sí; sin otra exención en los últimos tres años" : "Sí, pero falta confirmar que no usó la exención en los últimos tres años" : "No"],
  ];
  if (isr.status === "pendiente") return { title: "Hoja de cálculo del ISR por la venta", summary: [summary("ISR estimado", "Pendiente")], sections: [
    { title: "Datos de la venta", columns: ["Concepto", "Valor"], rows: captured },
    { title: "Para calcularlo falta", columns: ["Dato"], rows: isr.missing.map(m => [m]) },
    { title: "Reglas y fuentes", text: sources },
  ], warnings: [ESTIMATE] };
  const cost: string[][] = c.costMode === "actualizado"
    ? [["Costo de adquisición actualizado (capturado)", fmt(c.updatedCost!)]]
    : [["Precio en que se compró", fmt(c.acquisitionCost!)], [`Terreno${c.landCost === null ? " (20% del costo, art. 124 fr. I)" : ""}`, fmt(isr.land!)], ["Construcción", fmt(isr.construction!)], [`Construcción menos 3% por ${isr.depreciationYears} ${isr.depreciationYears === 1 ? "año" : "años"} (mínimo 20%)`, fmt(isr.depreciatedConstruction!)], [`Factor de actualización (INPC ${decimalText(c.inpcSale!)} / ${decimalText(c.inpcAcquisition!)})`, decimalText(isr.factor!, 4, 4)]];
  cost.push([isr.costFloorApplied ? "Costo actualizado (mínimo: 10% del precio, art. 121)" : "Costo actualizado", fmt(isr.updatedCost)]);
  const gain = [["Precio de venta", fmt(data.salePrice)], ["Menos costo actualizado", fmt(isr.updatedCost)], ["Menos mejoras y ampliaciones", fmt(c.improvements!)], ["Menos gastos notariales, impuestos y avalúo", fmt(c.expenses!)], ["Menos comisión de la venta", fmt(c.commission!)], ["Ganancia", fmt(isr.gain)], ["Años para dividir la ganancia (máximo 20)", String(isr.yearsForTax)]];
  if (isr.exemptLimit !== null) gain.push([`Exención por casa habitación por propietario (700,000 UDIS × ${decimalText(data.udiValue!)})`, fmt(isr.exemptLimit)]);
  const multi = isr.owners.length > 1;
  return { title: "Hoja de cálculo del ISR por la venta", summary: [
    summary("ISR estimado a pagar ante notario", fmt(isr.provisional)), summary("Parte para el Estado (5% de la ganancia)", fmt(isr.state)), summary("Parte federal", fmt(isr.federal)), summary("Ganancia", fmt(isr.gain)),
  ], sections: [
    { title: "Datos de la venta", columns: ["Concepto", "Valor"], rows: captured },
    { title: "Costo de adquisición", columns: ["Concepto", "Importe"], rows: cost },
    { title: "Ganancia", columns: ["Concepto", "Importe"], rows: gain },
    multi
      ? { title: "ISR por propietario (pesos)", columns: ["Propietario", "Su parte del precio", "Exento", "Ganancia gravable", "ISR", "Estado", "Federal"], rows: isr.owners.map(o => [`Propietario ${o.owner}`, plain(o.price), plain(o.exempt), plain(o.taxableGain), plain(o.provisional), plain(o.state), plain(o.federal)]) }
      : { title: "ISR", columns: ["Concepto", "Importe"], rows: [...(isr.exemptLimit !== null ? [["Parte exenta del precio", fmt(isr.owners[0].exempt)]] : []), ["Ganancia gravable", fmt(isr.owners[0].taxableGain)], [`Ganancia gravable ÷ ${isr.yearsForTax} ${isr.yearsForTax === 1 ? "año" : "años"}`, fmt(isr.owners[0].quotient)], ["ISR a pagar ante notario", fmt(isr.provisional)], ["Parte para el Estado", fmt(isr.state)], ["Parte federal", fmt(isr.federal)]] },
    { title: "Cómo se calcula", text: `La ganancia es el precio menos el costo actualizado y las deducciones. Se divide entre los años transcurridos desde la compra (años completos, mínimo uno y máximo 20), al resultado se aplica la tarifa del pago provisional y lo obtenido se multiplica por los mismos años. Del total, el 5% de la ganancia se paga al Estado y se acredita; el resto es federal. ${c.costMode === "historico" ? "La construcción pierde 3% por año completo, sin bajar del 20% de su costo; terreno y construcción se actualizan con el INPC del mes de compra y del mes anterior a la venta, con factor al diezmilésimo y nunca menor a 1. " : ""}${isr.exemptLimit !== null ? "Como casa habitación, cada propietario no paga por su parte del precio hasta 700,000 UDIS; por el excedente se toma la ganancia en la proporción del excedente entre su parte del precio. " : ""}${multi ? "Cada propietario calcula por su parte, en partes iguales. " : ""}Mejoras, gastos e impuestos se capturan ya actualizados; la comisión de esta venta se deduce con su IVA.` },
    { title: "Reglas y fuentes", text: sources },
  ], warnings: [ESTIMATE, ...(data.homeExemption && !data.noPriorExemption ? ["Se calculó sin exención: el vendedor debe manifestar ante el notario que no vendió otra casa habitación exenta en los tres años anteriores."] : []), ...(isr.exemptLimit !== null ? ["La exención requiere que el notario compruebe que es la casa habitación del vendedor (por ejemplo, credencial y comprobantes de domicilio)."] : [])] };
}

/** El neto para el propietario y, si se calcula, la hoja del ISR (dos PDF). */
export function netResults(input: AppInput): { neto: AppResult; isr: AppResult | null } {
  const data = parse(netSchema, netInput(input));
  const fmt = (n: number) => moneyText(n, data.currency);
  const warnings: string[] = [ESTIMATE];
  const commission = netCommission(data);
  let isrValue: number | null = null, sheet: AppResult | null = null, exempt = false;
  if (data.isrMode === "calcular") {
    if (data.currency !== "MXN") warnings.push("El ISR se calcula en pesos. Cambia la moneda a MXN o captura el importe del ISR.");
    else {
      const isr = calculateSellerIsrCase(isrCase(data, commission.total));
      sheet = isrSheet(data, isr, commission.total);
      if (isr.status === "ok") { isrValue = isr.provisional; exempt = isr.exemptionApplied && isr.owners.some(o => o.exempt > 0); }
      else warnings.push(`Para calcular el ISR falta: ${isr.missing.join("; ").toLowerCase()}.`);
    }
  } else if (data.isrMode === "importe" && data.isrAmount !== null) isrValue = data.isrAmount;
  const charges: [string, number | null, string][] = [];
  if (data.commissionMode === "porcentaje") {
    charges.push([`Comisión (${data.commissionPercent === null ? "porcentaje pendiente" : percentText(data.commissionPercent)}) sin IVA`, commission.fee, "Pendiente"]);
    charges.push([`IVA de la comisión (${data.commissionVat}%)`, commission.vat, "Pendiente"]);
  } else charges.push(["Honorarios con impuestos", commission.total, "Pendiente"]);
  if (data.isrMode !== "incluido") charges.push([data.isrMode !== "calcular" ? "ISR por la venta" : exempt ? "ISR por la venta (estimación, con exención de casa habitación)" : "ISR por la venta (estimación)", isrValue, "Pendiente"]);
  charges.push([data.isrMode === "incluido" ? "Impuestos de la operación" : "Otros impuestos (por ejemplo, IVA de la construcción en un local)", data.taxes, "Pendiente"]);
  charges.push(["Saldo para liquidar el crédito", data.loan, "Pendiente"]);
  for (const [label, value] of charges) if (value === null) warnings.push(`Falta conocer: ${label.toLowerCase()}.`);
  for (const row of data.expenses) if (row.amount === null) warnings.push(`Falta el importe de ${row.concept} (${row.status}).`);
  const pendingRows = data.expenses.filter(r => r.status === "pendiente");
  const pending = total([...charges.flatMap(([, v]) => v === null ? [] : [v]), ...pendingRows.flatMap(r => r.amount === null ? [] : [r.amount])]);
  const historical = total(data.expenses.flatMap((r) => r.status === "pagado" && r.amount !== null ? [r.amount] : []));
  const complete = charges.every(([, v]) => v !== null) && pendingRows.every(r => r.amount !== null);
  const neto: AppResult = { title: "Estimación del neto del vendedor", summary: [
    summary("Precio de venta", fmt(data.salePrice)),
    summary("Comisión con IVA", commission.total === null ? "Pendiente" : fmt(commission.total)),
    ...(data.isrMode === "incluido" ? [] : [summary("ISR estimado", isrValue === null ? "Pendiente" : fmt(isrValue))]),
    summary("Cargos pendientes conocidos", fmt(pending)),
    summary(complete ? "Neto estimado" : "Neto preliminar conocido", fmt(cents(new D(data.salePrice).minus(pending)))),
    summary("Gastos históricos pagados", fmt(historical)),
  ], sections: [
    { title: "Cargos de cierre", columns: ["Concepto", "Importe", "Tratamiento"], rows: [...charges.map(([label, v, how]) => [label, v === null ? "Desconocido" : fmt(v), how]), ...data.expenses.map((r) => [r.concept, r.amount === null ? "Desconocido" : fmt(r.amount), r.status === "pagado" ? "Histórico; no se descuenta" : "Pendiente"])] },
    { title: "Alcance", text: "Se resta únicamente lo pendiente y conocido. Los gastos pagados son informativos y no se vuelven a descontar. El neto es una estimación, sujeta a liquidaciones, al cálculo del notario y a revisión fiscal; no es utilidad histórica." },
  ], warnings: [...new Set(warnings)] };
  return { neto, isr: sheet };
}
function net(input: AppInput): AppResult {
  const { neto, isr } = netResults(input);
  return isr ? { ...neto, sections: [...neto.sections ?? [], ...(isr.sections ?? []).map(s => ({ ...s, title: `ISR · ${s.title}` }))], warnings: [...new Set([...neto.warnings ?? [], ...isr.warnings ?? []])] } : neto;
}

const commissionSchema = z.object({ currency, mode: z.enum(["porcentaje", "fijo"]), base: optional(amount), percent: optional(percentage), fixed: optional(amount), taxPercent: optional(percentage), withholding: optional(amount), shares: z.array(z.object({ name, percent: percentage }).strict()).max(100) }).strict();
// Largest-remainder allocation: the assigned pool reconciles exactly, with ties in capture order.
function allocate(totalAmount: number, percentages: number[]): number[] {
  const raw = percentages.map((p) => new D(totalAmount).mul(p));
  const units = raw.map((v) => v.floor().toNumber());
  const target = raw.reduce((s, v) => s.plus(v), new D(0)).round().toNumber();
  let left = target - units.reduce((s, v) => s + v, 0);
  const order = raw.map((v, i) => ({ i, remainder: v.minus(units[i]) })).sort((a, b) => b.remainder.comparedTo(a.remainder) || a.i - b.i);
  for (const item of order) { if (left <= 0) break; units[item.i]++; left--; }
  return units.map((v) => new D(v).div(100).toNumber());
}
function commission(input: AppInput): AppResult {
  const data = parse(commissionSchema, input);
  if (data.mode === "porcentaje" && (data.base === null || data.percent === null)) throw new Error("Captura la base y el porcentaje de honorarios.");
  if (data.mode === "fijo" && data.fixed === null) throw new Error("Captura el honorario fijo.");
  const fee = data.mode === "fijo" ? data.fixed! : cents(new D(data.base!).mul(data.percent!).div(100));
  const tax = data.taxPercent === null ? null : cents(new D(fee).mul(data.taxPercent).div(100));
  const percentSum = data.shares.reduce((s, r) => s.plus(r.percent), new D(0));
  if (percentSum.gt(100)) throw new Error("El reparto no puede superar 100%.");
  const amounts = allocate(fee, data.shares.map((r) => r.percent));
  const fmt = (n: number) => moneyText(n, data.currency);
  const knownDue = cents(new D(fee).plus(tax ?? 0).minus(data.withholding ?? 0));
  if (knownDue < 0) throw new Error("La retención no puede exceder los honorarios y los impuestos conocidos.");
  return { title: "Honorarios y reparto", summary: [summary("Honorarios antes de impuestos", fmt(fee)), summary("Impuestos trasladados", tax === null ? "Desconocidos" : fmt(tax)), summary("Retenciones", data.withholding === null ? "Desconocidas" : fmt(data.withholding)), summary(tax === null || data.withholding === null ? "Cobro preliminar conocido" : "Total a cobrar", fmt(knownDue))], sections: [
    { title: "Reparto de honorarios antes de impuestos", columns: ["Participante", "Porcentaje", "Importe"], rows: [...data.shares.map((r, i) => [r.name, percentText(r.percent), fmt(amounts[i])]), ["Sin asignar", percentText(new D(100).minus(percentSum)), fmt(cents(new D(fee).minus(total(amounts))))]] },
    { title: "Base y redondeo", text: `${data.mode === "porcentaje" ? `Base ${fmt(data.base!)} × ${percentText(data.percent!)}.` : `Honorario fijo: ${fmt(fee)}.`} Los impuestos y retenciones se capturan expresamente; no se infiere el régimen fiscal. El reparto usa honorarios antes de impuestos. Los centavos se asignan por mayor residuo, en orden de captura en caso de empate.` },
  ], warnings: [...(tax === null ? ["Falta conocer los impuestos trasladados; escribe 0 si confirmaste que no aplican."] : []), ...(data.withholding === null ? ["Falta conocer las retenciones."] : [])] };
}

const layers = ["proyecto", "deuda", "capital"] as const;
const scenarios = ["base", "favorable", "adverso"] as const;
const layerLabel = { proyecto: "Proyecto", deuda: "Deuda", capital: "Capital" };
const scenarioLabel = { base: "Base", favorable: "Favorable", adverso: "Adverso" };
const flowSchema = z.object({ date, concept: name, amount: optional(signedAmount), layer: z.enum(layers), scenario: z.enum(scenarios), source: z.string().max(500), evidence: z.enum(["documentado", "declarado", "supuesto", "desconocido"]) }).strict();
const investmentSchema = z.object({ currency, priceBasis: z.literal("nominal"), taxBasis: z.enum(["antes", "despues"]), costsComplete: z.boolean(), rates: z.object({ proyecto: optional(numeric(0, 1000)), deuda: optional(numeric(0, 1000)), capital: optional(numeric(0, 1000)) }).strict(), flows: z.array(flowSchema).min(1, "Agrega al menos un flujo").max(600), notes: z.string().max(4000) }).strict();
type Flow = z.output<typeof flowSchema>;
type Dated = { date: string; amount: number };
function grouped(rows: Flow[]): Dated[] {
  const dates = new Map<string, InstanceType<typeof D>>();
  for (const row of rows) {
    if (row.amount === null) throw new Error("Un flujo sin importe no puede calcularse.");
    dates.set(row.date, (dates.get(row.date) ?? new D(0)).plus(row.amount));
  }
  return [...dates].sort(([a], [b]) => a.localeCompare(b)).map(([date, amount]) => ({ date, amount: cents(amount) }));
}
function npv(rows: Dated[], rate: number): number {
  const start = Date.parse(rows[0].date);
  const result = rows.reduce((s, r) => s.plus(new D(r.amount).div(new D(1).plus(new D(rate).div(100)).pow(new D(Date.parse(r.date) - start).div(86_400_000).div(365)))), new D(0));
  return cents(result);
}
function irr(rows: Dated[]): { value: number | null; reason: string } {
  const nonzero = rows.filter((r) => r.amount !== 0);
  let changes = 0;
  for (let i = 1; i < nonzero.length; i++) if (Math.sign(nonzero[i].amount) !== Math.sign(nonzero[i - 1].amount)) changes++;
  if (changes !== 1 || nonzero[0]?.amount >= 0) return { value: null, reason: changes > 1 ? "múltiples cambios de signo" : "se requiere una salida inicial seguida de entradas en fechas posteriores" };
  const start = Date.parse(nonzero[0].date);
  const terms = nonzero.map((r) => ({ amount: r.amount, years: (Date.parse(r.date) - start) / 86_400_000 / 365 }));
  // Solve in log(1+r) space. Scaling keeps long horizons finite without changing the root.
  const fn = (x: number) => {
    const exponents = terms.map((r) => -x * r.years);
    const scale = Math.max(...exponents);
    return terms.reduce((s, r, i) => s.plus(new D(r.amount).mul(Math.exp(exponents[i] - scale))), new D(0)).toNumber();
  };
  let lo = -27.631, hi = Math.log(1_000_001);
  if (!(fn(lo) > 0 && fn(hi) < 0)) return { value: null, reason: "no se encontró una raíz en el intervalo numérico (-100%, 100,000,000%)" };
  for (let i = 0; i < 100; i++) { const mid = (lo + hi) / 2; if (fn(mid) > 0) lo = mid; else hi = mid; }
  const result = Math.expm1((lo + hi) / 2) * 100;
  return Number.isFinite(result) ? { value: result, reason: "" } : { value: null, reason: "no convergió una raíz finita" };
}
function investment(input: AppInput): AppResult {
  const data = parse(investmentSchema, input);
  const fmt = (n: number) => moneyText(n, data.currency);
  const warnings: string[] = [];
  const rows: string[][] = [];
  for (const scenario of scenarios) for (const layer of layers) {
    const flows = data.flows.filter((r) => r.scenario === scenario && r.layer === layer);
    const prefix = `${scenarioLabel[scenario]} / ${layerLabel[layer]}`;
    if (!flows.length || flows.some((r) => r.amount === null)) {
      warnings.push(`${prefix}: ${flows.length ? "hay un importe desconocido" : "no hay flujos capturados"}; las métricas no están determinadas.`);
      rows.push([scenarioLabel[scenario], layerLabel[layer], blank, blank, blank, blank, "No determinada", blank]);
      continue;
    }
    const dates = grouped(flows);
    const outflows = total(flows.flatMap((r) => r.amount! < 0 ? [-r.amount!] : []));
    const profit = total(dates.map((r) => r.amount));
    let balance = new D(0), deficit = new D(0);
    for (const row of dates) { balance = balance.plus(row.amount); deficit = D.max(deficit, balance.negated()); }
    const tir = irr(dates);
    if (tir.value === null) warnings.push(`${prefix}: TIR no determinada (${tir.reason}).`);
    const rate = data.rates[layer];
    if (rate === null) warnings.push(`${prefix}: falta la tasa exigida para calcular VAN.`);
    rows.push([scenarioLabel[scenario], layerLabel[layer], fmt(outflows), fmt(profit), outflows ? ratioText(new D(profit).div(outflows).mul(100)) : blank, rate === null ? blank : fmt(npv(dates, rate)), tir.value === null ? "No determinada" : ratioText(tir.value), fmt(cents(deficit))]);
  }
  if (!data.costsComplete) warnings.push("Evaluación preliminar: no se ha confirmado que todos los costos, impuestos y obligaciones aplicables estén incluidos.");
  if (data.flows.some((r) => !r.source.trim() || r.evidence === "desconocido")) warnings.push("Hay flujos sin fuente o con evidencia desconocida; verifica los supuestos antes de decidir.");
  const reconciliation: string[][] = [];
  for (const scenario of scenarios) {
    const all = data.flows.filter((f) => f.scenario === scenario);
    if (!layers.every((layer) => all.some((r) => r.layer === layer)) || all.some((r) => r.amount === null)) continue;
    for (const dt of [...new Set(all.map((f) => f.date))].sort()) {
      const atDate = all.filter((f) => f.date === dt);
      const projectDebt = total(atDate.filter((f) => f.layer !== "capital").map((f) => f.amount!));
      const capital = total(atDate.filter((f) => f.layer === "capital").map((f) => f.amount!));
      const delta = cents(new D(projectDebt).minus(capital));
      reconciliation.push([scenarioLabel[scenario], dt, fmt(projectDebt), fmt(capital), fmt(delta)]);
      if (delta) warnings.push(`${scenarioLabel[scenario]}, ${dt}: concilia la diferencia entre proyecto + deuda y capital (${fmt(delta)}); puede corresponder a reservas, participaciones o caja retenida.`);
    }
  }
  return { title: "Evaluación de inversión", summary: [summary("Moneda y precios", `${data.currency} · nominales`), summary("Tratamiento fiscal", data.taxBasis === "antes" ? "Antes de impuestos" : "Después de impuestos capturados"), summary("Base del VAN", "Fechas efectivas / 365 días"), summary("Horizonte capturado", `${[...data.flows].sort((a, b) => a.date.localeCompare(b.date))[0].date} a ${[...data.flows].sort((a, b) => b.date.localeCompare(a.date))[0].date}`)], sections: [
    { title: "Escenarios y capas", columns: ["Escenario", "Capa", "Egresos / denominador ROI", "Beneficio neto de caja", "ROI acumulado", "VAN", "TIR anual", "Déficit máximo"], rows },
    { title: "Flujos capturados", columns: ["Escenario", "Capa", "Fecha", "Concepto", "Importe", "Evidencia", "Fuente"], rows: data.flows.map((r) => [scenarioLabel[r.scenario], layerLabel[r.layer], r.date, r.concept, r.amount === null ? "Desconocido" : fmt(r.amount), r.evidence, r.source || "Sin fuente"]) },
    ...(reconciliation.length ? [{ title: "Conciliación de capas", columns: ["Escenario", "Fecha", "Proyecto + deuda", "Capital", "Diferencia"], rows: reconciliation }] : []),
    { title: "Convenciones y supuestos", text: `Entradas positivas; salidas negativas. ROI = beneficio / suma bruta de egresos de cada capa (en capital: aportaciones), sin netear movimientos del día; no es anual. ROI y TIR se muestran redondeados a dos decimales. VAN y TIR agrupan flujos por fecha. Déficit máximo: mayor saldo acumulado negativo al cierre de cada fecha, sin reserva adicional. Tasas exigidas anuales: ${layers.map((l) => `${layerLabel[l]} ${data.rates[l] === null ? "no capturada" : percentText(data.rates[l]!)}`).join("; ")}. Flujos en una sola moneda; incorpora las conversiones con fuente en cada concepto. La capa capital registra aportaciones y distribuciones reales después de financiamiento; las tres capas no se suman entre sí. La rentabilidad calculada no acredita viabilidad jurídica, disponibilidad de capital ni resultado futuro.${data.notes ? ` Supuestos adicionales: ${data.notes}` : ""}` },
  ], warnings: [...new Set(warnings)] };
}

const rehabSchema = z.object({ currency, contingencyPercent: percentage, items: z.array(z.object({ concept: name, unit: name, quantity: numeric(0.000001, 1e8), price: amount, taxPercent: percentage }).strict()).min(1, "Agrega una partida").max(200), payments: z.array(z.object({ concept: name, date, percent: percentage }).strict()).min(1, "Agrega al menos un desembolso").max(100) }).strict();
function rehabData(input: AppInput) {
  const data = parse(rehabSchema, input);
  const parts = data.items.map((r) => { const base = cents(new D(r.quantity).mul(r.price)); const tax = cents(new D(base).mul(r.taxPercent).div(100)); return { ...r, base, tax, total: total([base, tax]) }; });
  const base = total(parts.map((r) => r.base)), tax = total(parts.map((r) => r.tax));
  const contingency = cents(new D(base).plus(tax).mul(data.contingencyPercent).div(100));
  const budget = total([base, tax, contingency]);
  if (budget > MAX_MONEY) throw new Error("El presupuesto excede el límite de cálculo.");
  const distribution = data.payments.reduce((s, r) => s.plus(r.percent), new D(0));
  if (!distribution.eq(100)) throw new Error("Los desembolsos deben sumar exactamente 100% del presupuesto.");
  const payments = allocate(budget, data.payments.map((r) => r.percent));
  return { data, parts, base, tax, contingency, budget, payments };
}
function rehabilitation(input: AppInput): AppResult {
  const r = rehabData(input), fmt = (n: number) => moneyText(n, r.data.currency);
  return { title: "Presupuesto de rehabilitación", summary: [summary("Subtotal", fmt(r.base)), summary("Impuestos capturados", fmt(r.tax)), summary("Contingencia", fmt(r.contingency)), summary("Presupuesto total", fmt(r.budget))], sections: [
    { title: "Partidas", columns: ["Concepto", "Unidad", "Cantidad", "Precio unitario", "Base", "Impuestos", "Total"], rows: r.parts.map((p) => [p.concept, p.unit, String(p.quantity), fmt(p.price), fmt(p.base), fmt(p.tax), fmt(p.total)]) },
    { title: "Desembolsos", columns: ["Fecha", "Concepto", "Porcentaje", "Importe"], rows: r.data.payments.map((p, i) => [p.date, p.concept, percentText(p.percent), fmt(r.payments[i])]) },
    { title: "Criterio del presupuesto", text: `Precios unitarios antes de impuestos. Contingencia ${percentText(r.data.contingencyPercent)} sobre subtotal más impuestos; se distribuye dentro de los desembolsos. Los impuestos capturados son supuestos de cada partida. El redondeo de desembolsos conserva el presupuesto al centavo.` },
  ], warnings: ["Presupuesto sujeto a alcance, cantidades, cotizaciones y fechas capturados; no incluye partidas omitidas."] };
}
export function rehabilitationTransfer(input: AppInput): AppInput {
  const r = rehabData({ ...getFinancialDefaults("rehabilitacion"), ...input });
  return { ...getFinancialDefaults("inversiones"), currency: r.data.currency, notes: "Desembolsos importados del presupuesto de rehabilitación, incluida su contingencia. Los tres escenarios conservan el mismo presupuesto inicial para revisión. Completa adquisición, ingresos, demás costos, financiamiento, capital y tasas.", flows: scenarios.flatMap((scenario) => r.data.payments.map((p, i) => ({ scenario, layer: "proyecto", date: p.date, concept: `Rehabilitación: ${p.concept}`, amount: -r.payments[i], source: "Presupuesto de rehabilitación transferido", evidence: "supuesto" }))) };
}

const conversionSchema = z.object({ category: z.enum(["area", "longitud", "moneda"]), amount: numeric(), from: z.string(), to: z.string(), rate: optional(numeric(0.000001, 10000)), rateSource: z.string().max(500), rateDate: z.string() }).strict();
function converter(input: AppInput): AppResult {
  const data = parse(conversionSchema, input);
  const units: Record<string, { label: string; factor: string; category: string }> = { m2: { label: "m²", factor: "1", category: "area" }, ft2: { label: "ft²", factor: "0.09290304", category: "area" }, ha: { label: "ha", factor: "10000", category: "area" }, m: { label: "m", factor: "1", category: "longitud" }, ft: { label: "ft", factor: "0.3048", category: "longitud" } };
  if (data.category === "moneda") {
    if (new D(data.amount).decimalPlaces() > 2) throw new Error("La moneda de origen admite como máximo dos decimales.");
    if (!["MXN", "USD"].includes(data.from) || !["MXN", "USD"].includes(data.to)) throw new Error("Selecciona monedas compatibles.");
    if (data.rate === null || !data.rateSource.trim() || !date.safeParse(data.rateDate).success) throw new Error("Captura un tipo de cambio positivo (MXN por USD), su fuente y fecha.");
    const converted = data.from === data.to ? data.amount : data.from === "USD" ? new D(data.amount).mul(data.rate) : new D(data.amount).div(data.rate);
    return { title: "Conversión de moneda", summary: [summary("Origen", moneyText(data.amount, data.from)), summary("Resultado", moneyText(converted, data.to))], sections: [{ title: "Tipo de cambio utilizado", text: `${data.rate} MXN por USD · fecha ${data.rateDate} · fuente: ${data.rateSource}. Tipo de cambio manual congelado para este cálculo; no se actualiza automáticamente.` }], warnings: [] };
  }
  const from = units[data.from], to = units[data.to];
  if (!from || !to || from.category !== data.category || to.category !== data.category) throw new Error("Selecciona unidades de la misma magnitud.");
  const converted = new D(data.amount).mul(from.factor).div(to.factor);
  return { title: "Conversión de unidades", summary: [summary("Origen", `${decimalText(data.amount)} ${from.label}`), summary("Resultado", `${decimalText(converted)} ${to.label}`)], sections: [{ title: "Equivalencias", text: "1 ft = 0.3048 m; 1 ft² = 0.09290304 m²; 1 ha = 10,000 m². Resultado mostrado hasta ocho decimales." }], warnings: [] };
}

export function calculateFinancial(slug: string, input: AppInput): AppResult {
  const data = slug === "neto-propietario" ? netInput(input) : { ...getFinancialDefaults(slug), ...input };
  switch (slug) {
    case "hipoteca": return mortgage(data);
    case "neto-propietario": return net(data);
    case "comisiones": return commission(data);
    case "inversiones": return investment(data);
    case "rehabilitacion": return rehabilitation(data);
    case "conversor": return converter(data);
    default: throw new Error("Herramienta financiera desconocida");
  }
}
