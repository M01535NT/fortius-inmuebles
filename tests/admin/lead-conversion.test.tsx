import * as React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { ContactsScreen } from "@/components/admin/contacts/contacts";
import LeadDetail from "@/app/admin/leads/[id]/page";
import ClientDetail from "@/app/admin/clientes/[id]/page";
import Dashboard from "@/app/admin/page";
import { clearAdminCache, db, convertirLead, type Lead, type Cliente } from "@/lib/admin/store";
const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn() }), useSearchParams: () => new URLSearchParams(), usePathname: () => "/admin/contactos" }));
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

test("COR-10: la ficha no convierte a mano; con registro de cliente y sin firma sigue en seguimiento", async () => {
  await detail("lead");
  // «Convertir en cliente» desapareció: se es cliente al firmar el contrato (RP-90); la acción es «Abrir operación».
  fireEvent.click(await screen.findByRole("button", { name: "Más opciones" }));
  expect(screen.queryByRole("menuitem", { name: /Convertir en cliente/ })).toBeNull();
  expect(screen.getByRole("link", { name: "Abrir operación" })).toBeTruthy();
  cleanup();
  clearAdminCache();
  currentLead = { ...original, clienteId: "c1", convertidoEl: "2026-10-05" }; currentClient = cliente;
  render(<ContactsScreen />);
  const filters = within(screen.getByRole("group", { name: "Mostrar personas" }));
  fireEvent.click(filters.getByRole("button", { name: /^En seguimiento/ }));
  const links = await within(await screen.findByRole("list", { name: "Contactos" })).findAllByRole("link", { name: /Persona capturada/ });
  expect(new Set(links.map(link => link.getAttribute("href")))).toEqual(new Set(["/admin/clientes/c1"]));
  fireEvent.click(filters.getByRole("button", { name: /^Clientes/ }));
  expect(screen.getByText("Nadie coincide con la búsqueda")).toBeTruthy();
});

test("preparar operación abre la entrevista sin convertir prematuramente",async()=>{
 await detail("lead");expect((await screen.findByRole("link",{name:"Abrir operación"})).getAttribute("href")).toBe("/admin/operaciones/nueva?leadId=l1&intencion=comprar");expect(posts).toEqual([]);expect(db.clientes.list()).toEqual([]);
});
test("la conversión explícita conserva el lead tras fallo y permite reintentar",async()=>{
 await db.leads.load();fail=true;await expect(convertirLead(db.leads.list()[0])).rejects.toThrow("Servicio temporalmente");expect(db.clientes.list()).toEqual([]);fail=false;await convertirLead(db.leads.list()[0]);expect(db.clientes.list()[0].id).toBe("c1");
});
test.each(["Nueva nota","Título"])("protege %s antes de preparar la entrevista",async(label)=>{
 await detail("lead");expect(await screen.findByRole("link",{name:"Abrir operación"})).toBeTruthy();if(label==="Título")fireEvent.click(screen.getByRole("button",{name:"Agendar"}));fireEvent.change(screen.getByLabelText(label,{exact:true}),{target:{value:"Captura pendiente"}});expect((screen.getByRole("button",{name:"Abrir operación"}) as HTMLButtonElement).disabled).toBe(true);expect(posts).toEqual([]);
});

test("la ficha del cliente muestra el perfil, asesor, historial y contacto heredados; editar conserva el origen", async () => {
  currentClient = cliente;
  await detail("client");
  expect(await screen.findByRole("heading", { name: original.nombre })).toBeTruthy();
  expect(screen.getByText("250,000 USD", { exact: true })).toBeTruthy();
  expect(screen.getByText("Ana Asesora", { exact: true })).toBeTruthy();
  expect(screen.getByText(original.notas[0].texto, { exact: true })).toBeTruthy();
  expect(screen.getByRole("link", { name: "Ver su historial como prospecto" }).getAttribute("href")).toBe("/admin/leads/l1");
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

test("Hoy deja de pedir seguimiento a un lead ya convertido", async () => {
  currentLead = { ...original, estado: "nuevo", clienteId: "c1", perfil: { ...original.perfil, proximoContacto: "2020-01-01" } };
  await db.leads.load();
  render(<Dashboard />);
  await screen.findByRole("region", { name: "Lo siguiente" });
  expect(screen.queryByRole("link", { name: new RegExp(original.nombre) })).toBeNull();
});

test.each(["Nueva nota", "Título"])("un prospecto convertido protege %s antes de abrir su operación", async (label) => {
  currentLead={...original,clienteId:"c1"};currentClient=cliente;
  await detail("lead");
  expect((await screen.findByRole("link",{name:"Abrir operación"})).getAttribute("href")).toContain("clienteId=c1");
  if(label==="Título")fireEvent.click(screen.getByRole("button",{name:"Agendar"}));
  fireEvent.change(screen.getByLabelText(label,{exact:true}),{target:{value:"Captura pendiente"}});
  const button=screen.getByRole("button",{name:"Abrir operación"}) as HTMLButtonElement;
  expect(button.disabled).toBe(true);fireEvent.click(button);
  expect(push).not.toHaveBeenCalled();expect(posts).toEqual([]);expect(writes).toEqual([]);
  expect((screen.getByLabelText(label,{exact:true}) as HTMLInputElement).value).toBe("Captura pendiente");
});

test("SIM-07: la ficha del prospecto muestra una sola acción principal, tres etapas y la fecha con palabras", async () => {
  await detail("lead");
  expect(await screen.findByRole("heading", { level: 1, name: original.nombre })).toBeTruthy();
  const next = within(screen.getByRole("region", { name: "Siguiente paso" }));
  expect(next.getByRole("link", { name: "Abrir operación" })).toBeTruthy();
  const etapa = screen.getByLabelText("Etapa") as HTMLSelectElement;
  expect(Array.from(etapa.options).map(option => option.text)).toEqual(["Nuevo", "En seguimiento", "Descartado"]);
  expect(etapa.value).toBe("seguimiento");
  // La nota y el registro de llegada son del mismo día.
  expect(within(screen.getByRole("list", { name: "Lo que ya pasó" })).getAllByText("4 oct 2026")).toHaveLength(2);
  expect(screen.queryByText(/2026-10-04/)).toBeNull();
  expect(screen.queryByText(/Seguimiento conectado|Agenda del lead/)).toBeNull();
});
