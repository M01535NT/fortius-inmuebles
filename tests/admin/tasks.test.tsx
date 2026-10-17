import * as React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { TaskForm } from "@/components/admin/task-form";
import type { Task } from "@/lib/tasks";
import TaskDetailPage from "@/app/admin/tareas/[id]/page";
import TasksPage from "@/components/admin/screens/tareas";
import { RelatedWork } from "@/components/admin/workspace/related-work";

const store = vi.hoisted(() => ({ tasks: [] as unknown[], version: 7, put: vi.fn(), load: vi.fn(), search: "", request: vi.fn(), sequence: 0, records: {} as Record<string, unknown[]> }));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(store.search), useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));

vi.mock("@/lib/admin/store", () => ({
  db: { tareas: { kind: "tareas", version: () => store.version, load: () => store.load(), list: () => store.tasks }, asesores: { kind: "asesores" }, leads: { kind: "leads" }, clientes: { kind: "clientes" }, propiedades: { kind: "propiedades" }, eventos: { kind: "eventos" } },
  useCollection: (collection: { kind?: string }) => collection.kind === "tareas" ? store.tasks : store.records[collection.kind ?? ""] ?? [],
  apiRequest: (...args: unknown[]) => store.request(...args),
  upsert: (...args: unknown[]) => store.put(...args), uid: () => `draft-${++store.sequence}`, errorMessage: (e: Error) => e.message,
}));
beforeEach(() => { store.sequence = 0; store.records = {}; store.request.mockReset().mockImplementation(async (url: string) => url.includes("capacidades") ? { expedienteLinks: true } : { expedientes: [] }); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); store.search = ""; });
const task = { id: "task-1", titulo: "Revisar expediente", descripcion: "", categoria: "administracion", estado: "pendiente", prioridad: "normal", pasos: [] } as Task;

test("creates a compact task and only persists on explicit save", async () => {
  const save = vi.fn().mockResolvedValue(task);
  render(<TaskForm onSave={save} />);
  fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Llamar al propietario" } });
  expect(save).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Guardar tarea" }));
  await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ titulo: "Llamar al propietario", estado: "pendiente" })));
});

test("retains edits and checklist after a conflict and a remote refresh", async () => {
  const save = vi.fn().mockRejectedValue(new Error("Conflicto 409"));
  const view = render(<TaskForm initial={task} onSave={save} />);
  fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Mi cambio" } });
  fireEvent.click(screen.getByRole("button", { name: "Añadir paso" }));
  fireEvent.change(screen.getByLabelText("Paso 1"), { target: { value: "Solicitar copia" } });
  fireEvent.click(screen.getByLabelText("Completar paso 1"));
  fireEvent.click(screen.getByRole("button", { name: "Guardar tarea" }));
  await screen.findByRole("alert");
  view.rerender(<TaskForm initial={{ ...task, titulo: "Cambio remoto" }} onSave={save} />);
  expect((screen.getByLabelText("Título") as HTMLInputElement).value).toBe("Mi cambio");
  expect((screen.getByLabelText("Paso 1") as HTMLInputElement).value).toBe("Solicitar copia");
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ pasos: [expect.objectContaining({ texto: "Solicitar copia", hecho: true })] }));
});

test("a template populates only a draft", () => {
  const save = vi.fn();
  render(<TaskForm onSave={save} />);
  const select = screen.getByLabelText("Plantilla opcional") as HTMLSelectElement;
  fireEvent.change(select, { target: { value: select.options[1].value } });
  expect((screen.getByLabelText("Título") as HTMLInputElement).value.length).toBeGreaterThan(0);
  expect(screen.getAllByRole("checkbox").length).toBeGreaterThan(0);
  expect(save).not.toHaveBeenCalled();
});

test("detail preserves a draft and its version when a task disappears during editing", async () => {
  store.tasks = [task]; store.version = 7;
  store.put.mockReset().mockRejectedValue(Object.assign(new Error("Registro eliminado o modificado"), { status: 409 }));
  store.load.mockReset().mockResolvedValue(undefined);
  const params = Promise.resolve({ id: task.id });
  const page = <React.Suspense fallback="Cargando"><TaskDetailPage params={params} /></React.Suspense>;
  let view: ReturnType<typeof render>;
  await act(async () => { view = render(page); });
  fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Conservar este borrador" } });
  store.tasks = []; store.version = 9;
  view!.rerender(<React.Suspense fallback="Cargando"><TaskDetailPage params={params} /></React.Suspense>);
  fireEvent.click(screen.getByRole("button", { name: "Guardar tarea" }));
  await screen.findByRole("alert");
  expect(store.put).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ titulo: "Conservar este borrador" }), 7);
  expect((screen.getByLabelText("Título") as HTMLInputElement).value).toBe("Conservar este borrador");
  expect(screen.queryByRole("button", { name: "Usar versión actual como base" })).toBeNull();
  expect(screen.getByText(/no se puede guardar sobre un registro eliminado/)).toBeTruthy();
});

