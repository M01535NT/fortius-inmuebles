import * as React from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import AdminDashboard from "@/app/admin/page";
import { clearAdminCache } from "@/lib/admin/store";
import { resetTodayData } from "@/components/admin/workspace/use-today-queue";
import type { TodayDossier } from "@/lib/admin/today";
import type { Task } from "@/lib/tasks";

/*
  LV-10b: Hoy palomea sin salir y cumple las reglas de volumen (29/10/2026):
  con foto solo los 4 más urgentes, hasta 10 filas en total y al final «Ver los N en Asuntos»;
  varios pendientes de la misma persona en una sola fila («2 pendientes»).
*/
const today = "2026-10-16";
const rec = (id: string, data: unknown, version = 1) => ({ id, data, version });
const task = (over: Partial<Task>): Task => ({ id: "t", titulo: "Tarea", descripcion: "", categoria: "captacion", estado: "pendiente", prioridad: "normal", pasos: [], asesorId: "a1", ...over });
const dossier = (n: number, cliente = `c${n}`): TodayDossier => ({
  id: `d${n}`, folio: `EXP-2026-${String(100 + n)}`, etapa: "documentacion", cliente_id: cliente, propiedad_slug: null, asesor_id: "a1",
  flujo: { version: 1, ruta: "captacion", estado: "activa", motivo: "", requisitos: {} } as unknown as TodayDossier["flujo"],
});

let puts: Array<Record<string, unknown>>;
let collections: Record<string, ReturnType<typeof rec>[]>;
let dossiers: TodayDossier[];

/** `n` asuntos, cada uno con una tarea vencida de su propio cliente (la más vieja primero). */
function seed(n: number, sameClient: number[] = []) {
  dossiers = Array.from({ length: n }, (_, i) => dossier(i + 1, sameClient.includes(i + 1) ? `c${sameClient[0]}` : `c${i + 1}`));
  collections = {
    clientes: Array.from({ length: n }, (_, i) => rec(`c${i + 1}`, { id: `c${i + 1}`, nombre: `Cliente de ensayo ${i + 1}` })),
    tareas: dossiers.map((d, i) => rec(`t${i + 1}`, task({ id: `t${i + 1}`, titulo: `Llamar al cliente ${i + 1}`, expedienteId: d.id, vence: `2026-10-${String(1 + i).padStart(2, "0")}` }))),
  };
}

beforeEach(() => {
  puts = [];
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(`${today}T18:00:00Z`));
  vi.stubGlobal("fetch", async (input: string, init?: RequestInit) => {
    const url = String(input).split("?")[0], parts = url.split("/");
    if (init?.method === "PUT") {
      const body = JSON.parse(String(init.body)), name = parts[parts.length - 2], id = decodeURIComponent(parts[parts.length - 1]);
      puts.push(body.data);
      const list = collections[name] ?? (collections[name] = []);
      const saved = rec(id, body.data, (list.find(r => r.id === id)?.version ?? 0) + 1);
      collections[name] = [saved, ...list.filter(r => r.id !== id)];
      return Response.json({ record: saved });
    }
    if (url.endsWith("/api/admin/expedientes")) return Response.json({ expedientes: dossiers });
    if (url.endsWith("/api/admin/entrevistas/config")) return Response.json({ administrador: false, asesorId: "a1" });
    return Response.json({ records: collections[parts[parts.length - 1]] ?? [], entrevistas: [], runs: [], ultimos: {}, contratos: [], documentos: [] });
  });
});
afterEach(() => { cleanup(); clearAdminCache(); resetTodayData(); vi.restoreAllMocks(); vi.useRealTimers(); vi.unstubAllGlobals(); });

