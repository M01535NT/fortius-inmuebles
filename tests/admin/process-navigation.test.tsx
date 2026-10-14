import * as React from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { WorkspaceNavigation } from "@/components/admin/workspace/navigation";
import { SIDEBAR_MODULES } from "@/components/admin/workspace/module-catalog";
import { ProcessStageWorkspace } from "@/components/admin/workspace/process-stage";
import { clearAdminCache } from "@/lib/admin/store";
let failed = false; const requests: { url: string; method?: string }[] = [];
beforeEach(() => { failed = false; requests.length = 0; localStorage.clear(); clearAdminCache(); vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
  requests.push({ url, method: init?.method }); if (failed) return Response.json({ error: "Consulta temporalmente no disponible" }, { status: 503 });
  if (url.includes("offset=0")) return Response.json({ expedientes: [{ id: "c1", folio: "CAP-1", etapa: "captacion", operacion: "venta", fecha_objetivo: "2026-10-20" }, { id: "d1", folio: "DOC-1", etapa: "documentacion", operacion: "venta" }, { id: "deleted", folio: "ELIMINADO", etapa: "captacion", deleted_at: "2026-10-12" }, { id: "unknown", folio: "SIN-ETAPA", etapa: null }], nextOffset: 4 });
  return Response.json({ expedientes: [{ id: "c2", folio: "CAP-2", etapa: "captacion", operacion: "renta" }, { id: "closed", folio: "CERRADO-1", etapa: "cerrado", operacion: "venta" }], nextOffset: null });
})); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); clearAdminCache(); localStorage.clear(); });
function sidebar(role = "admin", userId = "process") { return render(<WorkspaceNavigation modules={SIDEBAR_MODULES} userId={userId} role={role} pathname="/admin/proceso/preparacion" onNavigate={() => {}} />); }
test("procedimiento aparece en orden aun con preferencias previas y Gestión conserva módulos", () => {
  localStorage.setItem("fortius:modules:process", JSON.stringify(["/admin/clientes", "/admin/reportes", "/admin", "/admin/propiedades"])); sidebar();
  expect(screen.getAllByRole("link").slice(0, 7).map(link => link.getAttribute("href"))).toEqual(["/admin", "/admin/proceso/captacion", "/admin/proceso/preparacion", "/admin/proceso/promocion", "/admin/proceso/negociacion", "/admin/proceso/cierre", "/admin/proceso/postventa"]);
  expect(screen.getByRole("link", { name: "Preparación" }).getAttribute("aria-current")).toBe("page");
  fireEvent.click(screen.getByRole("button", { name: "Gestión" }));
  for (const name of ["CRM", "Inmuebles", "Clientes", "Operaciones", "Documentos", "Calendario", "Tareas", "Asesores", "Archivos", "Configuración"]) expect(screen.getByRole("link", { name })).toBeTruthy();
});
test("Gestión mantiene restricciones de rol y etapas no se reordenan", () => {
  sidebar("editor", "process-editor"); fireEvent.click(screen.getByRole("button", { name: "Organizar módulos" }));
  expect(screen.queryByRole("button", { name: "Subir Captación" })).toBeNull();
  expect(screen.queryByRole("link", { name: "Finanzas" })).toBeNull(); expect(screen.queryByRole("link", { name: "Reportes" })).toBeNull();
  expect(screen.getByRole("link", { name: "Clientes" })).toBeTruthy();
});
test("Captación filtra todas las páginas autorizadas y abre expedientes reales sin escribir", async () => {
  await act(async () => { render(<ProcessStageWorkspace stage="captacion" />); });
  const list = await screen.findByRole("list", { name: "Expedientes en Captación" });
  expect(within(list).getAllByRole("link").map(link => link.getAttribute("href"))).toEqual(["/admin/expedientes?expediente=c1", "/admin/expedientes?expediente=c2"]);
  expect(screen.queryByText("DOC-1")).toBeNull(); expect(screen.queryByText("ELIMINADO")).toBeNull(); expect(screen.queryByText("SIN-ETAPA")).toBeNull();
  expect(requests).toHaveLength(2); expect(requests.every(request => !request.method || request.method === "GET")).toBe(true);
});
test("Preparación usa documentación y Postventa conserva cerrado con accesos de seguimiento", async () => {
  const view = render(<ProcessStageWorkspace stage="preparacion" />); expect(await screen.findByRole("link", { name: /DOC-1/ })).toBeTruthy(); expect(screen.queryByText("CAP-1")).toBeNull();
  view.rerender(<ProcessStageWorkspace stage="postventa" />); expect(await screen.findByRole("link", { name: /CERRADO-1/ })).toBeTruthy(); expect(screen.getByText(/Postventa no es una etapa registrada/)).toBeTruthy();
  expect(screen.getByRole("link", { name: "Abrir agenda" }).getAttribute("href")).toBe("/admin/calendario"); expect(screen.getByRole("link", { name: "Ver tareas" }).getAttribute("href")).toBe("/admin/tareas");
});
test("fallo de API se distingue de lista vacía y permite reintentar", async () => {
  failed = true; render(<ProcessStageWorkspace stage="cierre" />); expect(await screen.findByRole("alert")).toBeTruthy(); expect(screen.queryByText(/No hay expedientes/)).toBeNull();
  failed = false; fireEvent.click(screen.getByRole("button", { name: "Reintentar" })); expect(await screen.findByText(/No hay expedientes/)).toBeTruthy();
});
