import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { BudgetRowsEditor } from "@/components/admin/budget-rows-editor";

afterEach(() => cleanup());

it("agrega y edita partidas sin convertir los importes en texto", () => {
  const onChange = vi.fn();
  const { rerender } = render(<BudgetRowsEditor kind="partidas" value={[]} onChange={onChange} />);
  fireEvent.click(screen.getByText("Agregar partida"));
  expect(onChange).toHaveBeenCalledWith([{}]);
  rerender(<BudgetRowsEditor kind="partidas" value={[{}]} onChange={onChange} />);
  fireEvent.change(screen.getByLabelText("Precio unitario con impuestos"), { target: { value: "120.25" } });
  expect(onChange).toHaveBeenLastCalledWith([{ precioUnitario: 120.25 }]);
});