test("una fila de «Tu día» se palomea sin salir de Hoy y «Deshacer» la regresa", async () => {
  seed(3);
  render(<AdminDashboard />);
  const late = within(await screen.findByRole("list", { name: "Pendientes vencidos" }));
  fireEvent.click(await late.findByRole("checkbox", { name: "Marcar como hecha: Llamar al cliente 2" }));
  await waitFor(() => expect(puts).toHaveLength(1));
  expect(puts[0]).toMatchObject({ id: "t2", estado: "completada" });
  expect(await screen.findByText("Completaste «Llamar al cliente 2».")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Deshacer" }));
  await waitFor(() => expect(puts).toHaveLength(2));
  expect(puts[1]).toMatchObject({ id: "t2", estado: "pendiente" });
});

test("«Ya lo hice» en «Lo siguiente» completa su tarea y ofrece deshacer", async () => {
  seed(2);
  render(<AdminDashboard />);
  const cover = within(await screen.findByRole("region", { name: "Lo siguiente" }));
  fireEvent.click(await cover.findByRole("button", { name: "Ya lo hice: Llamar al cliente 1" }));
  await waitFor(() => expect(puts).toHaveLength(1));
  expect(puts[0]).toMatchObject({ id: "t1", estado: "completada" });
  expect(await screen.findByRole("button", { name: "Deshacer" })).toBeTruthy();
});

test("con 15 pendientes: 4 con foto o cara, 10 filas en total y «Ver los 15 asuntos»", async () => {
  seed(15);
  const { container } = render(<AdminDashboard />);
  const late = await screen.findByRole("list", { name: "Pendientes vencidos" });
  await waitFor(() => expect(within(late).getAllByRole("article")).toHaveLength(9));
  // «Lo siguiente» lleva la foto grande; de las filas, solo las 3 primeras llevan foto o cara.
  expect(container.querySelectorAll("[class*='mediaCell']")).toHaveLength(3);
  // Hoy no crece: el resto se revisa en Asuntos, y el enlace cuenta asuntos (no pendientes).
  expect(screen.getByRole("link", { name: "Ver los 15 asuntos" }).getAttribute("href")).toBe("/admin/operaciones");
  expect(screen.queryByRole("link", { name: /personas por atender/ })).toBeNull();
  expect(screen.queryByRole("button", { name: /^Ver los/ })).toBeNull();
});

test("con prospectos fuera de la lista, el enlace a Asuntos cuenta asuntos y otro lleva a Personas", async () => {
  seed(12);
  // 12 asuntos con tarea vencida y 3 prospectos nuevos del sitio (aún en plazo): 15 pendientes, que no caben.
  collections.leads = [1, 2, 3].map(n => rec(`l${n}`, { id: `l${n}`, nombre: `Prospecto de ensayo ${n}`, telefono: "6640000000", origen: "sitio", estado: "nuevo", creadoEl: "2026-10-16T17:30:00Z", notas: [], asesorId: "a1" }));
  render(<AdminDashboard />);
  await screen.findByRole("list", { name: "Pendientes vencidos" });
  const asuntos = await screen.findByRole("link", { name: "Ver los 12 asuntos" });
  expect(asuntos.getAttribute("href")).toBe("/admin/operaciones");
  expect(screen.getByRole("link", { name: "Ver a las 3 personas por atender" }).getAttribute("href")).toBe("/admin/personas");
});

test("dos pendientes de la misma persona van en una fila que dice «2 pendientes»", async () => {
  seed(4, [2, 3]);
  render(<AdminDashboard />);
  const late = within(await screen.findByRole("list", { name: "Pendientes vencidos" }));
  const row = await late.findByRole("link", { name: /Llamar al cliente 2 .*2 pendientes/ });
  expect(row.textContent).toContain("2 pendientes");
  expect(late.queryByText("Llamar al cliente 3")).toBeNull();
  // Los números cuentan pendientes, no filas: 4 vencidos aunque se vean 3 (la portada y 2 filas).
  expect(screen.getByText("4 cosas vencidas")).toBeTruthy();
  expect(screen.getByRole("heading", { level: 3, name: "Vencido 4" })).toBeTruthy();
});

test("en Hoy el aviso de «Deshacer» dura 12 s, no 8", async () => {
  seed(3);
  const timer = vi.spyOn(window, "setTimeout");
  render(<AdminDashboard />);
  const late = within(await screen.findByRole("list", { name: "Pendientes vencidos" }));
  fireEvent.click(await late.findByRole("checkbox", { name: "Marcar como hecha: Llamar al cliente 2" }));
  await screen.findByRole("button", { name: "Deshacer" });
  const delays = timer.mock.calls.map(call => call[1]);
  expect(delays).toContain(12_000);
  expect(delays).not.toContain(8_000);
});

test("el clic que llega justo cuando el aviso se va no abre la fila de abajo", async () => {
  seed(3);
  render(<AdminDashboard />);
  const late = within(await screen.findByRole("list", { name: "Pendientes vencidos" }));
  fireEvent.click(await late.findByRole("checkbox", { name: "Marcar como hecha: Llamar al cliente 2" }));
  fireEvent.click(await screen.findByRole("button", { name: "Deshacer" }));
  await waitFor(() => expect(puts).toHaveLength(2));
  await waitFor(() => expect(screen.queryByText("Completaste «Llamar al cliente 2».")).toBeNull());
  const row = late.getByRole("link", { name: /Llamar al cliente 3/ });
  // fireEvent.click devuelve false cuando la página canceló la navegación.
  expect(fireEvent.click(row), "clic justo después de que se fue el aviso").toBe(false);
  vi.setSystemTime(Date.now() + 1_000);
  expect(fireEvent.click(row), "clic un segundo después").toBe(true);
});
