import * as React from "react";
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import AdminDashboard from "@/app/admin/page";
import ReportesPage from "@/app/admin/reportes/page";
import OperacionesPage from "@/app/admin/operaciones/page";
import { OperationScreen } from "@/components/admin/operation/screen";
import { clearAdminCache } from "@/lib/admin/store";

vi.mock("next/navigation", () => ({ usePathname: () => "/admin/operaciones", useSearchParams: () => new URLSearchParams(), useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
vi.mock("@/lib/admin/store", async original => ({ ...await original<typeof import("@/lib/admin/store")>(), useSession: () => ({ id: "admin", email: "admin@example.test", role: "admin" }) }));
const baseDate = "2026-10-13";
function install(records: Record<string, unknown[]> = {}) {
  clearAdminCache();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(baseDate + "T18:00:00Z"));
  vi.stubGlobal("fetch", async (url: string) => {
    if (url.startsWith("/api/admin/expedientes")) return Response.json({ expedientes: [], nextOffset: null });
    if (url.startsWith("/api/admin/comercial")) return Response.json({ carteras: [] });
    const collection = url.split("/").pop() ?? "";
    return Response.json({ records: (records[collection] ?? []).map(data => ({ id: (data as { id?: string; slug?: string }).id ?? (data as {slug:string}).slug, data, version: 1, createdAt: baseDate, updatedAt: baseDate })) });
  });
}
afterEach(() => { cleanup(); clearAdminCache(); vi.useRealTimers(); vi.unstubAllGlobals(); window.history.replaceState(null, "", "/"); });

test("reports exclude demo inventory until the user explicitly includes it", async () => {
  install({ propiedades: [
    { slug: "demo", titulo: "Ejemplo", estado: "disponible", demo: true, galeria: [], zona: "Demo", precio: {modalidad:"consulta"}, operacion:"venta", tipo:"casa", ficha:{} },
    { slug: "real", titulo: "Real", estado: "disponible", galeria: [], zona: "Real", precio: {modalidad:"consulta"}, operacion:"venta", tipo:"casa", ficha:{} },
  ] });
  render(<ReportesPage/>);
  const toggle = await screen.findByRole("checkbox", {name:/Incluir inmuebles Demo/});
  const unassigned = () => screen.getByRole("rowheader", {name:"Sin asesor"}).closest("tr")!.querySelectorAll("td")[2].textContent;
  expect(unassigned()).toBe("1");
  fireEvent.click(toggle);
  expect(unassigned()).toBe("2");
});

test("due converted contact is visible on arrival and points to the client, once", async () => {
  const profile={proximoContacto:"2026-10-12"};
  install({ leads:[{id:"lead",nombre:"Contacto convertido",telefono:"6640000000",estado:"activo",clienteId:"client",perfil:profile,notas:[],creadoEl:baseDate,origen:"manual"}], clientes:[{id:"client",nombre:"Contacto convertido",leadId:"lead",tipo:"comprador",perfil:profile}] });
  render(<AdminDashboard/>);
  const waiting=await screen.findByRole("region",{name:/Esperan algo de ti/});
  const link=await within(waiting).findByRole("link",{name:"Continuar con Contacto convertido"});
  expect(link.getAttribute("href")).toBe("/admin/clientes/client");
  expect(within(waiting).getAllByRole("link",{name:/Contacto convertido/})).toHaveLength(1);
  expect(waiting.closest("details")).toBeNull();
});

test("reports opens the actual overdue client records and labels historical scope", async () => {
  install({ clientes:[{id:"client",nombre:"Cliente con pendiente",tipo:"comprador",perfil:{proximoContacto:"2026-10-10"}}] });
  render(<ReportesPage/>);
  await screen.findByRole("heading", {name:"Reportes comerciales"});
  fireEvent.click(await screen.findByRole("button", {name:/Contactos vencidos/}));
  expect(screen.getByRole("link",{name:/Cliente con pendiente/}).getAttribute("href")).toBe("/admin/clientes/client");
  expect(screen.getByRole("heading",{name:"Histórico del CRM"})).toBeTruthy();
});

test("every task due today or overdue stays on Hoy, oldest deadline first", async () => {
  install({tareas:Array.from({length:5},(_,index)=>({id:`t-${index}`,titulo:`Pendiente ${index}`,estado:"pendiente",prioridad:"media",categoria:"general",pasos:[],vence:index===4?"2026-10-10":baseDate}))});
  render(<AdminDashboard/>);
  const today=await screen.findByRole("region",{name:"Tareas de hoy"});
  await within(today).findByRole("link",{name:/Pendiente 0/});
  const links=within(today).getAllByRole("link",{name:/Pendiente/});
  expect(links).toHaveLength(5);
  expect(links[0].getAttribute("href")).toBe("/admin/tareas/t-4");
  expect(within(today).getByRole("link",{name:/Pendiente 3/}).getAttribute("href")).toBe("/admin/tareas/t-3");
  expect(within(today).getByText("0 de 5 hechas")).toBeTruthy();
});

test("an empty operations module offers creation without forcing the form open", async () => {
  install(); render(<OperacionesPage/>);
  await screen.findByText("Todavía no hay operaciones");
  expect(screen.getByRole("link",{name:"Nueva operación"}).getAttribute("href")).toBe("/admin/operaciones/nueva");
  expect(screen.queryByRole("button",{name:"Abrir operación"})).toBeNull();
  fireEvent.click(screen.getByRole("button", {name:"Alta directa, sin entrevista"}));
  expect(screen.getByRole("button",{name:"Abrir operación"})).toBeTruthy();
});

test("operation overview exposes missing context and next task without inventing progress", async () => {
  install();
  vi.stubGlobal("fetch",async(url:string)=>url.startsWith("/api/admin/expedientes?")||url==="/api/admin/expedientes"?Response.json({expedientes:[{id:"exp",folio:"EXP-1",cliente_id:"client",asesor_id:"advisor",operacion:"venta",propiedad_slug:null,etapa:"captacion",version:1}],nextOffset:null}):url.endsWith("/formatos")?Response.json({documentos:[]}):url.startsWith("/api/admin/entrevistas")?Response.json({entrevistas:[]}):Response.json({records:[]}));
  render(<OperationScreen id="exp"/>);
  expect(await screen.findByText(/Sin inmueble vinculado/)).toBeTruthy();
  const next=screen.getByRole("region",{name:"Próxima tarea"});
  expect(within(next).getByText(/no tiene una próxima tarea con fecha/)).toBeTruthy();
  expect(within(next).getByRole("button",{name:"Agendar"})).toBeTruthy();
  expect(screen.getAllByText(/^Etapa 1 de 10/).length).toBeGreaterThan(0);
});
