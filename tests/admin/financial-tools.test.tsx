import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { MortgageCalculator } from "@/components/property/mortgage-calculator";
import { ClosingCostsCalculator } from "@/components/tools/closing-costs-calculator";
afterEach(cleanup);
test("mortgage scenarios keep immutable quotes and show pending charges", () => {
  render(<MortgageCalculator precio={3000000} moneda="MXN" precioEditable />);
  expect(screen.getByText(/Faltan cotizaciones:/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: /Guardar escenario/ }));
  fireEvent.change(screen.getByLabelText("Tasa %"), { target: { value: "8" } });
  fireEvent.click(screen.getByRole("button", { name: /Guardar escenario/ }));
  const comparison = screen.getByRole("region", {
    name: "Comparación de escenarios",
  });
  expect(within(comparison).getByText(/10.5% nominal/)).toBeTruthy();
  expect(within(comparison).getByText(/8% nominal/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: /Guardar escenario/ }));
  expect(
    screen
      .getByRole("button", { name: /Guardar escenario/ })
      .hasAttribute("disabled"),
  ).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Eliminar escenario 2" }));
  expect(within(comparison).queryByText(/8% nominal/)).toBeTruthy(); // third saved scenario still remains
  expect(within(comparison).getAllByRole("article")).toHaveLength(2);
});
test("USD property prices require a conversion and never produce a USD mortgage", () => {
  render(<MortgageCalculator precio={150000} moneda="USD" />);
  expect(screen.getByRole("alert").textContent).toMatch(/tipo de cambio/);
  fireEvent.change(screen.getByLabelText("Tipo de cambio (MXN por USD)"), {
    target: { value: "20" },
  });
  expect(screen.queryByRole("alert")).toBeNull();
  expect(
    screen.getByText("Capital e interés mensual").parentElement?.textContent,
  ).toContain("23,961.12");
  expect(screen.getByText(/Precio del inmueble:/).textContent).toContain("USD");
});
test("edited mortgage price and opening fee flow into the purchase budget", () => {
  render(<MortgageCalculator precio={3000000} moneda="MXN" precioEditable />);
  fireEvent.change(screen.getByLabelText("Precio de la propiedad (MXN)"), {
    target: { value: "4000000" },
  });
  fireEvent.change(screen.getByLabelText("Comisión de apertura (MXN)"), {
    target: { value: "12345" },
  });
  const budget = screen.getByRole("region", {
    name: "Presupuesto de compraventa",
  });
  expect(within(budget).getByText(/Usa el precio/).textContent).toContain(
    "4,000,000.00",
  );
  expect(within(budget).getByText("$12,345.00")).toBeTruthy();
  expect(within(budget).getByText(/^Incluye \$/).textContent).toContain(
    "800,000.00",
  );
});
test("quotes remain pending, zero is explicit and expired rules stay pending", () => {
  render(<ClosingCostsCalculator />);
  expect(screen.getByText("Falta incorporar")).toBeTruthy();
  fireEvent.click(
    screen.getByRole("button", { name: "Usar precio para simular" }),
  );
  for (const label of [
    "Notario y gestión (MXN)",
    "Avalúo cotizado (MXN)",
    "Otros gastos (MXN)",
  ])
    fireEvent.change(screen.getByLabelText(label), { target: { value: "0" } });
  expect(screen.getByText("Efectivo inicial estimado")).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Fecha de operación"), {
    target: { value: "2027-01-01" },
  });
  expect(screen.queryByText("Efectivo inicial estimado")).toBeNull();
  expect(screen.getByText("Efectivo inicial parcial")).toBeTruthy();
  expect(
    screen.getByText(/tarifas disponibles corresponden a 2026/),
  ).toBeTruthy();
});
test("assumed bases follow live price changes and quoted costs survive incomplete mortgage drafts", () => {
  render(<MortgageCalculator precio={3000000} moneda="MXN" precioEditable />);
  const budget = screen.getByRole("region", {
    name: "Presupuesto de compraventa",
  });
  fireEvent.click(
    within(budget).getByRole("button", { name: "Usar precio para simular" }),
  );
  fireEvent.change(within(budget).getByLabelText("Notario y gestión (MXN)"), {
    target: { value: "25345" },
  });
  fireEvent.change(screen.getByLabelText("Precio de la propiedad (MXN)"), {
    target: { value: "" },
  });
  fireEvent.change(screen.getByLabelText("Precio de la propiedad (MXN)"), {
    target: { value: "4000000" },
  });
  expect(
    (
      within(budget).getByLabelText(
        "Base gravable ISAI (MXN)",
      ) as HTMLInputElement
    ).value,
  ).toBe("4000000");
  expect(
    (
      within(budget).getByLabelText(
        "Notario y gestión (MXN)",
      ) as HTMLInputElement
    ).value,
  ).toBe("25345");
  expect(within(budget).getByText("$102,809.01")).toBeTruthy();
});
test("closing loan split follows decimal half-up rounding", () => {
  render(<ClosingCostsCalculator />);
  fireEvent.change(screen.getByLabelText("Precio de compra (MXN)"), {
    target: { value: "100050" },
  });
  fireEvent.change(screen.getByLabelText("Forma de compra"), {
    target: { value: "credit" },
  });
  fireEvent.change(screen.getByLabelText("Enganche de compra (%)"), {
    target: { value: "1.13" },
  });
  expect(screen.getByText(/^Incluye \$/).textContent).toContain("1,130.57");
});
test("ISR simulation requires scope confirmation and never combines with a quoted ISR", () => {
  render(<ClosingCostsCalculator />);
  fireEvent.click(screen.getByRole("button", { name: "Voy a vender" }));
  fireEvent.change(screen.getByLabelText("ISR determinado (MXN)"), {
    target: { value: "50000" },
  });
  fireEvent.change(screen.getByLabelText("ISR por venta"), {
    target: { value: "simulate" },
  });
  for (const [label, value] of [
    ["Costo fiscal actualizado (MXN)", "1800000"],
    ["Deducciones fiscales actualizadas (MXN)", "200000"],
    ["Años fiscales transcurridos", "5"],
  ])
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  expect(screen.queryByText("$102,089.04")).toBeNull();
  fireEvent.click(screen.getByLabelText("Mi caso cumple esos requisitos"));
  expect(screen.getByText("$102,089.04")).toBeTruthy();
  expect(screen.getByText(/Pago estatal acreditado:/).textContent).toContain(
    "52,089.04",
  );
  fireEvent.change(screen.getByLabelText("ISR por venta"), {
    target: { value: "quote" },
  });
  expect(screen.queryByText("$102,089.04")).toBeNull();
  expect(screen.getByText("$50,000.00")).toBeTruthy();
});
