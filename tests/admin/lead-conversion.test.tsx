import * as React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import LeadsPage from "@/app/admin/leads/page";
import LeadDetail from "@/app/admin/leads/[id]/page";
import ClientDetail from "@/app/admin/clientes/[id]/page";
import Dashboard from "@/app/admin/page";
import { clearAdminCache, db, convertirLead, type Lead, type Cliente } from "@/lib/admin/store";
const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
const original: Lead = { id: "l1", nombre: "Persona capturada", telefono: "6641234567", email: "persona@example.invalid", origen: "manual", estado: "contactado", asesorId: "a1", creadoEl: "2026-10-04", notas: [{ id: "n1", texto: "Seguimiento antes de convertir", fecha: "2026-10-04" }], zona: "Otay", tipoPropiedad: "casa", mensaje: "Consulta inicial", perfil: { operacion: "comprar", presupuestoMax: 250000, moneda: "USD", requisitos: "Acceso sin escalones", futureField: "conservar" } };
const cliente: Cliente = { ...original, id: "c1", tipo: "comprador", notas: "", creadoEl: "2026-10-05", actualizadoEl: "2026-10-05", leadId: "l1", convertidoEl: "2026-10-05", leadOriginal: original };
const record = <T extends { id: string }>(data: T, version: number) => ({ id: data.id, data, version, createdAt: "2026-10-04", updatedAt: "2026-10-05" });
let currentLead: Lead;
let currentClient: Cliente | null;
let fail = false;
let posts: unknown[];
let writes: { data: Cliente; version: number }[];
beforeEach(() => {
  clearAdminCache(); push.mockReset(); currentLead = original; currentClient = null; fail = false; posts = []; writes = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    if (init?.method === "POST") {
      posts.push(JSON.parse(String(init.body)));
      if (fail) return Response.json({ error: "Servicio temporalmente no disponible" }, { status: 503 });
      currentLead = { ...original, clienteId: "c1", convertidoEl: "2026-10-05" }; currentClient = cliente;
      return Response.json({ lead: record(currentLead, 8), cliente: record(cliente, 1) });
    }
    if (init?.method === "PUT") {
      const body = JSON.parse(String(init.body)); writes.push(body); currentClient = body.data;
      return Response.json({ record: record(body.data, body.version + 1) });
    }
    const records = url.endsWith("/leads") ? [record(currentLead, 7)] : url.endsWith("/clientes") ? currentClient ? [record(currentClient, 1)] : [] : url.endsWith("/asesores") ? [record({ id: "a1", nombre: "Ana Asesora", activo: true }, 1)] : [];
    return Response.json({ records });
  }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); clearAdminCache(); });
async function detail(kind: "lead" | "client") {
  await act(async () => { render(<React.Suspense fallback={<p>Cargando</p>}>{kind === "lead" ? <LeadDetail params={Promise.resolve({ id: "l1" })} /> : <ClientDetail params={Promise.resolve({ id: "c1" })} />}</React.Suspense>); });
}

test("un botón en la lista convierte con la revisión y abre Clientes; el lead pasa a Convertidos", async () => {
  render(<LeadsPage />);
  fireEvent.click(screen.getByRole("button", { name: "Lista" }));
  const list = await screen.findByRole("list", { name: "Prospectos" });
  fireEvent.click(within(list).getByRole("button", { name: /Convertir en cliente/ }));
  await waitFor(() => expect(push).toHaveBeenCalledWith("/admin/clientes/c1"));
  expect(posts).toEqual([{ version: 7 }]);
  expect(db.clientes.list()[0].perfil).toEqual(original.perfil);
  expect(db.leads.version(db.leads.list()[0])).toBe(8);
  expect(screen.queryByRole("list", { name: "Prospectos" })).toBeNull();
  fireEvent.click(screen.getByText("Filtros de etapa"));
  fireEvent.click(screen.getByRole("button", { name: "Convertidos (1)" }));
  expect(within(screen.getByRole("list", { name: "Prospectos" })).getByRole("link", { name: "Ver cliente" }).getAttribute("href")).toBe("/admin/clientes/c1");
});

test("si falla la conversión conserva el lead y permite reintentar sin navegación ni cliente falso", async () => {
  fail = true;
  await detail("lead");
  fireEvent.click(await screen.findByRole("button", { name: "Convertir en cliente" }));
  expect((await screen.findByRole("alert")).textContent).toContain("Servicio temporalmente");
  expect(db.clientes.list()).toEqual([]);
  expect(db.leads.list()[0]).toEqual(original);
  expect(push).not.toHaveBeenCalled();
  fail = false;
  fireEvent.click(screen.getByRole("button", { name: "Convertir en cliente" }));
  await waitFor(() => expect(push).toHaveBeenCalledWith("/admin/clientes/c1"));
});

