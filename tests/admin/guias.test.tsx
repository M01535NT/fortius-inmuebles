import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

// FLX-03 B (DEC-55): cada tipo de asunto trae sus etapas; la guía sugiere y no frena.
const mocks = vi.hoisted(() => ({ role: "editor" as "editor" | "admin", json: vi.fn(), upsert: vi.fn(), push: vi.fn() }));
vi.mock("@/lib/admin/store", async original => ({
  ...await original<typeof import("@/lib/admin/store")>(),
  useSession: () => ({ id: "u-1", email: "asesor@example.invalid", name: "Asesor", role: mocks.role }),
  useCollection: () => [],
  fetchJson: mocks.json,
  upsert: mocks.upsert,
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
const confirm = vi.hoisted(() => ({ confirmAction: vi.fn() }));
vi.mock("@/components/admin/workspace/confirm", () => confirm);
import { GuideStepTab } from "@/components/admin/operation/guide-step";
import { TypeCard } from "@/components/admin/operation/type-card";
import { AsuntoAvisos } from "@/components/admin/workspace/asunto-avisos";
import { stageTrack, type OperationRecord } from "@/lib/admin/operation-view";
import { cambiaDeTipo, operacionYFlujo } from "@/lib/formatos/tipo-asunto";
import { etapasDeGuia, tipoDeAsunto } from "@/lib/guias";
import type { OperationWorkflow } from "@/lib/formatos/operation-workflow";

afterEach(() => { cleanup(); vi.clearAllMocks(); });
const flow = (extra: Partial<OperationWorkflow> = {}) => ({ version: 1, ruta: "captacion", estado: "activa", motivo: "", requisitos: {}, ...extra }) as OperationWorkflow;
const op = (flujo: OperationWorkflow, extra: Partial<OperationRecord> = {}) => ({ id: "exp-1", folio: "EXP-1", etapa: "captacion", operacion: "venta", version: 3, flujo, ...extra }) as unknown as OperationRecord;
const inspeccion = flow({ guia: { clave: "inspeccion", paso: 0 } });

it("el tipo cambia la operación y la guía, y conserva lo hecho", () => {
  const base = flow({ requisitos: { titularidad: { estado: "revisado", soporte: "Escritura" } } as OperationWorkflow["requisitos"] });
  const renta = operacionYFlujo("renta", base, "venta");
  expect(renta.operacion).toBe("renta");
  expect(renta.flujo).toMatchObject({ ruta: "arrendador", requisitos: base.requisitos });
  const cancelacion = operacionYFlujo("cancelacion_hipoteca", base, "venta", { acreedor: "infonavit" });
  expect(cancelacion).toMatchObject({ operacion: "venta", flujo: { ruta: "captacion", guia: { clave: "cancelacion_hipoteca", paso: 0, acreedor: "infonavit" } } });
  // De una guía a venta, la guía se quita.
  expect(operacionYFlujo("venta", inspeccion, "venta").flujo.guia).toBeUndefined();
  expect(tipoDeAsunto(inspeccion, "venta")).toBe("inspeccion");
  expect(cambiaDeTipo(inspeccion, "venta")).toBe(true);
  expect(cambiaDeTipo(flow({ ruta: "compra" }), "compra")).toBe(false);
});

it("el riel dibuja las etapas de la guía", () => {
  const { stages, current } = stageTrack(op(flow({ guia: { clave: "opinion_valor", paso: 2 } })), "2026-11-15");
  expect(stages.map(s => s.label)).toEqual(etapasDeGuia({ clave: "opinion_valor" }));
  expect(current).toBe(2);
});

it("pasa a la siguiente etapa sin preguntar y saltar etapas pide confirmarlo", async () => {
  const onSave = vi.fn(async () => undefined);
  render(<GuideStepTab op={op(inspeccion)} onSave={onSave} />);
  fireEvent.click(screen.getByRole("button", { name: "Pasar a «Visita al inmueble»" }));
  await waitFor(() => expect(onSave).toHaveBeenCalledWith({ flujo: expect.objectContaining({ guia: { clave: "inspeccion", paso: 1 } }) }));
  expect(confirm.confirmAction).not.toHaveBeenCalled();
  cleanup(); onSave.mockClear();
  render(<GuideStepTab op={op(inspeccion)} onSave={onSave} />);
  fireEvent.change(screen.getByLabelText("Pasar a otra etapa"), { target: { value: "3" } });
  confirm.confirmAction.mockResolvedValueOnce(false);
  fireEvent.click(screen.getByRole("button", { name: "Pasar" }));
  await waitFor(() => expect(confirm.confirmAction).toHaveBeenCalledWith(expect.stringContaining("Visita al inmueble, Hallazgos con fotos"), expect.anything()));
  expect(onSave).not.toHaveBeenCalled();
  confirm.confirmAction.mockResolvedValueOnce(true);
  fireEvent.click(screen.getByRole("button", { name: "Pasar" }));
  await waitFor(() => expect(onSave).toHaveBeenCalledWith({ flujo: expect.objectContaining({ guia: { clave: "inspeccion", paso: 3 } }) }));
});

it("en la última etapa se archiva el asunto", async () => {
  const onSave = vi.fn(async () => undefined);
  confirm.confirmAction.mockResolvedValueOnce(true);
  render(<GuideStepTab op={op(flow({ guia: { clave: "inspeccion", paso: 3 } }))} onSave={onSave} />);
  fireEvent.click(screen.getByRole("button", { name: "Archivar el asunto" }));
  await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ etapa: "cerrado" })));
});

