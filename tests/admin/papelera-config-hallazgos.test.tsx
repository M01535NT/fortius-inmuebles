const nav = vi.hoisted(() => ({ pathname: "/admin" }));
vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
import * as React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { AdminShell } from "@/components/admin/admin-shell";
import { PapeleraScreen } from "@/components/admin/papelera/papelera";
import { AdviserAccountLinks } from "@/components/admin/adviser-account-links";
import { TaskForm } from "@/components/admin/task-form";
import ConfiguracionPage from "@/app/admin/configuracion/page";
import HistoryPage from "@/app/admin/historial/page";
import { clearAdminCache, isLoggedIn, type Asesor } from "@/lib/admin/store";
import type { Task } from "@/lib/tasks";

const rec = (id: string, data: unknown) => ({ id, data, version: 1, createdAt: "2026-11-01T00:00:00.000Z", updatedAt: "2026-11-01T00:00:00.000Z" });
const ana: Asesor = { id: "ana", nombre: "Ana Inactiva de ensayo", cargo: "Asesora", iniciales: "AI", activo: false };
const beto: Asesor = { id: "beto", nombre: "Beto Activo de ensayo", cargo: "Asesor", iniciales: "BA", activo: true };

type Handler = (url: string, init?: RequestInit) => unknown;
let role: "admin" | "editor" = "admin";
let extra: Handler = () => undefined;
const calls: Array<{ url: string; method: string; body?: unknown }> = [];

