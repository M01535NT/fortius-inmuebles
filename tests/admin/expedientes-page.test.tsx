import { expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
vi.mock("@/lib/admin/store", () => ({
  db: { clientes: {}, propiedades: {} }, useCollection: () => [],
}));
import ExpedientesPage from "@/app/admin/expedientes/page";

it("presenta el flujo de expedientes y explica qué formatos pueden emitirse", () => {
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ expedientes: [] }) })));
  render(<ExpedientesPage />);
  expect(screen.getByText("Expedientes y formatos")).toBeTruthy();
  expect(screen.getByText(/25 formatos/)).toBeTruthy();
  expect(screen.getByText(/sus PDFs permanecen bloqueados/)).toBeTruthy();
});
