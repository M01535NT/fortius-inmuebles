import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { FormatoEditor } from "@/components/admin/formato-editor";
import { formatoById } from "@/lib/formatos/catalog";

afterEach(() => cleanup());

it("captura cada concepto del recibo en un campo separado", () => {
  const onChange = vi.fn();
  render(<FormatoEditor definition={formatoById("18")} values={{}} onChange={onChange} />);
  expect(screen.getByLabelText("Número de recibo").hasAttribute("required")).toBe(true);
  expect(screen.getByLabelText("Importe recibido").getAttribute("inputmode")).toBe("decimal");
  fireEvent.change(screen.getByLabelText("Importe recibido"), { target: { value: "12000" } });
  expect(onChange).toHaveBeenCalledWith("importeRecibido", 12000);
});

it("muestra el folio del expediente como dato no editable", () => {
  render(<FormatoEditor definition={formatoById("12")} values={{ folio: "EXP-204" }} onChange={vi.fn()} />);
  expect(screen.getByLabelText("Folio del expediente").getAttribute("readonly")).toBe("");
  expect(screen.getByLabelText("Folio del expediente").getAttribute("value")).toBe("EXP-204");
});

it("muestra sólo las condiciones aplicables de la propuesta y la respuesta", () => {
  const definition = formatoById("14");
  const { rerender } = render(<FormatoEditor definition={definition} values={{ credito: 0, estadoRespuesta: "pendiente" }} onChange={vi.fn()} />);
  expect(screen.queryByLabelText("Institución del crédito")).toBeNull();
  expect(screen.queryByLabelText("Lugar de la respuesta")).toBeNull();
  rerender(<FormatoEditor definition={definition} values={{ credito: 1, estadoRespuesta: "registrada", decisionPropietario: "aceptar" }} onChange={vi.fn()} />);
  expect(screen.getByLabelText("Institución del crédito")).toBeTruthy();
  expect(screen.getByLabelText("Lugar de la respuesta")).toBeTruthy();
  expect(screen.queryByLabelText("Precio de la contraoferta")).toBeNull();
  rerender(<FormatoEditor definition={definition} values={{ credito: 1, estadoRespuesta: "registrada", decisionPropietario: "contraoferta" }} onChange={vi.fn()} />);
  expect(screen.getByLabelText("Precio de la contraoferta")).toBeTruthy();
});
