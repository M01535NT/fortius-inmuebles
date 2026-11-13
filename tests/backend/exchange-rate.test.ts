import { expect, test } from "vitest";
import { parseExchangeRate } from "@/lib/finance/money";

/* C-44: el tipo de cambio del FIX de Banxico trae 4 decimales; la calculadora debe aceptarlo. */
test("el tipo de cambio admite hasta 4 decimales y un punto inicial", () => {
  expect(parseExchangeRate("18.3417")).toBe(18.3417);
  expect(parseExchangeRate(" 17.5 ")).toBe(17.5);
  expect(parseExchangeRate("18")).toBe(18);
  expect(parseExchangeRate(".5")).toBe(0.5);
  expect(parseExchangeRate("18.")).toBe(18);
});

test("rechaza vacíos, ceros, más de 4 decimales, texto y valores fuera de tope", () => {
  for (const bad of ["", "  ", "0", "0.0000", "18.34171", "-18", "18,34", "abc", "1e3", ".", "1000.0001"]) expect(parseExchangeRate(bad), bad).toBeNull();
  expect(parseExchangeRate("1000")).toBe(1000);
});
