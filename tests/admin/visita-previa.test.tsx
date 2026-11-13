import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

// DEC-41 (excepción a RP-91): el director autoriza enseñar el inmueble a un interesado antes de la firma.
const mocks = vi.hoisted(() => ({ role: "admin" as "editor" | "admin", upload: vi.fn() }));
vi.mock("@/lib/admin/store", async original => ({
  ...await original<typeof import("@/lib/admin/store")>(),
  useSession: () => ({ id: "u-1", email: "director@example.invalid", name: "Director", role: mocks.role }),
  useCollection: () => [{ id: "lead-1", nombre: "Interesado de ensayo", estado: "nuevo" }],
  uploadFile: mocks.upload,
}));
import { PriorVisitCard } from "@/components/admin/operation/prior-visit";
import { operationTags, type OperationRecord } from "@/lib/admin/operation-view";
import type { OperationWorkflow } from "@/lib/formatos/operation-workflow";

afterEach(cleanup);
const flow = (extra: Partial<OperationWorkflow> = {}) => ({ version: 1, ruta: "captacion", estado: "activa", motivo: "", requisitos: {}, ...extra }) as OperationWorkflow;
const op = (flujo: OperationWorkflow) => ({ id: "exp-1", etapa: "levantamiento", flujo }) as unknown as OperationRecord;
const visit = { id: "v1", interesado: "Interesado de ensayo", carta: { path: "u-1/carta.pdf", nombre: "carta.pdf" }, motivo: "Busca en la colonia", autorizadoEl: "2026-11-12T18:00:00.000Z" };

it("la operación lo dice mientras no se firme la intermediación", () => {
  expect(operationTags({ flujo: flow({ visitasPrevias: [visit] }) })).toContain("Visita autorizada antes de la firma");
  expect(operationTags({ flujo: flow({ visitasPrevias: [visit], requisitos: { intermediacion: { estado: "revisado", soporte: "Firmada" } } as OperationWorkflow["requisitos"] }) })).not.toContain("Visita autorizada antes de la firma");
  expect(operationTags({ flujo: flow() })).not.toContain("Visita autorizada antes de la firma");
});

it("el director la autoriza con el interesado, la carta y el motivo", async () => {
  mocks.role = "admin";
  mocks.upload.mockResolvedValue({ bucket: "fortius-inmuebles-private", path: "u-1/carta.pdf", url: "", name: "carta.pdf" });
  const onSave = vi.fn(async () => undefined);
  render(<PriorVisitCard op={op(flow())} disabled={false} onSave={onSave} />);
  fireEvent.click(screen.getByRole("button", { name: "Autorizar una visita" }));
  const authorize = screen.getByRole("button", { name: "Autorizar" }) as HTMLButtonElement;
  expect(authorize.disabled).toBe(true);
  fireEvent.change(screen.getByLabelText("Interesado"), { target: { value: "Interesado de ensayo" } });
  fireEvent.change(screen.getByLabelText("Carta de autorización de visita firmada por el propietario"), { target: { files: [new File(["x"], "carta.pdf", { type: "application/pdf" })] } });
  await screen.findByText("Adjunta: carta.pdf");
  fireEvent.change(screen.getByLabelText("Por qué se autoriza"), { target: { value: "Busca en la colonia" } });
  fireEvent.click(authorize);
  await waitFor(() => expect(onSave).toHaveBeenCalled());
  const saved = (onSave.mock.calls[0] as unknown as [{ flujo: OperationWorkflow }])[0].flujo.visitasPrevias!;
  expect(saved).toEqual([expect.objectContaining({ interesado: "Interesado de ensayo", leadId: "lead-1", carta: { path: "u-1/carta.pdf", nombre: "carta.pdf" }, motivo: "Busca en la colonia" })]);
});

it("el asesor la ve, pero no la autoriza ni la retira", () => {
  mocks.role = "editor";
  render(<PriorVisitCard op={op(flow({ visitasPrevias: [visit] }))} disabled={false} onSave={vi.fn()} />);
  expect(screen.getByText("Interesado de ensayo")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Autorizar una visita" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Retirar" })).toBeNull();
});
