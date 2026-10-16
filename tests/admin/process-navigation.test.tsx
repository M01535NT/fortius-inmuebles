import * as React from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { LEGACY_PROCESS_SLUGS, getProcessStage } from "@/components/admin/workspace/module-catalog";
import { ProcessStageWorkspace } from "@/components/admin/workspace/process-stage";
import { clearAdminCache } from "@/lib/admin/store";
let failed = false; const requests: { url: string; method?: string }[] = [];
beforeEach(() => { failed = false; requests.length = 0; localStorage.clear(); clearAdminCache(); vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
  requests.push({ url, method: init?.method }); if (failed) return Response.json({ error: "Consulta temporalmente no disponible" }, { status: 503 });
  if (url.includes("offset=0")) return Response.json({ expedientes: [{ id: "c1", folio: "CAP-1", etapa: "captacion", operacion: "venta", fecha_objetivo: "2026-10-20" }, { id: "d1", folio: "DOC-1", etapa: "documentacion", operacion: "venta" }, { id: "deleted", folio: "ELIMINADO", etapa: "captacion", deleted_at: "2026-10-12" }, { id: "unknown", folio: "SIN-ETAPA", etapa: null }], nextOffset: 4 });
  return Response.json({ expedientes: [{ id: "c2", folio: "CAP-2", etapa: "captacion", operacion: "renta" }, { id: "closed", folio: "CERRADO-1", etapa: "cerrado", operacion: "venta" }], nextOffset: null });
})); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); clearAdminCache(); localStorage.clear(); });
test("Captación filtra todas las páginas autorizadas y abre expedientes reales sin escribir", async () => {
  await act(async () => { render(<ProcessStageWorkspace stage="captacion" />); });
  const list = await screen.findByRole("list", { name: "Expedientes en Captación" });
  expect(within(list).getAllByRole("link").map(link => link.getAttribute("href"))).toEqual(["/admin/operaciones?expediente=c1", "/admin/operaciones?expediente=c2"]);
  expect(screen.queryByText("DOC-1")).toBeNull(); expect(screen.queryByText("ELIMINADO")).toBeNull(); expect(screen.queryByText("SIN-ETAPA")).toBeNull();
  expect(screen.getByRole("link", { name: "Nueva operación" }).getAttribute("href")).toBe("/admin/operaciones/nueva");
  expect(requests.filter(request=>request.url.startsWith("/api/admin/expedientes"))).toHaveLength(2); expect(requests.every(request => !request.method || request.method === "GET")).toBe(true);
});
test("Verificación usa documentación y Cierre y entrega conserva cerrado con sus pasos", async () => {
  const view = render(<ProcessStageWorkspace stage="verificacion-precio" />); expect(await screen.findByRole("link", { name: /DOC-1/ })).toBeTruthy(); expect(screen.queryByText("CAP-1")).toBeNull();
  expect(screen.getByRole("heading", { name: "1. Verificación y precio" })).toBeTruthy(); expect(screen.getByText("Detectar obstáculos y vender con un precio sustentado.")).toBeTruthy();
  view.rerender(<ProcessStageWorkspace stage="cierre-entrega" />); expect(await screen.findByRole("link", { name: /CERRADO-1/ })).toBeTruthy(); expect(screen.getByText(/Esta etapa reúne sus pasos: firma y pago, entrega, postventa y archivo/)).toBeTruthy();
  expect(screen.getByRole("link", { name: "Ver tareas" }).getAttribute("href")).toBe("/admin/agenda?tab=tareas");
  expect(within(screen.getByRole("navigation", { name: "Etapas del proceso de venta" })).getByRole("link", { name: "5. Cierre y entrega" }).getAttribute("aria-current")).toBe("page");
});
test("fallo de API se distingue de lista vacía y permite reintentar", async () => {
  failed = true; render(<ProcessStageWorkspace stage="contrato-preparacion" />); expect(await screen.findByRole("alert")).toBeTruthy(); expect(screen.queryByText(/No hay expedientes/)).toBeNull();
  failed = false; fireEvent.click(screen.getByRole("button", { name: "Reintentar" })); expect(await screen.findByText(/No hay expedientes/)).toBeTruthy();
});

const verifiedFlow = { version: 1, ruta: "captacion", estado: "activa", motivo: "", requisitos: Object.fromEntries(["titularidad", "factibilidad", "valor", "precio"].map(key => [key, { estado: "revisado", soporte: "Revisión ficticia", evidencia: { tipo: "externa", referencia: "Carpeta ficticia v1", fecha: "2026-10-10", responsable: "Revisor ficticio", resultado: "Sin observaciones" }, vigenteHasta: "2099-12-31" }])), resolucion: { tipo: "aceptada", fecha: "2026-10-12", motivo: "Encargo aceptado", siguienteAccion: "Firmar", fechaSiguiente: "2026-10-20" } };
test("Contrato y preparación reúne documentación con verificación terminada", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ expedientes: [{ id: "v1", folio: "VERIFICA-1", etapa: "documentacion", operacion: "venta", flujo: { ...verifiedFlow, requisitos: {} } }, { id: "k1", folio: "CONTRATO-1", etapa: "documentacion", operacion: "venta", flujo: verifiedFlow }], nextOffset: null })));
  render(<ProcessStageWorkspace stage="contrato-preparacion" />);
  expect(await screen.findByRole("link", { name: /CONTRATO-1/ })).toBeTruthy(); expect(screen.queryByText("VERIFICA-1")).toBeNull();
  expect(screen.getByText(/Contrato y preparación · Venta/)).toBeTruthy();
});
test("Publicación y seguimiento muestra el informe mensual del propietario", async () => {
  vi.stubGlobal("fetch", vi.fn(async (url: string) => url.includes("informe-propietario") ? Response.json({ ultimos: { p1: "2000-01-01T00:00:00Z" } }) : Response.json({ expedientes: [{ id: "p1", folio: "PUB-1", etapa: "comercializacion", operacion: "venta" }, { id: "p2", folio: "PUB-2", etapa: "comercializacion", operacion: "venta" }], nextOffset: null })));
  render(<ProcessStageWorkspace stage="publicacion-seguimiento" />);
  expect(await screen.findByText("Informe al propietario: vencido desde 01/02/2000")).toBeTruthy();
  expect(screen.getByText("Informe al propietario: sin informe registrado")).toBeTruthy();
});
test("las direcciones anteriores apuntan a una etapa vigente", () => {
  for (const target of Object.values(LEGACY_PROCESS_SLUGS)) expect(getProcessStage(target)).toBeTruthy();
});
