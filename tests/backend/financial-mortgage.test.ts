import { expect, test } from "vitest";
import {
  calculateMortgage,
  convertPrice,
  paymentCapacity,
} from "@/lib/finance/mortgage";
import { sumMoney } from "@/lib/finance/money";
const input = {
  price: 3000000,
  downPercent: 20,
  annualRate: 10.5,
  months: 240,
  firstPayment: "2026-11-30",
  insurance: 1000,
  monthlyFee: 0,
  openingFee: 24000,
  extraMonthly: 0,
  extraOnce: 0,
  extraMonth: 12,
  prepaymentFee: 0,
  prepaymentMode: "term" as const,
};
test("independently calculated fixed payment and amortization conserve capital", () => {
  const result = calculateMortgage(input);
  expect(result.payment).toBe(23961.12);
  expect(result.principal).toBe(2400000);
  expect(result.schedule).toHaveLength(240);
  expect(result.schedule.at(-1)!.balance).toBe(0);
  expect(sumMoney(result.schedule.map((r) => r.principal + r.extra))).toBe(
    result.principal,
  );
  expect(result.schedule[0].interest).toBe(21000);
  expect(result.schedule[0].date).toBe("2026-11-30");
  expect(result.schedule[3].date).toBe("2027-02-28");
});
test("zero-rate and cash purchases produce finite results without phantom interest", () => {
  const result = calculateMortgage({
    ...input,
    price: 120000,
    downPercent: 0,
    annualRate: 0,
    months: 12,
  });
  expect(result.payment).toBe(10000);
  expect(result.interest).toBe(0);
  const cash = calculateMortgage({ ...input, downPercent: 100 });
  expect(cash.schedule).toHaveLength(0);
  expect(cash.payment).toBe(0);
  expect(cash.totalKnownCost).toBe(0);
});
test("monthly prepayments shorten term and save interest with no negative balance", () => {
  const baseline = calculateMortgage(input);
  const result = calculateMortgage({ ...input, extraMonthly: 10000 });
  expect(result.schedule.length).toBeLessThan(240);
  expect(result.interest).toBeLessThan(baseline.interest);
  expect(result.interestSaved).toBe(
    sumMoney([baseline.interest, -result.interest]),
  );
  expect(sumMoney(result.schedule.map((r) => r.principal + r.extra))).toBe(
    result.principal,
  );
  expect(result.schedule.every((r) => r.balance >= 0)).toBe(true);
});
test("one-time prepayments reduce subsequent installments while retaining maturity", () => {
  const result = calculateMortgage({
    ...input,
    extraOnce: 600000,
    extraMonth: 12,
    prepaymentMode: "payment",
  });
  expect(result.schedule[11].extra).toBe(600000);
  expect(result.schedule[12].payment).toBeLessThan(result.payment);
  expect(result.schedule).toHaveLength(240);
  expect(result.schedule.at(-1)!.balance).toBe(0);
});
test("pending quotes never imply zero fees and excessive prepayments are capped", () => {
  const result = calculateMortgage({
    ...input,
    insurance: null,
    openingFee: null,
    extraOnce: 5000000,
    extraMonth: 1,
    prepaymentFee: null,
  });
  expect(result.pending).toEqual(
    expect.arrayContaining([
      "Seguro mensual",
      "Apertura",
      "Comisión por pagos anticipados",
    ]),
  );
  expect(result.schedule).toHaveLength(1);
  expect(result.schedule[0].extra).toBe(2397038.88);
  expect(result.schedule[0].balance).toBe(0);
});
test("USD listing conversion is explicit and affordability does not promise approval", () => {
  expect(convertPrice(150000, "USD", null)).toBeNull();
  expect(convertPrice(150000, "USD", 20)).toBe(3000000);
  expect(convertPrice(3000000, "MXN", null)).toBe(3000000);
  expect(paymentCapacity(100000, 15000, 35)).toBe(20000);
  expect(paymentCapacity(10000, 15000, 35)).toBe(0);
});
test("invalid rates, dates, terms and input precision cannot enter the schedule", () => {
  expect(() => calculateMortgage({ ...input, annualRate: 26 })).toThrow();
  expect(() => calculateMortgage({ ...input, months: 0 })).toThrow();
  expect(() =>
    calculateMortgage({ ...input, firstPayment: "2026-02-30" }),
  ).toThrow();
  expect(() => calculateMortgage({ ...input, extraMonthly: -1 })).toThrow();
});
