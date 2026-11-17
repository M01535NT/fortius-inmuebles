import * as React from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { nuevoTramite, type Tramite } from "@/lib/tramites";

/* TRA-01 · pantalla de Trámites: con pendientes o sin su documento el paso se cierra tras confirmarlo (FLX-03), y cerrar ofrece Deshacer. */
const data = vi.hoisted(() => ({ tramites: [] as unknown[], archivos: [] as unknown[], upsert: vi.fn(), role: "admin", ventas: [] as unknown[] }));
vi.mock("@/lib/admin/store", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/admin/store")>();
  return {
    ...actual,
    useCollection: (col: unknown) => col === actual.db.tramites ? data.tramites : col === actual.db.archivos ? data.archivos : [],
    useLoadState: () => ({ status: "ready", error: null }),
    useSession: () => ({ id: "u1", name: "Ana Asesora", email: "ana@example.invalid", role: data.role }),
    loadAllDossiers: () => Promise.resolve(data.ventas),
    apiRequest: () => Promise.resolve({ asesorId: "a1" }),
    upsert: (...args: unknown[]) => data.upsert(...args),
  };
});

const confirm = vi.hoisted(() => ({ confirmAction: vi.fn() }));
vi.mock("@/components/admin/workspace/confirm", () => confirm);

import { TramitesApp } from "@/components/admin/tramites/tramites-app";

const base = (acreedor: "infonavit" | "banco" = "infonavit") => nuevoTramite({ id: "tr-1", acreedor, titulo: "Casa de ejemplo", clienteId: "cli-1", asesorId: "a1" });
const withStep = (t: Tramite, paso: number, hechos: boolean[]): Tramite => ({ ...t, pasoActual: paso, pasos: t.pasos.map((p, i) => i !== paso ? p : { ...p, pendientes: p.pendientes.map((x, j) => ({ ...x, hecho: !!hechos[j] })) }) });

beforeEach(() => { confirm.confirmAction.mockReset(); confirm.confirmAction.mockResolvedValue(true); data.upsert.mockReset(); data.upsert.mockImplementation((_c: unknown, item: unknown) => Promise.resolve(item)); data.archivos = []; data.role = "admin"; data.ventas = []; });
afterEach(cleanup);

test("con pendientes sin marcar el paso se cierra solo si se confirma, y marcar uno guarda el cambio", async () => {
  data.tramites = [withStep(base(), 0, [true, false, false])];
  render(<TramitesApp initialId="tr-1" />);
  const cerrar = screen.getByRole("button", { name: /Cerrar el paso/ }) as HTMLButtonElement;
  expect(cerrar.disabled).toBe(false);
  // Si no se confirma, no se guarda nada.
  confirm.confirmAction.mockResolvedValueOnce(false);
  fireEvent.click(cerrar);
  await waitFor(() => expect(confirm.confirmAction).toHaveBeenCalledTimes(1));
  expect(confirm.confirmAction.mock.calls[0][0]).toMatch(/Todavía falta: .*quedará anotado en el historial del trámite/);
  expect(data.upsert).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("checkbox", { name: "Escritura con folio real" }));
  await waitFor(() => expect(data.upsert).toHaveBeenCalledTimes(1));
  const saved = data.upsert.mock.calls[0][1] as Tramite;
  expect(saved.pasos[0].pendientes.map(p => p.hecho)).toEqual([true, true, false]);
});

test("con todo hecho se cierra el paso, avanza uno y ofrece Deshacer", async () => {
  data.tramites = [withStep(base(), 0, [true, true, true])];
  render(<TramitesApp initialId="tr-1" />);
  const cerrar = screen.getByRole("button", { name: /Cerrar el paso/ }) as HTMLButtonElement;
  expect(cerrar.disabled).toBe(false);
  fireEvent.click(cerrar);
  await waitFor(() => expect(data.upsert).toHaveBeenCalledTimes(1));
  // Sin nada pendiente no pregunta.
  expect(confirm.confirmAction).not.toHaveBeenCalled();
  expect((data.upsert.mock.calls[0][1] as Tramite).pasoActual).toBe(1);
  expect(await screen.findByText(/Paso «Datos del crédito» cerrado/)).toBeTruthy();
  expect(screen.getByRole("button", { name: /Deshacer/ })).toBeTruthy();
});