test("completion saves current draft and notes without inventing history", async () => {
  const save = vi.fn(async (value: Task) => value);
  render(<TaskForm initial={task} onSave={save} />);
  fireEvent.change(screen.getByLabelText("Añadir nota al historial"), { target: { value: "Documentos revisados" } });
  fireEvent.click(screen.getByRole("button", { name: "Completar tarea" }));
  await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ estado: "completada", nuevaNota: "Documentos revisados" })));
  expect(save.mock.calls[0][0].historial).toBeUndefined();
  expect(save.mock.calls[0][0].completadoPor).toBeUndefined();
});

test("today follows Tijuana even after UTC midnight", () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-09-24T02:00:00Z"));
  // Simulate a browser whose local calendar has already reached the 24th.
  vi.spyOn(Date.prototype, "getDate").mockReturnValue(24);
  store.search = "vence=hoy";
  store.tasks = [{ ...task, vence: "2026-09-23" }];
  render(<TasksPage />);
  expect(screen.getByRole("link", { name: task.titulo })).toBeTruthy();
  expect(screen.queryByText("Vencida")).toBeNull();
});

test("conflict recovery requires explicit review before saving the retained draft against the new version", async () => {
  store.tasks = [task]; store.version = 7;
  store.load.mockReset().mockImplementation(async () => {
    store.version = 9; store.tasks = [{ ...task, titulo: "Cambio de otro asesor", descripcion: "Documento recibido" }];
  });
  store.put.mockReset().mockRejectedValueOnce(Object.assign(new Error("Conflicto"), { status: 409 })).mockImplementation(async (_collection, value) => value);
  const params = Promise.resolve({ id: task.id });
  await act(async () => { render(<React.Suspense fallback="Cargando"><TaskDetailPage params={params} /></React.Suspense>); });
  fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Mi borrador conservado" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar tarea" }));
  const recovery = await screen.findByRole("button", { name: "Usar versión actual como base" });
  expect(store.put).toHaveBeenCalledTimes(1);
  expect(screen.getByText("Cambio de otro asesor")).toBeTruthy();
  expect((screen.getByLabelText("Título") as HTMLInputElement).value).toBe("Mi borrador conservado");
  fireEvent.click(recovery);
  expect(store.put).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "Guardar tarea" }));
  await waitFor(() => expect(store.put).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({ titulo: "Mi borrador conservado" }), 9));
});

test("next seven days excludes distant and closed tasks; all dates can show completed work", () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-09-23T19:00:00Z"));
  store.search = "vence=proximas";
  store.tasks = [
    { ...task, id: "near", titulo: "Próxima semana", vence: "2026-09-30" },
    { ...task, id: "far", titulo: "Más adelante", vence: "2026-10-01" },
    { ...task, id: "closed", titulo: "Ya resuelta", vence: "2026-09-24", estado: "completada" },
  ];
  const view = render(<TasksPage />);
  expect(screen.getByRole("link", { name: "Próxima semana" })).toBeTruthy();
  expect(screen.queryByRole("link", { name: "Más adelante" })).toBeNull();
  expect(screen.queryByRole("link", { name: "Ya resuelta" })).toBeNull();
  store.search = "vence=todas";
  view.rerender(<TasksPage />);
  fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "completada" } });
  expect(screen.getByRole("link", { name: "Ya resuelta" })).toBeTruthy();
  expect(screen.queryByText("Vencida")).toBeNull();
});


