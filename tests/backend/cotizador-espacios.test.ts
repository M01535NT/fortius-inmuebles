import { expect, test } from "vitest";
import { calculateCommercial } from "@/lib/apps/commercial";

// BUG-C25: un precio unitario con espacios pasa la validación numérica, pero `new Decimal(" 100 ")`
// lanza «[DecimalError] Invalid argument» y el asesor ve un error técnico en lugar del cálculo.
test("el cotizador acepta un precio unitario con espacios alrededor como el número que es", () => {
  const input = { client: "Cliente", currency: "MXN", issuedAt: "2026-10-13", validUntil: "2026-10-20", items: [{ concept: "Servicio", category: "honorarios", quantity: 1, unitPrice: " 100 ", discountPct: 0, taxPct: 0 }] };
  let result = "";
  expect(() => { result = JSON.stringify(calculateCommercial("cotizador", input)); }).not.toThrow();
  expect(result).toContain("100.00 MXN");
});