test("un paso sin su documento se cierra confirmando que falta; con el documento, sin preguntar", async () => {
  data.tramites = [withStep(base("banco"), 2, [true, true])];
  const { unmount } = render(<TramitesApp initialId="tr-1" />);
  expect(screen.getByText("Documento: Carta de finiquito")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: /Cerrar el paso/ }));
  await waitFor(() => expect(data.upsert).toHaveBeenCalledTimes(1));
  expect(confirm.confirmAction.mock.calls[0][0]).toContain("Subir: Carta de finiquito");
  unmount();
  data.archivos = [{ id: "ar-1", nombre: "carta.pdf", url: "private/carta.pdf", tipo: "pdf", visibility: "private", clienteId: "cli-1", tramiteId: "tr-1", pasoClave: "carta" }];
  render(<TramitesApp initialId="tr-1" />);
  expect((screen.getByRole("button", { name: /Cerrar el paso/ }) as HTMLButtonElement).disabled).toBe(false);
  confirm.confirmAction.mockClear();
  fireEvent.click(screen.getByRole("button", { name: /Cerrar el paso/ }));
  await waitFor(() => expect(data.upsert).toHaveBeenCalledTimes(2));
  expect(confirm.confirmAction).not.toHaveBeenCalled();
});

/* TRA-01 · freno de la firma: solo el director decide firmar la venta sin la cancelación inscrita. */
const VENTA = "11111111-1111-4111-8111-111111111111";
const ligado = (extra: Partial<Tramite> = {}): Tramite => ({ ...base(), expedienteId: VENTA, ...extra });

test("el director autoriza firmar sin la cancelación con un motivo de al menos 10 caracteres", async () => {
  data.ventas = [{ id: VENTA, folio: "OP-0001", operacion: "venta", cliente_id: "cli-1" }];
  data.tramites = [ligado()];
  render(<TramitesApp initialId="tr-1" />);
  expect(await screen.findByRole("link", { name: "Venta OP-0001" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Firmar sin la cancelación" }));
  const motivo = screen.getByLabelText("Motivo de firmar sin ella");
  fireEvent.change(motivo, { target: { value: "corto" } });
  expect((screen.getByRole("button", { name: "Autorizar" }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.change(motivo, { target: { value: "  El comprador paga de contado y acepta  " } });
  fireEvent.click(screen.getByRole("button", { name: "Autorizar" }));
  await waitFor(() => expect(data.upsert).toHaveBeenCalledTimes(1));
  expect((data.upsert.mock.calls[0][1] as Tramite).firmaSinCancelacion).toEqual({ motivo: "El comprador paga de contado y acepta" });
});

test("la autorización muestra quién y cuándo, y el director la puede quitar", async () => {
  data.tramites = [ligado({ firmaSinCancelacion: { motivo: "El comprador paga de contado", autorizadoPor: "u1", autorizadoEl: "2026-11-14T18:00:00Z" } })];
  render(<TramitesApp initialId="tr-1" />);
  expect(screen.getByText(/Se firma sin la cancelación inscrita/)).toBeTruthy();
  expect(screen.getByText(/Lo autorizaste tú/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Quitar la autorización" }));
  await waitFor(() => expect(data.upsert).toHaveBeenCalledTimes(1));
  expect((data.upsert.mock.calls[0][1] as Tramite).firmaSinCancelacion).toBeNull();
});

test("el asesor ve el estado pero no la acción del director", () => {
  data.role = "editor";
  data.tramites = [ligado()];
  const { unmount } = render(<TramitesApp initialId="tr-1" />);
  expect(screen.getByText(/La firma de la venta espera/)).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Firmar sin la cancelación" })).toBeNull();
  unmount();
  data.tramites = [ligado({ firmaSinCancelacion: { motivo: "El comprador paga de contado", autorizadoPor: "u9", autorizadoEl: "2026-11-14T18:00:00Z" } })];
  render(<TramitesApp initialId="tr-1" />);
  expect(screen.getByText(/Lo autorizó el director/)).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Quitar la autorización" })).toBeNull();
});

/* TRA-01 · avance al propietario: abrir el canal no prueba el envío; se registra solo al confirmarlo. */
test("el avance se registra solo cuando el asesor confirma que lo envió", async () => {
  data.tramites = [base()];
  const open = vi.spyOn(window, "open").mockReturnValue(null);
  render(<TramitesApp initialId="tr-1" />);
  fireEvent.click(screen.getByRole("button", { name: "Enviar avance" }));
  fireEvent.click(screen.getByRole("button", { name: "Imprimir o guardar PDF" }));
  expect(open).toHaveBeenCalled();
  expect(data.upsert).not.toHaveBeenCalled();
  // «No se envió» regresa al mensaje sin registrar nada.
  fireEvent.click(screen.getByRole("button", { name: "No se envió" }));
  expect(data.upsert).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Imprimir o guardar PDF" }));
  fireEvent.click(screen.getByRole("button", { name: "Sí, se envió" }));
  await waitFor(() => expect(data.upsert).toHaveBeenCalledTimes(1));
  expect((data.upsert.mock.calls[0][1] as Tramite).ultimoAvance).toEqual({ medio: "pdf" });
  open.mockRestore();
});
