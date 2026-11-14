const confirmAction = vi.hoisted(() => vi.fn().mockResolvedValue(false));
vi.mock("@/components/admin/workspace/confirm", () => ({ confirmAction, confirmDelete: vi.fn().mockResolvedValue(false) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }), useSearchParams: () => new URLSearchParams(), usePathname: () => "/admin/agenda" }));
import * as React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import TareasScreen from "@/components/admin/screens/tareas";
import { UndoNotice, useUndo } from "@/components/admin/workspace/undo-notice";
import { clearAdminCache } from "@/lib/admin/store";
import { waitingItems, type TodayDossier } from "@/lib/admin/today";
import { emptyWorkflow, type OperationWorkflow } from "@/lib/formatos/operation-workflow";
import type { Task } from "@/lib/tasks";

const hoy = "2026-11-13";
const rec = (id: string, data: unknown, version = 1) => ({ id, data, version, createdAt: "2026-11-01T00:00:00.000Z", updatedAt: "2026-11-01T00:00:00.000Z" });
const tarea = (over: Partial<Task> = {}): Task => ({ id: "t1", titulo: "Llamar al prospecto de ensayo", descripcion: "", categoria: "leads", estado: "pendiente", prioridad: "normal", pasos: [], vence: hoy, leadId: "l1", asesorId: "a1", ...over });

type Put = { coleccion: string; id: string; version: number | null; data: Record<string, unknown> };
let puts: Put[];
let colecciones: Record<string, ReturnType<typeof rec>[]>;

beforeEach(() => {
  clearAdminCache();
  confirmAction.mockClear();
  puts = [];
  colecciones = {
    asesores: [rec("a1", { id: "a1", nombre: "Asesor de ensayo", activo: true })],
    leads: [rec("l1", { id: "l1", nombre: "Prospecto de ensayo", telefono: "6640000000", origen: "manual", estado: "contactado", asesorId: "a1", creadoEl: "2026-11-01T18:00:00.000Z", notas: [] })],
    tareas: [rec("t1", tarea())],
  };
  Element.prototype.scrollIntoView = vi.fn();
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn() })));
  vi.stubGlobal("fetch", vi.fn(async (input: string, init?: RequestInit) => {
    const url = String(input).split("?")[0];
    const parts = url.split("/");
    if (init?.method === "PUT" && url.includes("/collections/")) {
      const body = JSON.parse(String(init.body));
      const put: Put = { coleccion: parts[parts.length - 2], id: decodeURIComponent(parts[parts.length - 1]), version: body.version, data: body.data };
      puts.push(put);
      const lista = colecciones[put.coleccion] ?? (colecciones[put.coleccion] = []);
      const actual = lista.find(r => r.id === put.id);
      if (actual && put.version !== null && put.version !== actual.version) return Response.json({ error: "Otra persona guardó este registro antes. Recarga para ver lo último." }, { status: 409 });
      const nuevo = rec(put.id, put.data, (actual?.version ?? 0) + 1);
      colecciones[put.coleccion] = [nuevo, ...lista.filter(r => r.id !== put.id)];
      return Response.json({ record: nuevo });
    }
    if (url === "/api/admin/mi-asesor") return Response.json({ asesorId: "a1" });
    if (url === "/api/admin/expedientes") return Response.json({ expedientes: [] });
    if (url === "/api/admin/tareas/capacidades") return Response.json({ expedienteLinks: true });
    return Response.json({ records: colecciones[parts[parts.length - 1]] ?? [] });
  }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers(); clearAdminCache(); });

/*
  BUG-C71: completar el siguiente paso de una persona ofrece «Deshacer» y, a la vez, abre «¿Qué sigue
  con…?» (screens/tareas.tsx:59-62; igual en workspace/hoy.tsx:200-203). «Deshacer» solo reabre la
  tarea: la pregunta sigue abierta. Si el asesor la contesta, `planNextStep` encuentra la tarea recién
  reabierta y le cambia el título y la fecha (next-step-task.ts:55): se pierde el paso que deshizo.
*/
test("«Deshacer» al completar el siguiente paso también retira la pregunta de qué sigue", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-13T18:00:00.000Z"));
  render(<TareasScreen />);
  fireEvent.click(await screen.findByRole("checkbox", { name: "Marcar como hecha: Llamar al prospecto de ensayo" }));
  await screen.findByRole("form", { name: "Siguiente paso con Prospecto de ensayo" });
  fireEvent.click(await screen.findByRole("button", { name: "Deshacer" }));
  await waitFor(() => expect(puts.filter(p => p.coleccion === "tareas")).toHaveLength(2));
  await waitFor(() => expect(screen.queryByRole("button", { name: "Deshacer" })).toBeNull());
  expect(puts[1].data.estado, "la tarea quedó reabierta").toBe("pendiente");
  expect(screen.queryByRole("form", { name: "Siguiente paso con Prospecto de ensayo" }), "la pregunta «¿Qué sigue?» tras deshacer").toBeNull();
});