test("protege la ficha y notas sin guardar antes de convertir", async () => {
  await detail("lead");
  const button = await screen.findByRole("button", { name: "Convertir en cliente" });
  fireEvent.click(screen.getByRole("button", { name: "Editar ficha" }));
  fireEvent.change(screen.getByLabelText("Nombre", { exact: true }), { target: { value: "Nombre sin guardar" } });
  expect(button.hasAttribute("disabled")).toBe(true);
  expect(posts).toEqual([]);
  fireEvent.click(screen.getByRole("button", { name: "Cancelar edición" }));
  expect(button.hasAttribute("disabled")).toBe(false);
  fireEvent.change(screen.getByLabelText("Nueva nota"), { target: { value: "Nota sin guardar" } });
  expect(button.hasAttribute("disabled")).toBe(true);
  fireEvent.change(screen.getByLabelText("Nueva nota"), { target: { value: "" } });
  expect(button.hasAttribute("disabled")).toBe(false);
  fireEvent.change(screen.getByLabelText("Título", { exact: true }), { target: { value: "Cita sin guardar" } });
  fireEvent.change(screen.getByLabelText("Fecha", { exact: true }), { target: { value: "2026-10-05" } });
  expect(button.hasAttribute("disabled")).toBe(true);
  expect(posts).toEqual([]);
  fireEvent.change(screen.getByLabelText("Título", { exact: true }), { target: { value: "" } });
  fireEvent.change(screen.getByLabelText("Fecha", { exact: true }), { target: { value: "" } });
  expect(button.hasAttribute("disabled")).toBe(false);
  fireEvent.change(screen.getByLabelText("Título", { exact: true }), { target: { value: "Otra cita" } });
  fireEvent.click(screen.getByRole("button", { name: "Cancelar cita" }));
  expect(button.hasAttribute("disabled")).toBe(false);
});

test("la ficha del cliente muestra el perfil, asesor, historial y contacto heredados; editar conserva el origen", async () => {
  currentClient = cliente;
  await detail("client");
  expect(await screen.findByRole("heading", { name: original.nombre })).toBeTruthy();
  expect(screen.getByText("250,000 USD", { exact: true })).toBeTruthy();
  expect(screen.getByText("Ana Asesora", { exact: true })).toBeTruthy();
  expect(screen.getByText(original.notas[0].texto, { exact: true })).toBeTruthy();
  expect(screen.getByRole("link", { name: "Ver historial y agenda del lead" }).getAttribute("href")).toBe("/admin/leads/l1");
  fireEvent.click(screen.getByRole("button", { name: "Editar cliente" }));
  expect((screen.getByLabelText("Correo electrónico", { exact: true }) as HTMLInputElement).value).toBe(original.email);
  fireEvent.change(screen.getByLabelText("Presupuesto máximo", { exact: true }), { target: { value: "260000" } });
  fireEvent.change(screen.getByLabelText("Notas", { exact: true }), { target: { value: "Nueva nota de cliente" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar cliente" }));
  await waitFor(() => expect(writes).toHaveLength(1));
  expect(writes[0]).toMatchObject({ version: 1, data: { leadId: "l1", leadOriginal: original, notas: "Nueva nota de cliente", perfil: { presupuestoMax: 260000, futureField: "conservar" }, zona: "Otay", asesorId: "a1" } });
});

test("una lectura anterior a la conversión no revierte la confirmación del servidor", async () => {
  await db.leads.load();
  const saved = db.leads.list()[0];
  let finish!: (response: Response) => void;
  const previousFetch = fetch;
  vi.stubGlobal("fetch", vi.fn((url: string, init?: RequestInit) => (!init?.method || init.method === "GET") && url.endsWith("/leads") ? new Promise<Response>(resolve => { finish = resolve; }) : previousFetch(url, init)));
  const staleRead = db.leads.load();
  await convertirLead(saved);
  finish(Response.json({ records: [record(original, 7)] }));
  await staleRead;
  expect(db.leads.list()[0].clienteId).toBe("c1");
  expect(db.leads.version(db.leads.list()[0])).toBe(8);
});

test("el panel deja de contar y ofrecer como nuevo un lead convertido", async () => {
  currentLead = { ...original, estado: "nuevo", clienteId: "c1" };
  await db.leads.load();
  render(<Dashboard />);
  expect(screen.getByRole("link", { name: /Prospectos nuevos/ }).textContent).toContain("00");
  expect(screen.queryByRole("link", { name: new RegExp(original.nombre) })).toBeNull();
});