const dossierA = { id: "60000000-0000-4000-8000-000000000010", folio: "VENTA-1", cliente_id: "c-own", asesor_id: "own", propiedad_slug: "same-property" };
const dossierB = { ...dossierA, id: "60000000-0000-4000-8000-000000000011", folio: "RENTA-2" };
function dossiers(ready = true) {
  store.request.mockImplementation(async (url: string) => url.includes("capacidades") ? { expedienteLinks: ready } : { expedientes: [dossierA,dossierB] });
  store.records = { asesores: [{ id: "own", nombre: "Ana" }], clientes: [{ id: "c-own", nombre: "Propietario" }], propiedades: [{ slug: "same-property", titulo: "Mismo inmueble" }] };
}
test("choosing a dossier fixes task context and saves the direct reference", async () => {
  dossiers(); const save = vi.fn(async (value: Task) => value);
  render(<TaskForm onSave={save} />);
  const selector = await screen.findByLabelText("Operación relacionada");
  await waitFor(() => expect(screen.getByRole("option", { name: "VENTA-1" })).toBeTruthy());
  fireEvent.change(selector, { target: { value: dossierA.id } });
  fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Revisión de venta" } });
  expect((screen.getByLabelText("Responsable") as HTMLSelectElement).disabled).toBe(true);
  expect((screen.getByLabelText("Cliente relacionado") as HTMLSelectElement).value).toBe("c-own");
  expect((screen.getByLabelText("Inmueble relacionado") as HTMLSelectElement).value).toBe("same-property");
  fireEvent.click(screen.getByRole("button", { name: "Guardar tarea" }));
  await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ expedienteId: dossierA.id, clienteId: "c-own", asesorId: "own", propiedadSlug: "same-property" })));
});
test("creation from a dossier URL retains the exact operation after the authorized list loads", async () => {
  dossiers(); store.search = `nueva=1&expediente=${dossierB.id}`;
  store.put.mockReset().mockImplementation(async (_collection, value) => value);
  render(<TasksPage />);
  await waitFor(() => expect((screen.getByLabelText("Operación relacionada") as HTMLSelectElement).value).toBe(dossierB.id));
  fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Revisión de renta" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar tarea" }));
  await waitFor(() => expect(store.put).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ expedienteId: dossierB.id, clienteId: "c-own", asesorId: "own" }), null));
});
test("missing migration blocks dossier references but permits legacy updates", async () => {
  dossiers(false); const save = vi.fn(async (value: Task) => value);
  render(<TaskForm initial={{ ...task, expedienteId: dossierA.id, clienteId: "c-own", asesorId: "own", propiedadSlug: "same-property" }} onSave={save} />);
  await screen.findByText(/Vincular tareas con operaciones todavía no está disponible/);
  fireEvent.click(screen.getByRole("button", { name: "Guardar tarea" }));
  await screen.findByRole("alert"); expect(save).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Operación relacionada"), { target: { value: "" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar tarea" }));
  await waitFor(() => expect(save).toHaveBeenCalledWith(expect.not.objectContaining({ expedienteId: dossierA.id })));
});
test("dossier work shows its direct tasks and labels legacy property tasks without mixing another operation", async () => {
  dossiers(); store.tasks = [
    { ...task, id: "direct-a", titulo: "Directa venta", expedienteId: dossierA.id, clienteId: "c-own", propiedadSlug: "same-property" },
    { ...task, id: "direct-b", titulo: "Directa renta", expedienteId: dossierB.id, clienteId: "c-own", propiedadSlug: "same-property" },
    { ...task, id: "legacy-property", titulo: "Anterior inmueble", propiedadSlug: "same-property" },
  ];
  render(<RelatedWork expedienteId={dossierA.id} clienteId="c-own" propertySlug="same-property" />);
  expect(screen.getByRole("link", { name: /Directa venta/ })).toBeTruthy();
  expect(screen.queryByRole("link", { name: /Directa renta/ })).toBeNull();
  expect(screen.getByRole("link", { name: /Anterior inmueble.*Sin operación vinculada/ })).toBeTruthy();
  expect(screen.getByRole("link", { name: "Crear tarea relacionada" }).getAttribute("href")).toContain(`expediente=${dossierA.id}`);
});

test("a dossier outside the authorized list remains blocked and does not erase the written title", async () => {
  dossiers(); const save = vi.fn(async (value: Task) => value);
  render(<TaskForm defaults={{ expedienteId: "60000000-0000-4000-8000-000000000099" }} onSave={save} />);
  await screen.findByText(/ya no está en curso o no está disponible/);
  fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Conservar título" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar tarea" }));
  await screen.findByRole("alert"); expect(save).not.toHaveBeenCalled();
  expect((screen.getByLabelText("Título") as HTMLInputElement).value).toBe("Conservar título");
});

test("a failed capability check reports uncertainty without claiming the migration is missing", async () => {
  store.request.mockImplementation(async (url: string) => {
    if (url.includes("capacidades")) throw new Error("Sin conexión");
    return { expedientes: [] };
  });
  const save = vi.fn(async (value: Task) => value);
  render(<TaskForm initial={task} onSave={save} />);
  await screen.findByText(/No se pudo comprobar el vínculo con operaciones/);
  expect(screen.queryByText(/Vincular tareas con operaciones todavía no está disponible/)).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Guardar tarea" }));
  await waitFor(() => expect(save).toHaveBeenCalled());
});
