import { expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FormatoEditor } from "@/components/admin/formato-editor";
import { formatoById } from "@/lib/formatos/catalog";

it("muestra factores editables y permite registrar la revisión del cálculo actual", () => {
  const onChange = vi.fn();
  render(<FormatoEditor definition={formatoById("07")} values={{ baseMercado: "construccion", pesoMercado: 100, pesoIngresos: 0, pesoFisico: 0, versionInforme: 2 }} onChange={onChange} />);
  fireEvent.click(screen.getByRole("button", { name: "Agregar comparable de inmueble construido" }));
  expect(onChange).toHaveBeenCalledWith("comparablesConstruccion", expect.any(Array));
  expect(screen.queryByRole("button", { name: "Agregar comparable de renta" })).toBeNull();
  expect(screen.getByText("Indicador previo al redondeo")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Registrar revisión de estos cálculos" }).hasAttribute("disabled")).toBe(true);
});
