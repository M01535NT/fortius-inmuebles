import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ContractSignatureCard } from "@/components/admin/operation/contract-signature";
import { emptyWorkflow, type ContractSignature } from "@/lib/formatos/operation-workflow";
import type { OperationRecord } from "@/lib/admin/operation-view";

const mocks = vi.hoisted(() => ({ role: "editor", fetch: vi.fn() }));
vi.mock("@/lib/admin/store", () => ({
  fetchJson: mocks.fetch, useSession: () => ({ id: "u1", role: mocks.role }),
  db: { clientes: "clientes", asesores: "asesores" },
  useCollection: (c: string) => c === "clientes" ? [{ id: "c1", nombre: "Propietaria de ejemplo" }] : [{ id: "a1", nombre: "Asesora de ejemplo" }],
}));
vi.mock("@/components/admin/operation/use-operation", () => ({ saveError: (e: Error) => e.message }));

const file = { id: "51000000-0000-4000-8000-0000000000aa", titulo: "Contrato firmado de ejemplo", nombre_original: "c.pdf", mime: "application/pdf", byte_length: 10, uploaded_by: "u1", created_at: "2026-11-10", deleted_at: null };
const firma: ContractSignature = { tipo: "intermediacion", fecha: "2026-11-10", firmantes: [{ nombre: "Propietaria de ejemplo", parte: "propietario" }], archivo: file.id, completa: true, revisada: false, registradoEl: "2026-11-10T18:00:00.000Z" };
const op = (extra: Partial<ReturnType<typeof emptyWorkflow>> = {}): OperationRecord => ({ id: "51000000-0000-4000-8000-000000000001", folio: "EXP-1", version: 1, cliente_id: "c1", asesor_id: "a1", operacion: "venta", propiedad_slug: "casa", etapa: "documentacion", flujo: { ...emptyWorkflow(), ...extra } });
afterEach(() => { cleanup(); vi.clearAllMocks(); mocks.role = "editor"; });

it("registra la firma con el contrato de los documentos del cliente, la fecha y quién firmó (COR-10)", async () => {
  mocks.fetch.mockResolvedValue({ archivos: [file] });
  const onSave = vi.fn().mockResolvedValue(undefined);
  render(<ContractSignatureCard op={op()} today="2026-11-12" disabled={false} onSave={onSave} onGoToFiles={() => undefined} />);
  expect(screen.getByText("Sin firma registrada")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Registrar la firma" }));
  expect((screen.getAllByLabelText("Nombre")[0] as HTMLInputElement).value).toBe("Propietaria de ejemplo");
  const select = await screen.findByLabelText("Contrato firmado");
  fireEvent.change(select, { target: { value: file.id } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar la firma" }));
  await waitFor(() => expect(onSave).toHaveBeenCalled());
  const saved = onSave.mock.calls[0][0].flujo.firmaContrato as ContractSignature;
  expect(saved).toMatchObject({ tipo: "intermediacion", fecha: "2026-11-12", archivo: file.id, completa: true, revisada: false });
  expect(saved.firmantes).toEqual([{ nombre: "Propietaria de ejemplo", parte: "propietario" }, { nombre: "Asesora de ejemplo", parte: "fortius" }]);
});

it("pide subir el contrato si el cliente no tiene documentos", async () => {
  mocks.fetch.mockResolvedValue({ archivos: [] });
  const go = vi.fn();
  render(<ContractSignatureCard op={op()} today="2026-11-12" disabled={false} onSave={vi.fn()} onGoToFiles={go} />);
  fireEvent.click(screen.getByRole("button", { name: "Registrar la firma" }));
  fireEvent.click(await screen.findByRole("button", { name: "Ir a los documentos del cliente" }));
  expect(go).toHaveBeenCalled();
  expect((screen.getByRole("button", { name: "Guardar la firma" }) as HTMLButtonElement).disabled).toBe(true);
});

it("solo el director marca la firma revisada", async () => {
  mocks.fetch.mockResolvedValue({ archivos: [file] });
  const { unmount } = render(<ContractSignatureCard op={op({ firmaContrato: firma })} today="2026-11-12" disabled={false} onSave={vi.fn()} onGoToFiles={() => undefined} />);
  expect(screen.getByText("Firma por revisar")).toBeTruthy();
  expect(await screen.findByRole("link", { name: /Contrato firmado de ejemplo/ })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Marcar la firma revisada" })).toBeNull();
  unmount();
  mocks.role = "admin";
  const onSave = vi.fn().mockResolvedValue(undefined);
  render(<ContractSignatureCard op={op({ firmaContrato: firma })} today="2026-11-12" disabled={false} onSave={onSave} onGoToFiles={() => undefined} />);
  fireEvent.click(screen.getByRole("button", { name: "Marcar la firma revisada" }));
  await waitFor(() => expect(onSave.mock.calls[0][0].flujo.firmaContrato).toMatchObject({ revisada: true }));
});
