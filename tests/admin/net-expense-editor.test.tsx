import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { NetExpenseEditor } from "@/components/admin/net-expense-editor";
import { CARGOS_NETO } from "@/lib/formatos/neto";

afterEach(() => cleanup());

it("captura los nueve cargos y elimina el importe cuando no aplica", () => {
  const onChange = vi.fn();
  const rows = CARGOS_NETO.map((item) => ({ concepto: item.key, estado: "Estimado", importe: 100, justificacion: "Cotización" }));
  render(<NetExpenseEditor value={rows} onChange={onChange} />);
  expect(screen.getAllByLabelText("Estado")).toHaveLength(9);
  const commission = screen.getByText("Comisión inmobiliaria (sin IVA)").closest("div.rounded-lg")!;
  fireEvent.change(within(commission as HTMLElement).getByLabelText("Estado"), { target: { value: "No aplica" } });
  expect(onChange).toHaveBeenLastCalledWith([{ ...rows[0], estado: "No aplica", importe: undefined }, ...rows.slice(1)]);
});

it("permite dos cargos adicionales con descripción propia", () => {
  const onChange = vi.fn();
  const { rerender } = render(<NetExpenseEditor value={[]} onChange={onChange} />);
  fireEvent.click(screen.getByText("Agregar otro cargo"));
  const first = onChange.mock.lastCall?.[0];
  expect(first).toHaveLength(10);
  rerender(<NetExpenseEditor value={first} onChange={onChange} />);
  fireEvent.click(screen.getByText("Agregar otro cargo"));
  const second = onChange.mock.lastCall?.[0];
  expect(second).toHaveLength(11);
  rerender(<NetExpenseEditor value={second} onChange={onChange} />);
  expect(screen.getByText("Agregar otro cargo").closest("button")).toHaveProperty("disabled", true);
});
