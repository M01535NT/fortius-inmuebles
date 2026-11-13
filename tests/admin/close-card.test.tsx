import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CloseCard } from "@/components/admin/operation/close-card";
import { emptyWorkflow, workflowBlockers, type OperationWorkflow } from "@/lib/formatos/operation-workflow";
import type { OperationRecord } from "@/lib/admin/operation-view";

const mocks = vi.hoisted(() => ({ upsert: vi.fn(), property: { slug: "casa", estado: "disponible", publicada: true } as Record<string, unknown> }));
vi.mock("@/lib/admin/store", () => ({
  db: { asesores: "asesores", propiedades: { version: () => 4 } },
  useCollection: (c: unknown) => c === "asesores" ? [{ id: "a1", nombre: "Asesora que capta", activo: true }, { id: "a2", nombre: "Asesor que vende", activo: true }] : [mocks.property],
  upsertPropiedad: mocks.upsert,
}));
vi.mock("@/components/admin/operation/use-operation", () => ({ saveError: (e: Error) => e.message }));

const op = (extra: Partial<OperationWorkflow> = {}): OperationRecord => ({ id: "51000000-0000-4000-8000-000000000001", folio: "EXP-1", version: 1, cliente_id: "c1", asesor_id: "a1", operacion: "venta", propiedad_slug: "casa", etapa: "postventa", flujo: { ...emptyWorkflow(), ...extra } });
// Contrato de intermediación de ejemplo: 5 % sobre 4,000,000 sin IVA de venta.
const contrato = { data: { precioAutorizado: 4000000, ivaVenta: 0, penaMaxima: 0, comisionPorcentaje: 5, ivaComisionTasa: 16 }, version: 3 };
afterEach(() => { cleanup(); vi.clearAllMocks(); mocks.property = { slug: "casa", estado: "disponible", publicada: true }; });

it("registra quién captó y quién vendió con el reparto estimado del contrato (COR-22)", async () => {
  const onSave = vi.fn().mockResolvedValue(undefined);
  render(<CloseCard op={op()} intermediacion={contrato} disabled={false} onSave={onSave} />);
  expect(screen.getByText("Falta registrar")).toBeTruthy();
  expect(screen.getByText("50 % · $100,000")).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Asesor que vendió"), { target: { value: "a2" } });
  expect(screen.getAllByText("25 % · $50,000")).toHaveLength(2);
  fireEvent.click(screen.getByRole("button", { name: "Registrar quién captó y quién vendió" }));
  await waitFor(() => expect(onSave).toHaveBeenCalled());
  expect(onSave.mock.calls[0][0].flujo.cierre).toEqual({ capto: "a1", vendio: "a2", comisionEstimada: 200000, fuente: "Contrato de intermediación · versión 3" });
});

it("marca el inmueble como vendido y lo deja en el sitio o lo retira", async () => {
  mocks.upsert.mockResolvedValue(undefined);
  render(<CloseCard op={op()} disabled={false} onSave={vi.fn()} />);
  expect(screen.getByText(/Sin monto/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Marcar el inmueble como vendido" }));
  await waitFor(() => expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({ estado: "vendida", publicada: true }), 4));
  cleanup(); vi.clearAllMocks();
  render(<CloseCard op={op()} disabled={false} onSave={vi.fn()} />);
  fireEvent.click(screen.getByLabelText("Retirarlo del sitio"));
  fireEvent.click(screen.getByRole("button", { name: "Marcar el inmueble como vendido" }));
  await waitFor(() => expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({ estado: "vendida", publicada: false }), 4));
});

it("no se archiva sin registrar quién captó y quién vendió", () => {
  const blockers = (flow: OperationWorkflow) => workflowBlockers(flow, "cerrado", { id: "e1", asesor_id: "a1", propiedad_slug: "casa" }, [], "2026-11-12");
  expect(blockers({ ...emptyWorkflow(), estado: "activa" })).toContain("Registrar quién captó y quién vendió antes de archivar.");
  expect(blockers({ ...emptyWorkflow(), cierre: { capto: "a1", vendio: "a1" } })).not.toContain("Registrar quién captó y quién vendió antes de archivar.");
  expect(blockers(emptyWorkflow("compra"))).not.toContain("Registrar quién captó y quién vendió antes de archivar.");
});
