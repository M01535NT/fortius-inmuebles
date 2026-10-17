import { expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MoneyInput, leerMonto, formatoMoneda } from "@/components/admin/money-input";

it("muestra el importe con formato de moneda y lo deja limpio al editar", () => {
  cleanup();
  const onValueChange = vi.fn();
  render(<label>Monto<MoneyInput value={5000000} onValueChange={onValueChange} /></label>);
  const input = screen.getByLabelText("Monto") as HTMLInputElement;
  expect(input.value).toBe("$5,000,000.00");
  fireEvent.focus(input);
  expect(input.value).toBe("5000000");
  fireEvent.change(input, { target: { value: "4,250,000.5" } });
  expect(onValueChange).toHaveBeenLastCalledWith(4250000.5);
  fireEvent.change(input, { target: { value: "" } });
  expect(onValueChange).toHaveBeenLastCalledWith("");
});

it("dentro de un formulario envía el número en un campo oculto", () => {
  cleanup();
  const { container } = render(<form><MoneyInput aria-label="Monto" name="monto" defaultValue={1200} /></form>);
  expect((screen.getByLabelText("Monto") as HTMLInputElement).value).toBe("$1,200.00");
  fireEvent.change(screen.getByLabelText("Monto"), { target: { value: "3500" } });
  expect(new FormData(container.querySelector("form")!).get("monto")).toBe("3500");
});

it("interpreta lo que escribe el asesor", () => {
  expect(leerMonto("$5,000,000.50")).toBe(5000000.5);
  expect(leerMonto("abc")).toBe("");
  expect(leerMonto("12.345")).toBe(12.34);
  expect(formatoMoneda(0)).toBe("$0.00");
});
