import { expect, test } from "vitest";

import { siguienteFila } from "@/components/panel/kit/atajos";

test("Teclado en listas: J y K se mueven de fila en fila sin dar la vuelta", () => {
  expect(siguienteFila(-1, 5, 1)).toBe(0);
  expect(siguienteFila(-1, 5, -1)).toBe(4);
  expect(siguienteFila(2, 5, 1)).toBe(3);
  expect(siguienteFila(4, 5, 1)).toBe(4);
  expect(siguienteFila(0, 5, -1)).toBe(0);
  expect(siguienteFila(0, 0, 1)).toBe(-1);
});
