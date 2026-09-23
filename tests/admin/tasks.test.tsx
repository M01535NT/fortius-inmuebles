import * as React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { TaskForm } from "@/components/admin/task-form";
import type { Task } from "@/lib/tasks";
import TaskDetailPage from "@/app/admin/tareas/[id]/page";
import TasksPage from "@/app/admin/tareas/page";

const store = vi.hoisted(() => ({ tasks: [] as unknown[], version: 7, put: vi.fn(), load: vi.fn(), search: "" }));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(store.search), useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));

vi.mock("@/lib/admin/store", () => ({
  db: { tareas: { kind: "tareas", version: () => store.version, load: () => store.load(), list: () => store.tasks }, asesores: {}, leads: {}, clientes: {}, propiedades: {} },
  useCollection: (collection: { kind?: string }) => collection.kind === "tareas" ? store.tasks : [],
  upsert: (...args: unknown[]) => store.put(...args), uid: () => "draft-id", errorMessage: (e: Error) => e.message,
}));
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

