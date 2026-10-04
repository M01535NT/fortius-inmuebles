import { expect, test } from "vitest";
import {
  calculateAcquisitionTax,
  calculateClosingBudget,
  calculateSellerIsr,
  registrationFees,
} from "@/lib/finance/closing";

test("2026 municipal tariffs use official brackets, including Ensenada's surcharge", () => {
  const date = "2026-10-04";
  expect(
    calculateAcquisitionTax({
      municipality: "tijuana",
      date,
      taxBase: 3_000_000,
    }),
  ).toMatchObject({ amount: 69080.07 });
  expect(
    calculateAcquisitionTax({
      municipality: "rosarito",
      date,
      taxBase: 3_000_000,
    }),
  ).toMatchObject({ amount: 76500, surcharge: 0 });
  expect(
    calculateAcquisitionTax({
      municipality: "tecate",
      date,
      taxBase: 3_000_000,
    }),
  ).toMatchObject({ amount: 91250 });
  expect(
    calculateAcquisitionTax({
      municipality: "ensenada",
      date,
      taxBase: 3_000_000,
    }),
  ).toMatchObject({ amount: 76500, tariff: 69000, surcharge: 7500 });
});

test("missing bases, unsupported dates and ambiguous Tijuana bounds stay pending", () => {
  expect(
    calculateAcquisitionTax({
      municipality: "tijuana",
      date: "2026-10-04",
      taxBase: null,
    }).amount,
  ).toBeNull();
  expect(
    calculateAcquisitionTax({
      municipality: "rosarito",
      date: "2027-01-01",
      taxBase: 3_000_000,
    }).amount,
  ).toBeNull();
  expect(
    calculateAcquisitionTax({
      municipality: "tijuana",
      date: "2026-10-04",
      taxBase: 49496.2 * 117.31,
    }).amount,
  ).toBeNull();
  expect(
    calculateAcquisitionTax({
      municipality: "tijuana",
      date: "2026-02-30",
      taxBase: 3_000_000,
    }).amount,
  ).toBeNull();
});

test("registration uses fixed 2026 rights and charges a new mortgage once", () => {
  expect(registrationFees("2026-10-04", false, 2)).toBe(13384.22);
  expect(registrationFees("2026-10-04", true, 2)).toBe(25261.56);
  expect(registrationFees("2026-05-01", false, 2)).toBeNull();
  expect(registrationFees("2027-01-01", false, 2)).toBeNull();
});

test("quoted registration overrides the automatic tariff rather than adding to it", () => {
  const result = calculateClosingBudget({
    profile: "buyer",
    municipality: "rosarito",
    date: "2026-10-04",
    price: 3_000_000,
    taxBase: 3_000_000,
    downPayment: 600_000,
    loan: 2_400_000,
    registrationQuote: 15000,
    notary: 25000,
    appraisal: 5000,
    openingFee: 24000,
    other: 0,
  });
  expect(result.knownExpenses).toBe(145500);
  expect(result.cashRequired).toBe(745500);
  expect(result.pending).toEqual([]);
});

test("missing fees remain pending and preserve the known subtotal", () => {
  const result = calculateClosingBudget({
    profile: "buyer",
    municipality: "rosarito",
    date: "2026-10-04",
    price: 3_000_000,
    taxBase: null,
    downPayment: 600_000,
    loan: 2_400_000,
    registrationQuote: 15000,
    notary: null,
    appraisal: 5000,
    openingFee: null,
    other: 0,
  });
  expect(result.knownExpenses).toBe(20000);
  expect(result.cashRequired).toBe(620000);
  expect(result.pending.length).toBe(3);
  expect(result.items.find((i) => i.key === "isai")?.amount).toBeNull();
});

test("seller net subtracts payoff and gross commission once, including quoted ISR", () => {
  const result = calculateClosingBudget({
    profile: "seller",
    municipality: "tijuana",
    date: "2026-10-04",
    price: 3_000_000,
    commissionPercent: 5,
    vatPercent: 16,
    commissionIncludesVat: false,
    mortgagePayoff: 1_000_000,
    cancellation: 5000,
    isr: 50000,
    other: 10000,
  });
  expect(result.knownExpenses).toBe(239000);
  expect(result.sellerNet).toBe(1761000);
  const included = calculateClosingBudget({
    profile: "seller",
    municipality: "tijuana",
    date: "2026-10-04",
    price: 3_000_000,
    commissionPercent: 5,
    vatPercent: 16,
    commissionIncludesVat: true,
    mortgagePayoff: 0,
    cancellation: 0,
    isr: 0,
    other: 0,
  });
  expect(included.knownExpenses).toBe(150000);
  expect(included.sellerNet).toBe(2850000);
});

test("provisional seller ISR uses SAT A.I and credits the state payment", () => {
  const result = calculateSellerIsr({
    price: 3_000_000,
    updatedAcquisitionCost: 1_800_000,
    updatedDeductions: 200_000,
    fiscalYears: 5,
    date: "2026-10-04",
  });
  expect(result).toMatchObject({
    gain: 1_000_000,
    years: 5,
    provisional: 102089.04,
    state: 50000,
    federal: 52089.04,
  });
  expect(
    calculateSellerIsr({
      price: 3_000_000,
      updatedAcquisitionCost: 1_800_000,
      updatedDeductions: null,
      fiscalYears: 5,
      date: "2026-10-04",
    }),
  ).toBeNull();
  expect(
    calculateSellerIsr({
      price: 3_000_000,
      updatedAcquisitionCost: 1_800_000,
      updatedDeductions: 200_000,
      fiscalYears: 5,
      date: "2027-01-01",
    }),
  ).toBeNull();
});

test("ISR caps holding years at 20, applies the 10% cost floor and handles no gain", () => {
  const capped = calculateSellerIsr({
    price: 1_000_000,
    updatedAcquisitionCost: 0,
    updatedDeductions: 0,
    fiscalYears: 25,
    date: "2026-10-04",
  });
  expect(capped).toMatchObject({
    years: 20,
    acquisitionCost: 100000,
    gain: 900000,
  });
  expect(capped!.state).toBeLessThanOrEqual(capped!.provisional);
  expect(
    calculateSellerIsr({
      price: 1_000_000,
      updatedAcquisitionCost: 1_100_000,
      updatedDeductions: 0,
      fiscalYears: 1,
      date: "2026-10-04",
    }),
  ).toMatchObject({ gain: 0, provisional: 0 });
});
