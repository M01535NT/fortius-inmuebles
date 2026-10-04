import {
  ACQUISITION_RULES,
  FINANCIAL_SOURCES,
  SELLER_ISR_BRACKETS,
  type Municipality,
} from "@/data/financial-rules";
import { D, cents, checkAmount, sumMoney, supportedFiscalDate } from "./money";

export function calculateAcquisitionTax(input: {
  municipality: Municipality;
  date: string;
  taxBase: number | null;
}) {
  const rule = ACQUISITION_RULES[input.municipality];
  const pending = (reason: string) => ({
    amount: null,
    tariff: null,
    surcharge: null,
    reason,
    source: rule.url,
    article: rule.article,
  });
  if (!supportedFiscalDate(input.date))
    return pending("Las tarifas disponibles corresponden a 2026.");
  if (input.taxBase === null || input.taxBase === 0)
    return pending("Falta la base gravable determinada para esta operación.");
  checkAmount(input.taxBase);
  const uma = new D(
    input.date < "2026-02-01"
      ? FINANCIAL_SOURCES.uma2025.daily
      : FINANCIAL_SOURCES.uma2026.daily,
  );
  const base = new D(input.taxBase);
  const units = rule.unit === "UMA" ? base.div(uma) : base.toDecimalPlaces(2);
  if (rule.unit === "UMA" && units.minus("49496.20").abs().lte("0.0001"))
    return pending(
      "La tabla publicada superpone dos rangos en esta base. Captura la determinación municipal con tu presupuesto notarial.",
    );
  const matches = rule.brackets.filter(
    ([lo, hi]) => units.gte(lo) && (hi === null || units.lte(hi)),
  );
  if (matches.length !== 1)
    return pending(
      "Esta base queda entre límites de la tabla publicada; requiere determinación municipal.",
    );
  const [lo, , fixed, percent] = matches[0];
  const raw = units.minus(lo).mul(percent).div(100).plus(fixed);
  const tariff = cents(rule.unit === "UMA" ? raw.mul(uma) : raw);
  const surcharge = cents(base.mul(rule.surcharge).div(100));
  return {
    amount: sumMoney([tariff, surcharge]),
    tariff,
    surcharge,
    source: rule.url,
    article: rule.article,
  };
}

export function registrationFees(
  date: string,
  mortgage: boolean,
  notices = 2,
): number | null {
  if (!Number.isInteger(notices) || notices < 0 || notices > 4)
    throw new RangeError("Avisos inválidos");
  if (
    !supportedFiscalDate(date) ||
    date < FINANCIAL_SOURCES.registration.validFrom
  )
    return null;
  const r = FINANCIAL_SOURCES.registration;
  return cents(
    new D(r.ownership)
      .plus(r.analysis)
      .plus(new D(r.notice).mul(notices))
      .plus(mortgage ? r.mortgage : 0),
  );
}

export type SellerIsrInput = {
  price: number;
  updatedAcquisitionCost: number | null;
  updatedDeductions: number | null;
  fiscalYears: number | null;
  date: string;
};
export function calculateSellerIsr(input: SellerIsrInput) {
  if (
    !supportedFiscalDate(input.date) ||
    input.updatedAcquisitionCost === null ||
    input.updatedDeductions === null ||
    input.fiscalYears === null ||
    !Number.isInteger(input.fiscalYears) ||
    input.fiscalYears < 1 ||
    input.fiscalYears > 100
  )
    return null;
  [input.price, input.updatedAcquisitionCost, input.updatedDeductions].forEach(
    checkAmount,
  );
  const years = Math.min(20, input.fiscalYears);
  const acquisitionCost = cents(
    D.max(input.updatedAcquisitionCost, new D(input.price).mul("0.1")),
  );
  const gain = cents(
    D.max(
      0,
      new D(input.price).minus(acquisitionCost).minus(input.updatedDeductions),
    ),
  );
  const quotient = new D(gain).div(years).toDecimalPlaces(2);
  const bracket = SELLER_ISR_BRACKETS.find(
    ([lo, hi]) => quotient.gte(lo) && (hi === null || quotient.lte(hi)),
  );
  if (gain > 0 && !bracket) return null;
  const provisional = bracket
    ? cents(
        quotient
          .minus(bracket[0])
          .mul(bracket[3])
          .div(100)
          .plus(bracket[2])
          .mul(years),
      )
    : 0;
  const state = cents(D.min(provisional, new D(gain).mul("0.05")));
  return {
    gain,
    years,
    acquisitionCost,
    provisional,
    state,
    federal: cents(new D(provisional).minus(state)),
  };
}

