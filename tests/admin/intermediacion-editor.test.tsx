import { expect, it, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { FormatoEditor } from "@/components/admin/formato-editor";
import { formatoById } from "@/lib/formatos/catalog";

it("permite registrar cada cliente y deja visible el bloqueo del contrato no registrado", () => {
  render(<FormatoEditor definition={formatoById("09")} values={{ profecoEstado: "no_registrado" }} onChange={vi.fn()} />);
  expect(screen.getByRole("button", { name: "Agregar cliente del contrato" })).toBeTruthy();
  expect(screen.getByText("Emisión del contrato 09 bloqueada")).toBeTruthy();
  expect(screen.getByText("Comisión estimada con IVA")).toBeTruthy();
  cleanup();
});
