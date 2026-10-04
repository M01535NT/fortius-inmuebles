import { D, cents, checkAmount, sumMoney, validIsoDate } from "./money";
export type MortgageInput = {
  price: number;
  downPercent: number;
  annualRate: number;
  months: number;
  firstPayment: string;
  insurance: number | null;
  monthlyFee: number | null;
  openingFee: number | null;
  extraMonthly: number;
  extraOnce: number;
  extraMonth: number;
  prepaymentFee: number | null;
  prepaymentMode: "term" | "payment";
};
export type Installment = {
  month: number;
  date: string;
  payment: number;
  interest: number;
  principal: number;
  extra: number;
  balance: number;
  knownOutlay: number;
};
function installment(principal: number, rate: number, months: number): number {
  if (!principal) return 0;
  const r = new D(rate).div(1200);
  if (r.isZero()) return cents(new D(principal).div(months));
  return cents(
    new D(principal).mul(r).div(new D(1).minus(new D(1).plus(r).pow(-months))),
  );
}
function paymentDate(first: string, offset: number): string {
  const [year, month, day] = first.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + offset, 1));
  const end = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
  ).getUTCDate();
  date.setUTCDate(Math.min(day, end));
  return date.toISOString().slice(0, 10);
}
function schedule(
  input: MortgageInput,
  principal: number,
  extras: boolean,
): Installment[] {
  const rows: Installment[] = [];
  let balance = principal,
    payment = installment(principal, input.annualRate, input.months);
  for (let month = 1; month <= input.months && balance > 0; month++) {
    const interest = cents(new D(balance).mul(input.annualRate).div(1200));
    const paidPrincipal =
      month === input.months
        ? balance
        : cents(D.min(balance, D.max(0, new D(payment).minus(interest))));
    const extra = extras
      ? cents(
          D.min(
            new D(balance).minus(paidPrincipal),
            new D(input.extraMonthly).plus(
              month === input.extraMonth ? input.extraOnce : 0,
            ),
          ),
        )
      : 0;
    balance = cents(new D(balance).minus(paidPrincipal).minus(extra));
    const actualPayment = sumMoney([paidPrincipal, interest]);
    rows.push({
      month,
      date: paymentDate(input.firstPayment, month - 1),
      payment: actualPayment,
      interest,
      principal: paidPrincipal,
      extra,
      balance,
      knownOutlay: sumMoney([
        actualPayment,
        extra,
        input.insurance ?? 0,
        input.monthlyFee ?? 0,
      ]),
    });
    if (extra > 0 && input.prepaymentMode === "payment" && month < input.months)
      payment = installment(balance, input.annualRate, input.months - month);
  }
  return rows;
}
export function calculateMortgage(input: MortgageInput) {
  [
    input.price,
    input.extraMonthly,
    input.extraOnce,
    ...[
      input.insurance,
      input.monthlyFee,
      input.openingFee,
      input.prepaymentFee,
    ].filter((v): v is number => v !== null),
  ].forEach(checkAmount);
  if (
    !Number.isFinite(input.downPercent) ||
    input.downPercent < 0 ||
    input.downPercent > 100 ||
    !Number.isFinite(input.annualRate) ||
    input.annualRate < 0 ||
    input.annualRate > 25 ||
    !Number.isInteger(input.months) ||
    input.months < 1 ||
    input.months > 360 ||
    !Number.isInteger(input.extraMonth) ||
    input.extraMonth < 1 ||
    input.extraMonth > input.months ||
    !validIsoDate(input.firstPayment) ||
    !["term", "payment"].includes(input.prepaymentMode)
  )
    throw new RangeError("Parámetros de crédito inválidos");
  const downPayment = cents(new D(input.price).mul(input.downPercent).div(100));
  const principal = cents(new D(input.price).minus(downPayment));
  const rows = schedule(input, principal, true);
  const baseline =
    input.extraMonthly > 0 || input.extraOnce > 0
      ? schedule(input, principal, false)
      : rows;
  const interest = sumMoney(rows.map((r) => r.interest));
  const extraPaid = sumMoney(rows.map((r) => r.extra));
  const pending: string[] = [];
  if (principal > 0) {
    if (input.insurance === null) pending.push("Seguro mensual");
    if (input.monthlyFee === null) pending.push("Administración mensual");
    if (input.openingFee === null) pending.push("Apertura");
    if (extraPaid > 0 && input.prepaymentFee === null)
      pending.push("Comisión por pagos anticipados");
  }
  const fees =
    principal === 0
      ? 0
      : sumMoney([
          input.openingFee ?? 0,
          extraPaid > 0 ? (input.prepaymentFee ?? 0) : 0,
          cents(
            new D(rows.length).mul(
              sumMoney([input.insurance ?? 0, input.monthlyFee ?? 0]),
            ),
          ),
        ]);
  return {
    principal,
    downPayment,
    payment: installment(principal, input.annualRate, input.months),
    schedule: rows,
    baseline,
    interest,
    extraPaid,
    interestSaved: cents(
      new D(sumMoney(baseline.map((r) => r.interest))).minus(interest),
    ),
    monthsSaved: baseline.length - rows.length,
    totalKnownCost: sumMoney([principal, interest, fees]),
    fees,
    pending,
    complete: pending.length === 0,
    knownMonthlyPayment: rows[0]?.knownOutlay ?? 0,
  };
}
export type MortgageResult = ReturnType<typeof calculateMortgage>;
export function convertPrice(
  price: number,
  currency: "MXN" | "USD",
  rate: number | null,
): number | null {
  checkAmount(price);
  if (currency === "MXN") return cents(price);
  if (rate === null || !Number.isFinite(rate) || rate <= 0 || rate > 100)
    return null;
  const converted = cents(new D(price).mul(rate));
  checkAmount(converted);
  return converted;
}
export function paymentCapacity(
  income: number,
  debts: number,
  percent: number,
): number {
  [income, debts].forEach(checkAmount);
  if (!Number.isFinite(percent) || percent < 1 || percent > 100)
    throw new RangeError("Proporción inválida");
  return cents(D.max(0, new D(income).mul(percent).div(100).minus(debts)));
}
