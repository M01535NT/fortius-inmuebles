import * as React from "react";
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import AdminDashboard from "@/app/admin/page";
import ReportesPage from "@/app/admin/reportes/page";
import ExpedientesPage from "@/app/admin/operaciones/page";
import { clearAdminCache } from "@/lib/admin/store";

vi.mock("@/lib/admin/store", async original => ({ ...await original<typeof import("@/lib/admin/store")>(), useSession: () => ({ id: "admin", email: "admin@example.test", role: "admin" }) }));
const baseDate = "2026-10-13";
function install(records: Record<string, unknown[]> = {}) {
  clearAdminCache();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(baseDate + "T18:00:00Z"));
  vi.stubGlobal("fetch", async (url: string) => {
    if (url.startsWith("/api/admin/expedientes")) return Response.json({ expedientes: [] });
    if (url.startsWith("/api/admin/comercial")) return Response.json({ carteras: [] });
    const collection = url.split("/").pop() ?? "";
    return Response.json({ records: (records[collection] ?? []).map(data => ({ id: (data as { id?: string; slug?: string }).id ?? (data as {slug:string}).slug, data, version: 1, createdAt: baseDate, updatedAt: baseDate })) });
  });
}
afterEach(() => { cleanup(); clearAdminCache(); vi.useRealTimers(); vi.unstubAllGlobals(); window.history.replaceState(null, "", "/"); });

test("dashboard excludes demo inventory until the user explicitly includes it", async () => {
  install({ propiedades: [
    { slug: "demo", titulo: "Ejemplo", estado: "disponible", demo: true, galeria: [], zona: "Demo", precio: {modalidad:"consulta"}, operacion:"venta", tipo:"casa", ficha:{} },
    { slug: "real", titulo: "Real", estado: "disponible", galeria: [], zona: "Real", precio: {modalidad:"consulta"}, operacion:"venta", tipo:"casa", ficha:{} },
  ] });
  render(<AdminDashboard/>);
  const toggle = await screen.findByRole("checkbox", {name:/Incluir inmuebles Demo/});
  expect(screen.getByRole("link", { name: /Inmuebles disponibles/ }).textContent).toContain("01");
  fireEvent.click(toggle);
  expect(screen.getByRole("link", { name: /Inmuebles disponibles/ }).textContent).toContain("02");
});

test("due converted contact is visible on arrival and points to the client, once", async () => {
  const profile={proximoContacto:"2026-10-12"};
  install({ leads:[{id:"lead",nombre:"Contacto convertido",telefono:"6640000000",estado:"activo",clienteId:"client",perfil:profile,notas:[],creadoEl:baseDate,origen:"manual"}], clientes:[{id:"client",nombre:"Contacto convertido",leadId:"lead",tipo:"comprador",perfil:profile}] });
  render(<AdminDashboard/>);
  const attention=await screen.findByRole("region",{name:"Prioridades de hoy"});
  const link=await within(attention).findByRole("link",{name:/Contacto convertido/});
  expect(link.getAttribute("href")).toBe("/admin/clientes/client");
  expect(within(attention).getAllByRole("link",{name:/Contacto convertido/})).toHaveLength(1);
  expect(attention.closest("details")).toBeNull();
});

test("reports opens the actual overdue client records and labels historical scope", async () => {
  install({ clientes:[{id:"client",nombre:"Cliente con pendiente",tipo:"comprador",perfil:{proximoContacto:"2026-10-10"}}] });
  render(<ReportesPage/>);
  await screen.findByRole("heading", {name:"Reportes comerciales"});
  fireEvent.click(await screen.findByRole("button", {name:/Contactos vencidos/}));
  expect(screen.getByRole("link",{name:/Cliente con pendiente/}).getAttribute("href")).toBe("/admin/clientes/client");
  expect(screen.getByRole("heading",{name:"Histórico del CRM"})).toBeTruthy();
});

test("all current task priorities remain reachable and oldest deadlines appear first", async () => {
  install({tareas:Array.from({length:5},(_,index)=>({id:`t-${index}`,titulo:`Pendiente ${index}`,estado:"pendiente",prioridad:"media",categoria:"general",pasos:[],vence:index===4?"2026-10-10":baseDate}))});
  render(<AdminDashboard/>);
  const attention=await screen.findByRole("region",{name:"Prioridades de hoy"});
  await within(attention).findByRole("link",{name:/Pendiente 0/});
  const links=within(attention).getAllByRole("link",{name:/Pendiente/});
  expect(links[0].getAttribute("href")).toBe("/admin/tareas/t-4");
  fireEvent.click(within(attention).getByText("Ver 1 tarea más"));
  expect(within(attention).getByRole("link",{name:/Pendiente 3/}).getAttribute("href")).toBe("/admin/tareas/t-3");
});

test("an empty operations module offers creation without forcing the form open", async () => {
  install(); render(<ExpedientesPage/>);
  await screen.findByText("Aún no hay expedientes activos visibles para tu cuenta.");
  expect(screen.queryByRole("button",{name:"Crear expediente"})).toBeNull();
  expect(screen.getByRole("link",{name:"Nueva operación"}).getAttribute("href")).toBe("/admin/operaciones/nueva");
  fireEvent.click(screen.getByRole("button", {name:"Alta directa"}));
  expect(screen.getByRole("button",{name:"Crear expediente"})).toBeTruthy();
});

test("operation overview exposes missing context and next task without inventing progress", async () => {
  install();
  vi.stubGlobal("fetch",async(url:string)=>url==="/api/admin/expedientes"?Response.json({expedientes:[{id:"exp",folio:"EXP-1",cliente_id:"client",asesor_id:"advisor",propiedad_slug:null,etapa:"captacion",version:1}]}):url.endsWith("/formatos")?Response.json({documentos:[]}):Response.json({records:[]}));
  render(<ExpedientesPage/>);
  fireEvent.click(await screen.findByRole("button",{name:/EXP-1/}));
  const brief=await screen.findByRole("region",{name:"Resumen de operación"});
  expect(within(brief).getByText("Sin inmueble vinculado")).toBeTruthy();
  expect(within(brief).getByText("Sin próxima tarea registrada")).toBeTruthy();
  expect(within(brief).getByRole("link",{name:"Crear próxima tarea"}).getAttribute("href")).toContain("expediente=exp");
});