beforeEach(() => {
  clearAdminCache();
  nav.pathname = "/admin";
  role = "admin";
  extra = () => undefined;
  calls.length = 0;
  vi.stubGlobal("fetch", vi.fn(async (input: string, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, method: init?.method ?? "GET", body: init?.body ? JSON.parse(String(init.body)) : undefined });
    if (url === "/api/auth/session") return Response.json({ user: { id: "u-yo", email: "ensayo@fortius.test", name: "Persona de ensayo", role } });
    const custom = extra(url, init);
    if (custom !== undefined) return Response.json(custom);
    return Response.json({ records: [], expedientes: [], entries: [], hasMore: false, preferencias: {}, asesorId: null });
  }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

/*
  BUG-C80: un asesor (editor) que pulsa «Ver eliminados» en Operaciones (board.tsx:183) llega a
  /admin/papelera y ve «Esta sección la administra el director». admin-shell.tsx:381 bloquea toda
  ruta de ADMIN_NAV para quien no es director, y ADMIN_NAV incluye Eliminados (guided-nav.tsx:42),
  aunque PapeleraScreen (papelera.tsx:120) está hecha para que el asesor restaure sus operaciones.
*/
test("el asesor puede abrir Eliminados para restaurar sus operaciones", async () => {
  role = "editor";
  nav.pathname = "/admin/papelera";
  render(<AdminShell><h1>Pantalla de eliminados</h1></AdminShell>);
  await waitFor(() => expect(screen.queryByText("Verificando acceso…")).toBeNull());
  await waitFor(() => expect(screen.queryByText("Cargando módulo…")).toBeNull());
  expect(screen.queryByText("Esta sección la administra el director"), "la papelera se bloquea al asesor").toBeNull();
  expect(screen.getByRole("heading", { name: "Pantalla de eliminados" })).toBeTruthy();
});

/*
  BUG-C81: en Eliminados todo inmueble borrado se llama «Inmueble eliminado». papelera.tsx:78 busca el
  nombre en db.propiedades, donde un registro borrado ya no está, y GET /api/admin/historial
  (historial/route.ts:25) no devuelve nada del snapshot. Con dos inmuebles borrados, el director no
  sabe cuál restaurar. (Igual en historial/page.tsx:105: «Registro eliminado».)
*/
test("Eliminados distingue por nombre dos inmuebles borrados", async () => {
  nav.pathname = "/admin/papelera";
  extra = url => url.startsWith("/api/admin/historial") ? {
    // Seguridad (48e02a8) devuelve el título de la foto del registro en cada entrada.
    entries: [
      { id: "h1", collection: "propiedades", record_id: "casa-norte", created_at: "2026-11-12T18:00:00.000Z", actor_id: "u-yo", titulo: "Casa Norte de ensayo" },
      { id: "h2", collection: "propiedades", record_id: "casa-sur", created_at: "2026-11-12T19:00:00.000Z", actor_id: "u-yo", titulo: "Casa Sur de ensayo" },
    ], hasMore: false,
  } : undefined;
  await isLoggedIn();
  render(<PapeleraScreen />);
  const lista = await screen.findByRole("list", { name: "Inmuebles, artículos, notas y citas" });
  const nombres = within(lista).getAllByRole("listitem").map(item => item.querySelector("strong")?.textContent);
  expect(new Set(nombres).size, `los dos se ven como ${JSON.stringify(nombres)}`).toBe(2);
});

/*
  BUG-C82: guardar Configuración fija el tope de IA aunque el director no lo tocó. ia-uso.tsx:53 llena
  el campo con el tope del servidor (IA_TOPE_MENSUAL_USD) o el de omisión, y configuracion/page.tsx:82
  guarda lo que haya en el campo. Cambiar solo el teléfono deja topeIaMensualUsd fijo en la base:
  el origen pasa a «Lo fijó el director aquí» y un cambio posterior de la variable del servidor ya no aplica.
*/
test("guardar otro dato de Configuración no fija el tope de IA del servidor", async () => {
  const settings = { nombreComercial: "Fortius de ensayo", telefono: "6640000000", whatsapp: "", email: "", horario: "", facebook: "", instagram: "", videoInstitucionalUrl: "" };
  extra = (url, init) => {
    if (url === "/api/admin/ia/uso") return { uso: { gastoUsd: 0, topeUsd: 35, origenTope: "servidor", lecturas: 0, desde: "2026-11-01", disponible: true } };
    if (url === "/api/admin/collections/config" && !init?.method) return { records: [rec("singleton", settings)] };
    if (url === "/api/admin/collections/config/singleton" && init?.method === "PUT") return { record: { ...rec("singleton", JSON.parse(String(init.body)).data), version: 2 } };
    return undefined;
  };
  await isLoggedIn();
  render(<ConfiguracionPage />);
  await waitFor(() => expect((screen.getByLabelText("Tope de gasto al mes, en dólares") as HTMLInputElement).value).toBe("35"));
  fireEvent.change(screen.getByLabelText("Teléfono"), { target: { value: "6641111111" } });
  fireEvent.submit(screen.getByRole("button", { name: "Guardar configuración" }).closest("form")!);
  await waitFor(() => expect(calls.some(c => c.method === "PUT")).toBe(true));
  const put = calls.find(c => c.method === "PUT")!.body as { data: Record<string, unknown> };
  expect(put.data.telefono).toBe("6641111111");
  expect(put.data.topeIaMensualUsd, "se guardó el tope del servidor como si lo hubiera fijado el director").toBeUndefined();
});

/*
  BUG-C83: en «Cuentas de asesores» una cuenta ligada a una ficha que después se desactivó aparece
  como «Sin vincular». adviser-account-links.tsx:52 solo pone opciones de asesores activos y el
  defaultValue (asesor_id) no existe entre ellas, así que el select cae en la primera opción. La
  cuenta sigue ligada en la base y el director ve otra cosa.
*/
test("una cuenta ligada a un asesor inactivo no se muestra como «Sin vincular»", async () => {
  extra = url => url === "/api/admin/asesor-cuentas" ? { cuentas: [{ user_id: "51000000-0000-4000-8000-000000000083", email: "ana@fortius.test", role: "editor", active: true, asesor_id: "ana" }] } : undefined;
  render(<AdviserAccountLinks isAdmin advisers={[ana, beto]} />);
  const select = await screen.findByRole("combobox", { name: "Asesor" }) as HTMLSelectElement;
  expect(select.selectedOptions[0]?.textContent, "el vínculo vigente con la ficha inactiva no se ve").not.toBe("Sin vincular");
});

/*
  BUG-C84: Equipo promete «Activo (asignable y visible en el sitio)» (asesores/page.tsx:150), pero la
  tarea nueva ofrece como responsable a un asesor inactivo: task-form.tsx:136 lista todos los asesores.
  (Igual property-form.tsx:404 y agenda/calendar.tsx:301.) lead-fields.tsx:132 sí filtra activos.
*/
test("una tarea nueva no ofrece como responsable a un asesor inactivo", async () => {
  extra = url => url === "/api/admin/collections/asesores" ? { records: [rec("ana", ana), rec("beto", beto)] } : undefined;
  render(<TaskForm onSave={async (task: Task) => task} />);
  const select = await screen.findByLabelText("Responsable") as HTMLSelectElement;
  await waitFor(() => expect(Array.from(select.options).some(o => o.textContent === beto.nombre)).toBe(true));
  expect(Array.from(select.options).map(o => o.textContent)).not.toContain(ana.nombre);
});

/*
  BUG-C85: en Historial los cambios del Blog salen como «Registro sin nombre» aunque la entrada exista.
  historial/page.tsx:66 (nameOf) no tiene caso para «posts» ni carga db.posts, aunque la sección
  «Blog» está en el filtro (línea 27).
*/
test("Historial nombra la entrada del blog que cambió", async () => {
  const post = { id: "post-1", slug: "guia-de-ensayo", titulo: "Guía de ensayo", resumen: "Resumen", contenido: "Contenido", estado: "borrador", actualizadoEl: "2026-11-12T12:00:00.000Z" };
  extra = url => url.startsWith("/api/admin/historial") ? { entries: [{ id: "h1", collection: "posts", record_id: "post-1", action: "UPDATE", actor_id: "u-yo", version: 2, changed_fields: ["titulo"], created_at: "2026-11-12T18:00:00.000Z", restored_at: null }], hasMore: false }
    : url === "/api/admin/collections/posts" ? { records: [rec("post-1", post)] } : undefined;
  await isLoggedIn();
  render(<HistoryPage />);
  const lista = await screen.findByRole("list", { name: "Movimientos" });
  await new Promise(resolve => setTimeout(resolve, 20));
  expect(within(lista).getByRole("heading").textContent).toBe("Guía de ensayo");
});