export type BudgetItem = {
  key: string;
  label: string;
  amount: number | null;
  kind: "rule" | "quote" | "input" | "pending";
  note?: string;
  source?: string;
};
type Common = {
  municipality: Municipality;
  date: string;
  price: number;
  other: number | null;
};
export type BuyerBudgetInput = Common & {
  profile: "buyer";
  taxBase: number | null;
  downPayment: number;
  loan: number;
  registrationQuote?: number | null;
  preventiveNotices?: number;
  notary: number | null;
  appraisal: number | null;
  openingFee: number | null;
  baseIsAssumed?: boolean;
  isaiQuote?: number | null;
};
export type SellerBudgetInput = Common & {
  profile: "seller";
  commissionPercent: number | null;
  vatPercent: number;
  commissionIncludesVat: boolean;
  mortgagePayoff: number | null;
  cancellation: number | null;
  isr: number | null;
  isrIsSimulated?: boolean;
};
export function calculateClosingBudget(
  input: BuyerBudgetInput | SellerBudgetInput,
) {
  checkAmount(input.price);
  const items: BudgetItem[] = [];
  const add = (
    key: string,
    label: string,
    amount: number | null,
    kind: BudgetItem["kind"],
    note?: string,
    source?: string,
  ) => {
    if (amount !== null) checkAmount(amount);
    items.push({
      key,
      label,
      amount,
      kind: amount === null ? "pending" : kind,
      note,
      source,
    });
  };
  let payoff: number | null = 0;
  if (input.profile === "buyer") {
    [input.downPayment, input.loan].forEach(checkAmount);
    if (
      new D(input.downPayment)
        .plus(input.loan)
        .minus(input.price)
        .abs()
        .gt("0.01")
    )
      throw new RangeError("Enganche y crédito deben sumar el precio");
    const tax = calculateAcquisitionTax(input);
    add(
      "isai",
      "Impuesto de adquisición (ISAI)",
      input.isaiQuote ?? tax.amount,
      input.isaiQuote != null ? "quote" : "rule",
      input.isaiQuote != null
        ? "Determinación capturada."
        : tax.amount === null
          ? tax.reason
          : input.baseIsAssumed
            ? "Base supuesta igual al precio; requiere determinar la base fiscal."
            : "Calculado sobre la base gravable capturada.",
      tax.source,
    );
    const notices = input.preventiveNotices ?? 2;
    add(
      "registration",
      "Registro Público",
      input.registrationQuote ??
        registrationFees(input.date, input.loan > 0, notices),
      input.registrationQuote != null ? "quote" : "rule",
      `${notices} avisos, un análisis, una compraventa${input.loan > 0 ? " y una hipoteca" : ""}. La cotización sustituye este desglose.`,
      FINANCIAL_SOURCES.registration.url,
    );
    add(
      "notary",
      "Honorarios y gestión notarial",
      input.notary,
      "quote",
      "Incluye IVA; excluye ISAI y Registro para evitar duplicarlos.",
    );
    add("appraisal", "Avalúo", input.appraisal, "quote");
    add(
      "opening",
      "Apertura del crédito",
      input.loan === 0 ? 0 : input.openingFee,
      "quote",
    );
  } else {
    if (
      input.commissionPercent !== null &&
      (!Number.isFinite(input.commissionPercent) ||
        input.commissionPercent < 0 ||
        input.commissionPercent > 20)
    )
      throw new RangeError("Comisión inválida");
    if (![0, 8, 16].includes(input.vatPercent))
      throw new RangeError("IVA inválido");
    const gross =
      input.commissionPercent === null
        ? null
        : cents(new D(input.price).mul(input.commissionPercent).div(100));
    const fee =
      gross === null
        ? null
        : input.commissionIncludesVat
          ? cents(
              new D(gross).div(new D(1).plus(new D(input.vatPercent).div(100))),
            )
          : gross;
    const vat =
      gross === null || fee === null
        ? null
        : input.commissionIncludesVat
          ? cents(new D(gross).minus(fee))
          : cents(new D(fee).mul(input.vatPercent).div(100));
    add("commission", "Comisión sin IVA", fee, "input");
    add(
      "vat",
      "IVA de la comisión",
      vat,
      "input",
      "Tasa de la factura; no se presume un estímulo fronterizo.",
    );
    add("cancellation", "Cancelación de hipoteca", input.cancellation, "quote");
    add(
      "isr",
      "ISR por venta",
      input.isr,
      input.isrIsSimulated ? "rule" : "quote",
      input.isrIsSimulated
        ? "Pago provisional simulado; no es la declaración anual ni aplica exenciones."
        : "Importe determinado para esta operación.",
      FINANCIAL_SOURCES.isr.url,
    );
    payoff = input.mortgagePayoff;
    if (payoff !== null) checkAmount(payoff);
  }
  add("other", "Otros gastos", input.other, "quote");
  const pending = items.filter((i) => i.amount === null).map((i) => i.label);
  if (payoff === null) pending.push("Saldo para liquidar la hipoteca");
  const knownExpenses = sumMoney(
    items.flatMap((i) => (i.amount === null ? [] : [i.amount])),
  );
  return {
    items,
    knownExpenses,
    pending,
    complete: pending.length === 0,
    cashRequired:
      input.profile === "buyer"
        ? sumMoney([input.downPayment, knownExpenses])
        : undefined,
    sellerNet:
      input.profile === "seller"
        ? cents(new D(input.price).minus(knownExpenses).minus(payoff ?? 0))
        : undefined,
    knownPayoff: payoff,
  };
}
