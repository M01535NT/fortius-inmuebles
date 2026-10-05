import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { EntregaRowsEditor } from "@/components/admin/entrega-rows-editor";

afterEach(() => cleanup());

it("añade y completa un registro de acceso", () => {
  const onChange = vi.fn();
  const { rerender } = render(<EntregaRowsEditor kind="accesos" value={[]} onChange={onChange} />);
  fireEvent.click(screen.getByText("Agregar registro"));
  expect(onChange).toHaveBeenLastCalledWith([{}]);
  rerender(<EntregaRowsEditor kind="accesos" value={[{}]} onChange={onChange} />);
  fireEvent.change(screen.getByLabelText("Llave, control o tarjeta"), { target: { value: "Puerta principal" } });
  expect(onChange).toHaveBeenLastCalledWith([{ acceso: "Puerta principal" }]);
});
