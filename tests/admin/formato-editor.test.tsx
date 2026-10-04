import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { FormatoEditor } from "@/components/admin/formato-editor";
import { formatoById } from "@/lib/formatos/catalog";

afterEach(() => cleanup());

it("captura cada concepto del recibo en un campo separado", () => {
  const onChange = vi.fn();
  render(<FormatoEditor definition={formatoById("18")} values={{}} onChange={onChange} />);
  expect(screen.getByLabelText("Número de recibo").hasAttribute("required")).toBe(true);
  expect(screen.getByLabelText("Importe recibido").getAttribute("type")).toBe("number");
  fireEvent.change(screen.getByLabelText("Importe recibido"), { target: { value: "12000" } });
  expect(onChange).toHaveBeenCalledWith("importeRecibido", 12000);
});

it("muestra el folio del expediente como dato no editable", () => {
  render(<FormatoEditor definition={formatoById("12")} values={{ folio: "EXP-204" }} onChange={vi.fn()} />);
  expect(screen.getByLabelText("Folio del expediente").getAttribute("readonly")).toBe("");
  expect(screen.getByLabelText("Folio del expediente").getAttribute("value")).toBe("EXP-204");
});