function UndoHarness() {
  const undo = useUndo();
  return <>
    <button type="button" onClick={() => undo.offer({ text: `Completaste «Tarea ${Date.now()}».`, undo: async () => undefined })}>Completar otra</button>
    <UndoNotice {...undo} onError={() => undefined} />
  </>;
}

/*
  BUG-C72: el aviso de «Deshacer» deja de contar sus 8 s mientras tiene el puntero encima
  (undo-notice.tsx:302) y vuelve a contar con `onPointerLeave`. Al pulsar «Deshacer» con el ratón
  el aviso desaparece bajo el puntero, nunca llega `pointerleave` y `hold` se queda en `true`
  (undo-notice.tsx:289-291). El siguiente «Completaste…» ya no se va solo: queda fijo en la pantalla.
*/
test("tras deshacer con el ratón, el siguiente aviso de «Deshacer» se retira solo", async () => {
  vi.useFakeTimers();
  render(<UndoHarness />);
  fireEvent.click(screen.getByRole("button", { name: "Completar otra" }));
  fireEvent.pointerEnter(screen.getByRole("status"));
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Deshacer" })); });
  expect(screen.queryByRole("status")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Completar otra" }));
  expect(screen.getByRole("status")).toBeTruthy();
  act(() => { vi.advanceTimersByTime(9000); });
  expect(screen.queryByRole("status"), "aviso de «Deshacer» 9 s después, sin el puntero encima").toBeNull();
});

/*
  BUG-C73: «Lo siguiente» en Hoy decide «Hoy» comparando la marca guardada por la base (UTC) recortada
  a fecha con el «hoy» de Tijuana (today.ts:165 `since` y today.ts:185 para la oferta). Un documento
  recibido o una oferta registrada desde las 16:00 (17:00 en verano) sale como «Desde el 14 nov» /
  «El 14 nov»: una fecha de mañana.
*/
test("lo recibido o la oferta de esta tarde dicen «Hoy» en la cola de Hoy", () => {
  const names = { client: () => undefined, property: () => undefined };
  const flujo = (requisitos: OperationWorkflow["requisitos"]) => ({ ...emptyWorkflow("captacion"), requisitos }) as OperationWorkflow;
  const recibido: TodayDossier = { id: "51000000-0000-4000-8000-000000000001", folio: "EXP-1", etapa: "captacion", cliente_id: "c1", asesor_id: "a1",
    flujo: flujo({ titularidad: { estado: "recibido", soporte: "", registradoEl: "2026-11-14T01:30:00.123456+00:00" } }) };
  const ofertada: TodayDossier = { id: "51000000-0000-4000-8000-000000000002", folio: "EXP-2", etapa: "captacion", cliente_id: "c2", asesor_id: "a1", flujo: flujo({}) };
  const items = waitingItems({ dossiers: [recibido, ofertada], tasks: [], offers: [{ id: "o1", updatedAt: "2026-11-14T00:15:00.000Z", context: { expedienteId: ofertada.id } }], followups: [], names, today: hoy });
  const de = (id: string) => items.find(item => item.id === id);
  expect(de(recibido.id)?.kind).toBe("revisar");
  expect(de(recibido.id)?.when, "documento recibido el 13 nov a las 17:30 de Tijuana").toBe("Hoy");
  expect(de(ofertada.id)?.kind).toBe("oferta");
  expect(de(ofertada.id)?.when, "oferta registrada el 13 nov a las 16:15 de Tijuana").toBe("Hoy");
});

/*
  BUG-C74: en Agenda → Tareas, «Nueva tarea» monta el formulario solo mientras `creating` es verdadero
  (screens/tareas.tsx:97 y :100). «Cerrar captura» (o cambiar a la pestaña «Agenda») desmonta
  `TaskForm` y su borrador: al volver a abrir, lo escrito ya no está y nadie preguntó. El aviso de
  cambios sin guardar de task-form.tsx:27 solo vigila enlaces a otra ruta y el cierre de la ventana;
  en la misma pantalla, la agenda sí conserva lo escrito al cerrar su panel (calendar.tsx:279 `keepMounted`).
*/
test("cerrar la captura de una tarea nueva no borra lo escrito sin preguntar", async () => {
  render(<TareasScreen />);
  fireEvent.click(await screen.findByRole("button", { name: "Nueva tarea" }));
  fireEvent.change(await screen.findByLabelText("Título"), { target: { value: "Pedir escrituras al propietario de ensayo" } });
  fireEvent.click(screen.getByRole("button", { name: "Cerrar captura" }));
  fireEvent.click(await screen.findByRole("button", { name: "Nueva tarea" }));
  expect((screen.getByLabelText("Título") as HTMLInputElement).value, "título de la tarea tras cerrar y reabrir la captura").toBe("Pedir escrituras al propietario de ensayo");
});
