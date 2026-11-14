import * as React from "react";
import { afterEach, expect, test } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MortgagePlanner } from "@/components/tools/mortgage-planner";

afterEach(cleanup);
const set = (label: string | RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

/*
  BUG-C44: el tipo de cambio pasa por `parseAmount`, que corta en dos decimales. El FIX de Banxico y
  el del DOF se publican con cuatro (p. ej. 18.3417): en la ficha de un inmueble en dólares la
  calculadora responde «Ingresa un precio equivalente… un tipo de cambio válido» y no calcula.
*/
test("la ficha en dólares acepta un tipo de cambio con cuatro decimales", () => {
  render(<MortgagePlanner precio={250000} moneda="USD" />);
  set(/Tipo de cambio/, "18.3417");
  expect(screen.queryByText(/un tipo de cambio válido/)).toBeNull();
});

/*
  BUG-C45: «¿Cabe en mi presupuesto?» compara contra `knownMonthlyPayment`, que suma el abono extra
  voluntario (y el abono único si cae en el mes 1). Con 3,000,000, 20 %, 10.5 %, 240 meses y abono
  mensual de 3,000, la cuota obligatoria es 23,961.12, pero se compara 26,961.12: con presupuesto de
  25,000 dice que el egreso «supera ese presupuesto» aunque la mensualidad sí cabe.
*/
test("el abono extra voluntario no hace que la mensualidad «supere» el presupuesto", () => {
  render(<MortgagePlanner precio={3000000} moneda="MXN" precioEditable />);
  set(/Abono extra mensual/, "3000");
  set(/Ingreso neto mensual/, "25000");
  set(/Otras deudas mensuales/, "0");
  set(/Porcentaje de ingreso para deudas/, "100");
  expect(screen.getByText(/Presupuesto para esta hipoteca/).textContent).not.toMatch(/supera ese presupuesto/);
});
