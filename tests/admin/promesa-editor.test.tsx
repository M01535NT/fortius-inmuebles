import { expect, it, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { FormatoEditor } from "@/components/admin/formato-editor";
import { formatoById } from "@/lib/formatos/catalog";
import { promesaSample } from "../backend/fixtures/promesa";
import { promesaReviewSnapshot } from "@/lib/formatos/promesa";
afterEach(cleanup);

it("ofrece registros separados de pagos y anexos y no pide custodio cuando no hay garantía", () => {
  render(<FormatoEditor definition={formatoById("15")} values={{ garantia: 0, credito: 0, condicionCredito: "no", compareceVendedor: "propia", compareceComprador: "propia", conversion: "no" }} onChange={vi.fn()} />);
  expect(screen.getByRole("button", { name: "Agregar pago del precio" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Agregar anexo" })).toBeTruthy();
  expect(screen.queryByLabelText("Receptor de la garantía")).toBeNull();
  expect(screen.queryByLabelText("Institución de crédito")).toBeNull();
  expect(screen.getByRole("button", { name: "Registrar revisión de esta promesa" }).hasAttribute("disabled")).toBe(true);
});

it("registra la revisión de un contrato completo y captura los importes como números", () => {
  const onChange = vi.fn();
  render(<FormatoEditor definition={formatoById("15")} values={promesaSample} onChange={onChange} />);
  fireEvent.click(screen.getByRole("button", { name: "Registrar revisión de esta promesa" }));
  expect(onChange).toHaveBeenCalledWith("revisionDatos", promesaReviewSnapshot(promesaSample));
  fireEvent.change(screen.getByLabelText("Importe"), { target: { value: "750000.25" } });
  expect(onChange).toHaveBeenCalledWith("pagosPrecio", [expect.objectContaining({ importe: 750000.25 })]);
});
