import { expect, test } from "vitest";
import { calculateFinancial } from "@/lib/apps/financial";

// BUG-C14: el mes del anticipo mayor que el plazo bloquea el cálculo aunque no haya anticipo
// (pasa al acortar el plazo después de haber puesto el mes del anticipo).
test("la hipoteca se calcula sin anticipo aunque el mes del anticipo quede fuera del plazo", () => {
  expect(() => calculateFinancial("hipoteca", { price: 1000000, downPercent: 10, annualRate: 10, months: 12, extraMonth: 24, extraOnce: 0, extraMonthly: 0 })).not.toThrow();
});