it("la cancelación de hipoteca empieza su trámite ligado al asunto", async () => {
  mocks.upsert.mockResolvedValue(undefined);
  render(<GuideStepTab op={op(flow({ guia: { clave: "cancelacion_hipoteca", paso: 0, acreedor: "infonavit" } }))} onSave={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Empezar el trámite" }));
  await waitFor(() => expect(mocks.push).toHaveBeenCalledWith(expect.stringMatching(/^\/admin\/tramites\?id=/)));
  expect(mocks.upsert.mock.calls[0][1]).toMatchObject({ acreedor: "infonavit", expedienteId: "exp-1" });
});

it("cambiar el tipo envía la versión y lo confirma antes", async () => {
  const onReplaced = vi.fn();
  mocks.json.mockResolvedValue({ expediente: { id: "exp-1" } });
  render(<TypeCard op={op(flow())} onReplaced={onReplaced} />);
  const button = screen.getByRole("button", { name: "Cambiar el tipo" }) as HTMLButtonElement;
  expect(button.disabled).toBe(true);
  fireEvent.change(screen.getByLabelText("Tipo"), { target: { value: "cancelacion_hipoteca" } });
  fireEvent.change(screen.getByLabelText("Quién dio el crédito"), { target: { value: "fovissste" } });
  confirm.confirmAction.mockResolvedValueOnce(true);
  fireEvent.click(button);
  await waitFor(() => expect(onReplaced).toHaveBeenCalledWith({ id: "exp-1" }));
  expect(mocks.json).toHaveBeenCalledWith("/api/admin/expedientes/exp-1/tipo", expect.objectContaining({ method: "PUT" }));
  expect(JSON.parse(mocks.json.mock.calls[0][1].body)).toEqual({ version: 3, tipo: "cancelacion_hipoteca", acreedor: "fovissste" });
});

it("Hoy muestra los avisos de los asuntos propios; sin avisos no ocupa lugar", async () => {
  mocks.role = "editor";
  mocks.json.mockResolvedValueOnce({ avisos: [
    { id: "a1", expedienteId: "exp-1", folio: "EXP-1", asesorId: "u-1", texto: "Se guardó sin: Los documentos de la lista", at: "2026-11-15T10:00:00.000Z" },
    { id: "a2", expedienteId: "exp-2", folio: "EXP-2", asesorId: "u-2", texto: "Pasó a «Cierre» sin: La firma", at: "2026-11-15T09:00:00.000Z" },
  ] });
  render(<AsuntoAvisos />);
  expect(await screen.findByText("Se guardó sin: Los documentos de la lista")).toBeTruthy();
  expect(screen.queryByText("Pasó a «Cierre» sin: La firma")).toBeNull();
  expect(screen.getByRole("link").getAttribute("href")).toBe("/admin/operaciones/exp-1?tab=actividad");
  cleanup();
  mocks.json.mockResolvedValueOnce({ avisos: [] });
  const { container } = render(<AsuntoAvisos />);
  await waitFor(() => expect(mocks.json).toHaveBeenCalledTimes(2));
  expect(container.innerHTML).toBe("");
});
