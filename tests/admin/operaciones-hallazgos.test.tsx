import * as React from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, render, renderHook, screen, waitFor, within } from "@testing-library/react";

/*
  Hallazgos de Operaciones (C-89 a C-91). Datos ficticios de ensayo; el servidor se simula con fetch.
*/
const nav = vi.hoisted(() => ({ path: "/admin/operaciones", search: new URLSearchParams(), listeners: new Set<() => void>(), push: vi.fn() }));
vi.mock("next/navigation", async () => {
  const react = await import("react");
  const subscribe = (cb: () => void) => { nav.listeners.add(cb); return () => nav.listeners.delete(cb); };
  const replace = (url: string) => { const u = new URL(url, "http://localhost"); nav.path = u.pathname; nav.search = u.searchParams; nav.listeners.forEach(cb => cb()); };
  return { usePathname: () => nav.path, useSearchParams: () => react.useSyncExternalStore(subscribe, () => nav.search), useRouter: () => ({ push: nav.push, replace }), useParams: () => ({}) };
});
vi.mock("@/components/admin/workspace/confirm", () => ({ confirmAction: vi.fn().mockResolvedValue(true), confirmDeleteOperation: vi.fn().mockResolvedValue(true) }));
vi.mock("@/lib/admin/store", async original => ({ ...await original<typeof import("@/lib/admin/store")>(), useSession: () => ({ id: "u1", email: "asesor@example.test", role: "admin", name: "Asesor de ensayo" }) }));
import { clearAdminCache } from "@/lib/admin/store";
import { OperationScreen } from "@/components/admin/operation/screen";
import { useOperationDocuments } from "@/components/admin/operation/use-documents";
import type { OperationRecord } from "@/lib/admin/operation-view";

const ID = "51000000-0000-4000-8000-000000000089";
const accepted = { resolucion: { tipo: "aceptada", fecha: "2026-10-09", motivo: "Encargo aceptado de ensayo", siguienteAccion: "Firmar", fechaSiguiente: "2026-10-12" } };
const flow = (extra: Record<string, unknown> = {}) => ({ version: 1, ruta: "captacion", estado: "activa", motivo: "", requisitos: {}, ...extra });
type Op = Record<string, unknown> & { id: string; version: number };
let server: { ops: Op[]; runs: Record<string, Record<string, unknown>[]>; puts: Array<{ url: string; body: Record<string, unknown> }> };
const base = (over: Partial<Op> = {}): Op => ({ id: ID, folio: "EXP-ENSAYO-089", version: 3, operacion: "venta", etapa: "comercializacion", cliente_id: "c1", asesor_id: "a1", propiedad_slug: "casa", flujo: flow(accepted), ...over });
const collections: Record<string, () => Record<string, unknown>[]> = {
  clientes: () => [{ id: "c1", nombre: "Propietaria de ensayo", tipo: "propietario", telefono: "6640000089", asesorId: "a1" }],
  propiedades: () => [{ slug: "casa", codigo: "F-89", titulo: "Casa de ensayo", estado: "disponible", galeria: [], precio: { modalidad: "consulta" }, asesorId: "a1" }],
  asesores: () => [{ id: "a1", nombre: "Asesor de ensayo", activo: true }],
  tareas: () => [], eventos: () => [], leads: () => [],
};
Element.prototype.scrollIntoView ??= () => undefined;
function respond(url: string, init?: RequestInit): Response {
  const method = init?.method ?? "GET";
  const body = init?.body && typeof init.body === "string" ? JSON.parse(init.body) : undefined;
  const path = url.split("?")[0];
  if (path === "/api/admin/expedientes" && method === "GET") return Response.json({ expedientes: server.ops, nextOffset: null });
  const opMatch = path.match(/^\/api\/admin\/expedientes\/([^/]+)(\/.*)?$/);
  if (opMatch) {
    const [, , rest = ""] = opMatch;
    if (rest === "/formatos") return Response.json({ documentos: [] });
    if (rest === "/actividad") return Response.json({ actividad: [] });
  }
  if (path === "/api/admin/entrevistas") return Response.json({ entrevistas: [] });
  if (path === "/api/admin/mi-asesor") return Response.json({ asesorId: "a1" });
  if (path === "/api/admin/apps/runs") return Response.json({ runs: server.runs[new URL(url, "http://x").searchParams.get("slug") ?? ""] ?? [], nextOffset: null });
  const col = path.match(/^\/api\/admin\/collections\/([^/]+)(?:\/(.+))?$/);
  if (col) {
    if (method === "PUT") { server.puts.push({ url, body }); return Response.json({ record: { id: decodeURIComponent(col[2]), data: body.data, version: 1 } }); }
    return Response.json({ records: (collections[col[1]]?.() ?? []).map(data => ({ id: (data.id ?? data.slug) as string, data, version: 1 })) });
  }
  return Response.json({});
}
beforeEach(() => {
  clearAdminCache(); nav.push.mockReset();
  nav.path = "/admin/operaciones"; nav.search = new URLSearchParams();
  vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date("2026-10-16T18:00:00Z"));
  server = { ops: [base()], runs: {}, puts: [] };
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => respond(url, init)));
});
afterEach(() => { cleanup(); clearAdminCache(); vi.useRealTimers(); vi.unstubAllGlobals(); });
async function openOperation() {
  nav.path = `/admin/operaciones/${ID}`; nav.search = new URLSearchParams();
  render(<OperationScreen id={ID} />);
  await screen.findByRole("heading", { level: 1, name: "Propietaria de ensayo" });
}

