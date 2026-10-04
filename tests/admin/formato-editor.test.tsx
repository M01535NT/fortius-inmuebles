import { expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { FormatoEditor } from "@/components/admin/formato-editor";
import { formatoById } from "@/lib/formatos/catalog";

it("captura cada concepto del recibo en un campo separado", () => {
  const onChange = vi.fn();
  render(<FormatoEditor definition={formatoById("18")} values={{}} onChange={onChange} />);
  expect(screen.getByLabelText("Número de recibo").hasAttribute("required")).toBe(true);
  expect(screen.getByLabelText("Importe recibido").getAttribute("type")).toBe("number");
  fireEvent.change(screen.getByLabelText("Importe recibido"), { target: { value: "12000" } });
  expect(onChange).toHaveBeenCalledWith("importeRecibido", 12000);
});
