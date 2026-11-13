import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { OwnerAppraisalCard } from "@/components/admin/operation/owner-appraisal";
import { emptyWorkflow, type OperationWorkflow, type OwnerAppraisal } from "@/lib/formatos/operation-workflow";
import type { OperationRecord } from "@/lib/admin/operation-view";

const mocks = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock("@/lib/admin/store", () => ({ fetchJson: mocks.fetch }));
vi.mock("@/components/admin/operation/use-operation", () => ({ saveError: (e: Error) => e.message }));

const file = { id: "51000000-0000-4000-8000-0000000000bb", titulo: "Avalúo de ejemplo", nombre_original: "a.pdf", mime: "application/pdf", byte_length: 10, uploaded_by: "u1", created_at: "2026-11-10", deleted_at: null };
const avaluo: OwnerAppraisal = { archivo: file.id, perito: "Perito de ejemplo", fecha: "2026-09-01", valor: 2500000, vigenteHasta: "2027-03-01" };
const op = (extra: Partial<OperationWorkflow> = {}): OperationRecord => ({ id: "51000000-0000-4000-8000-000000000001", folio: "EXP-1", version: 1, cliente_id: "c1", asesor_id: "a1", operacion: "venta", propiedad_slug: "casa", etapa: "documentacion", flujo: { ...emptyWorkflow(), ...extra } });
afterEach(() => { cleanup(); vi.clearAllMocks(); });

it("registra el avalúo y deja la opinión de valor revisada con ese archivo (COR-17)", async () => {
  mocks.fetch.mockResolvedValue({ archivos: [file] });
  const onSave = vi.fn().mockResolvedValue(undefined);
  render(<OwnerAppraisalCard op={op()} today="2026-11-12" reviewer="Asesora de ejemplo" disabled={false} onSave={onSave} onGoToFiles={() => undefined} />);
  expect(screen.getByText(/su banco o el Infonavit pedirá su propio avalúo/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "El propietario trae avalúo" }));
  fireEvent.change(await screen.findByLabelText("Archivo del avalúo"), { target: { value: file.id } });
  fireEvent.change(screen.getByLabelText("Perito o unidad de valuación"), { target: { value: "Perito de ejemplo" } });
  fireEvent.change(screen.getByLabelText("Valor del avalúo (MXN)"), { target: { value: "$2,500,000" } });
  fireEvent.change(screen.getByLabelText("Fecha del avalúo"), { target: { value: "2026-09-01" } });
  const save = screen.getByRole("button", { name: "Guardar el avalúo" }) as HTMLButtonElement;
  fireEvent.change(screen.getByLabelText("Vigente hasta"), { target: { value: "2026-10-01" } });
  expect(save.disabled).toBe(true);
  expect(screen.getByText(/Ese avalúo ya venció/)).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Vigente hasta"), { target: { value: "2027-03-01" } });
  fireEvent.click(save);
  await waitFor(() => expect(onSave).toHaveBeenCalled());
  const flujo = onSave.mock.calls[0][0].flujo as OperationWorkflow;
  expect(flujo.avaluo).toEqual(avaluo);
  expect(flujo.requisitos.valor).toMatchObject({ estado: "revisado", evidencia: { tipo: "cliente", referencia: file.id, fecha: "2026-11-12", responsable: "Asesora de ejemplo" } });
});

it("muestra el avalúo vencido y al quitarlo vuelve a pedir el valor", async () => {
  mocks.fetch.mockResolvedValue({ archivos: [file] });
  const onSave = vi.fn().mockResolvedValue(undefined);
  const valor = { estado: "revisado" as const, soporte: "Avalúo", evidencia: { tipo: "cliente" as const, referencia: file.id, fecha: "2026-11-01", responsable: "Asesora", resultado: "Valor" } };
  render(<OwnerAppraisalCard op={op({ avaluo: { ...avaluo, vigenteHasta: "2026-10-01" }, requisitos: { valor } })} today="2026-11-12" reviewer="Asesora" disabled={false} onSave={onSave} onGoToFiles={() => undefined} />);
  expect(screen.getByText(/^Venció el /)).toBeTruthy();
  expect(await screen.findByRole("link", { name: /Avalúo de ejemplo/ })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Registrar un avalúo actualizado" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Quitar el avalúo" }));
  await waitFor(() => expect(onSave).toHaveBeenCalled());
  const flujo = onSave.mock.calls[0][0].flujo as OperationWorkflow;
  expect(flujo.avaluo).toBeUndefined();
  expect(flujo.requisitos.valor).toBeUndefined();
});