/*
  BUG-C89: «Iniciar lista» crea la tarea del checklist con vence = Date.now() + 7 días cortado en UTC
  (src/components/admin/operation/use-documents.tsx:169). Desde las 16:00/17:00 de Tijuana la fecha UTC
  ya es mañana: el asesor que inicia la lista el 13 nov a las 19:00 recibe la tarea a 8 días (21 nov).
*/
it("BUG-C89: la lista de documentos iniciada en la tarde de Tijuana vence a 7 días, no a 8", async () => {
  vi.setSystemTime(new Date("2026-11-14T03:00:00Z")); // 13 nov 2026, 19:00 en Tijuana (UTC-8)
  const op = { ...base({ etapa: "captacion", flujo: flow() }) } as unknown as OperationRecord;
  const { result } = renderHook(() => useOperationDocuments({ op, interviewAnswers: { tipoInmueble: "casa" } }));
  await waitFor(() => expect(result.current.documents).toBeDefined());
  await act(async () => { await result.current.startChecklist(); });
  const put = server.puts.find(p => p.url.includes("/collections/tareas/"));
  expect(put?.body.data).toMatchObject({ id: `checklist-${ID}` });
  expect((put!.body.data as { vence: string }).vence, "13 nov + 7 días en Tijuana es el 20 nov").toBe("2026-11-20");
});

/*
  BUG-C90: sin ningún informe preparado ni entregado, la tarjeta dice «Al día; el siguiente toca el <hoy>»
  (src/components/admin/operation/next-step.tsx:560, 563 y 582): `runs?.filter(...)` devuelve [] (verdadero),
  así que se calcula un estado «sin_informe» y el texto cae en la rama de «Al día» con la fecha de hoy.
*/
it("BUG-C90: sin informes, la tarjeta dice que no hay informe, no «Al día» con fecha de hoy", async () => {
  server.runs["informe-propietario"] = [];
  await openOperation();
  const informe = await screen.findByRole("region", { name: "Informe al propietario" });
  await waitFor(() => expect(within(informe).queryByText("Consultando informes…")).toBeNull());
  expect(within(informe).queryByText(/^Al día/), "no hay informe: no puede estar «Al día»").toBeNull();
  expect(within(informe).getByText("Todavía no hay un informe preparado para esta operación.")).toBeTruthy();
});

/*
  BUG-C91: el informe preparado el 15 oct a las 20:00 de Tijuana (2026-10-16T03:00Z) y entregado ese
  mismo 15 oct sigue avisando «todavía no se registra como entregado» y muestra «Último preparado: 16 oct»
  (src/components/admin/operation/next-step.tsx:584 y 587): compara y fecha con preparado.slice(0, 10),
  el día UTC, en vez del día de Tijuana (lastOwnerReport ya lo corrigió en C-12, la tarjeta no).
*/
it("BUG-C91: un informe entregado el mismo día en que se preparó en la noche no queda «sin entregar»", async () => {
  server.ops = [base({ flujo: flow({ ...accepted, entregasInforme: [{ fecha: "2026-10-15", canal: "whatsapp", responsable: "Asesor de ensayo", registradoEl: "2026-10-16T03:30:00Z" }] }) })];
  server.runs["informe-propietario"] = [{ id: "r89", title: "Informe de ensayo", updatedAt: "2026-10-16T03:00:00Z", result: { title: "ok", summary: [] } }];
  await openOperation();
  const informe = await screen.findByRole("region", { name: "Informe al propietario" });
  await within(informe).findByText("15 oct · WhatsApp · Asesor de ensayo");
  expect(within(informe).queryByText("El último informe preparado todavía no se registra como entregado."), "se entregó el mismo día de Tijuana en que se preparó").toBeNull();
  const preparado = within(informe).getByText("Último preparado").nextElementSibling;
  expect(preparado?.textContent, "preparado el 15 oct en Tijuana").toBe("15 oct");
});
