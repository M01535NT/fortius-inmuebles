import * as React from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";

const nav = vi.hoisted(() => ({ path: "/admin/operaciones", search: new URLSearchParams(), listeners: new Set<() => void>(), push: vi.fn() }));
vi.mock("next/navigation", async () => {
  const react = await import("react");
  const subscribe = (cb: () => void) => { nav.listeners.add(cb); return () => nav.listeners.delete(cb); };
  const replace = (url: string) => { const u = new URL(url, "http://localhost"); nav.path = u.pathname; nav.search = u.searchParams; nav.listeners.forEach(cb => cb()); };
  return { usePathname: () => nav.path, useSearchParams: () => react.useSyncExternalStore(subscribe, () => nav.search), useRouter: () => ({ push: nav.push, replace }), useParams: () => ({}) };
});
vi.mock("@/components/admin/workspace/confirm", () => ({ confirmAction: vi.fn().mockResolvedValue(true) }));
vi.mock("@/lib/admin/store", async original => ({ ...await original<typeof import("@/lib/admin/store")>(), useSession: () => ({ id: "u1", email: "mariana@example.test", role: "admin", name: "Mariana Ruiz" }) }));
import { confirmAction } from "@/components/admin/workspace/confirm";
import { clearAdminCache } from "@/lib/admin/store";
import { OperationScreen } from "@/components/admin/operation/screen";
import { OperationsBoard } from "@/components/admin/operation/board";

const ID = "51000000-0000-4000-8000-000000000001", ID2 = "51000000-0000-4000-8000-000000000002";
const reviewed = (extra: Record<string, unknown> = {}) => ({ estado: "revisado", soporte: "Revisado con soporte", evidencia: { tipo: "externa", referencia: "Escritura 4521, Notaría 9", fecha: "2026-10-14", responsable: "Jorge Salcedo", resultado: "Sin observaciones" }, ...extra });
const accepted = { resolucion: { tipo: "aceptada", fecha: "2026-10-09", motivo: "Encargo aceptado", siguienteAccion: "Firmar", fechaSiguiente: "2026-10-12" } };
const flow = (requisitos: Record<string, unknown> = {}, extra: Record<string, unknown> = {}) => ({ version: 1, ruta: "captacion", estado: "activa", motivo: "", requisitos, ...extra });
type Op = Record<string, unknown> & { id: string; version: number };
let server: { ops: Op[]; deleted: Op[]; docs: Record<string, unknown>[]; emissions: Record<string, Record<string, unknown>[]>; tasks: Record<string, unknown>[]; activity: Record<string, unknown>[]; runs: Record<string, Record<string, unknown>[]>; puts: Array<{ url: string; body: Record<string, unknown> }>; methods: string[]; fail?: (url: string, init?: RequestInit) => Response | Promise<Response> | undefined };
const base = (over: Partial<Op> = {}): Op => ({ id: ID, folio: "EXP-2026-041", version: 3, operacion: "venta", etapa: "captacion", cliente_id: "c1", asesor_id: "a1", propiedad_slug: "casa", flujo: flow(), ...over });
const collections: Record<string, () => Record<string, unknown>[]> = {
  clientes: () => [{ id: "c1", nombre: "Familia Castañeda Ortiz", tipo: "propietario", telefono: "6642184471", asesorId: "a1" }, { id: "c2", nombre: "Ángel Martínez", tipo: "comprador", asesorId: "a2" }],
  propiedades: () => [{ slug: "casa", codigo: "F-1", titulo: "Casa en Playas", estado: "disponible", galeria: [], precio: { modalidad: "consulta" }, asesorId: "a1" }],
  asesores: () => [{ id: "a1", nombre: "Mariana Ruiz", activo: true }, { id: "a2", nombre: "Jorge Salcedo", activo: true }],
  tareas: () => server.tasks, eventos: () => [], leads: () => [],
};
function respond(url: string, init?: RequestInit): Response | Promise<Response> {
  const failed = server.fail?.(url, init); if (failed) return failed;
  const method = init?.method ?? "GET"; if (method !== "GET") server.methods.push(method);
  const body = init?.body && typeof init.body === "string" ? JSON.parse(init.body) : undefined;
  const path = url.split("?")[0];
  if (path === "/api/admin/expedientes" && method === "GET") return Response.json(url.includes("estado=eliminados") ? { expedientes: server.deleted } : { expedientes: server.ops, nextOffset: null });
  if (path === "/api/admin/expedientes" && method === "POST") { const created = { ...base({ id: ID2, folio: "EXP-2026-099", version: 1 }), ...body }; return Response.json({ expediente: created }); }
  const opMatch = path.match(/^\/api\/admin\/expedientes\/([^/]+)(\/.*)?$/);
  if (opMatch) {
    const [, id, rest = ""] = opMatch;
    if (rest === "/operacion") { server.puts.push({ url, body }); const index = server.ops.findIndex(o => o.id === id); const saved = { ...server.ops[index], etapa: body.etapa, flujo: body.flujo, propiedad_slug: body.propiedadSlug, fecha_objetivo: body.fechaObjetivo, version: server.ops[index].version + 1 }; server.ops[index] = saved; return Response.json({ expediente: saved }); }
    if (rest === "/formatos" && method === "POST") { const created = { id: `d${body.formatoId}`, expediente_id: id, formato_id: body.formatoId, data: { ...body.data, entrevistado: "Familia Castañeda Ortiz" }, version: 1, updated_at: "2026-10-16T18:00:00Z" }; server.docs.unshift(created); return Response.json({ documento: created }); }
    if (rest === "/formatos") return Response.json({ documentos: server.docs });
    if (rest === "/actividad") { if (method === "POST") { const item = { id: `h${server.activity.length + 1}`, tipo: "nota", descripcion: body.descripcion, created_by: "a1", created_at: "2026-10-16T18:00:00Z" }; server.activity.unshift(item); return Response.json({ actividad: item }); } return Response.json({ actividad: server.activity }); }
    if (method === "DELETE" || method === "PATCH") {
      const source = method === "DELETE" ? server.ops : server.deleted, target = method === "DELETE" ? server.deleted : server.ops;
      const index = source.findIndex(o => o.id === id); const moved = { ...source[index], version: source[index].version + 1, deleted_at: method === "DELETE" ? "2026-10-16T18:00:00Z" : null };
      source.splice(index, 1); target.push(moved); return Response.json({ expediente: moved });
    }
  }
  if (path === "/api/admin/entrevistas") return Response.json({ entrevistas: [] });
  if (path === "/api/admin/mi-asesor") return Response.json({ asesorId: "a1" });
  if (path === "/api/admin/apps/runs") return Response.json({ runs: server.runs[new URL(url, "http://x").searchParams.get("slug") ?? ""] ?? [], nextOffset: null });
  const doc = path.match(/^\/api\/admin\/formatos\/([^/]+)$/);
  if (doc) { const found = server.docs.find(d => d.id === doc[1])!; if (method === "PUT") { const saved = { ...found, data: body.data, version: Number(found.version) + 1 }; return Response.json({ documento: saved }); } return Response.json({ documento: found, emisiones: server.emissions[doc[1]] ?? [] }); }
  const col = path.match(/^\/api\/admin\/collections\/([^/]+)(?:\/(.+))?$/);
  if (col) { if (method === "PUT") { server.puts.push({ url, body }); if (col[1] === "tareas") server.tasks.push(body.data); return Response.json({ record: { id: decodeURIComponent(col[2]), data: body.data, version: 1 } }); } return Response.json({ records: (collections[col[1]]?.() ?? []).map(data => ({ id: (data.id ?? data.slug) as string, data, version: 1 })) }); }
  return Response.json({});
}
beforeEach(() => {
  clearAdminCache(); vi.mocked(confirmAction).mockReset().mockResolvedValue(true); nav.push.mockReset();
  nav.path = "/admin/operaciones"; nav.search = new URLSearchParams();
  vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date("2026-10-16T18:00:00Z"));
  server = { ops: [base()], deleted: [], docs: [], emissions: {}, tasks: [], activity: [], runs: {}, puts: [], methods: [] };
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => respond(url, init)));
});
afterEach(() => { cleanup(); clearAdminCache(); vi.useRealTimers(); vi.unstubAllGlobals(); });
/** Entrevista inicial (02) terminada: la operación está en «Entrevista inicial» y no en «Prospecto». */
function interviewDone() {
  server.docs = [{ id: "d02", expediente_id: ID, formato_id: "02", data: {}, version: 2, updated_at: "2026-10-15T18:00:00Z" }];
  server.emissions = { d02: [{ id: "e02", draft_version: 2, created_at: "2026-10-15T18:00:00Z" }] };
}
/** Entrevista, levantamiento y checklist completos: la operación puede pasar a verificación. */
function intakeDone() {
  interviewDone();
  server.docs.push({ id: "d04", expediente_id: ID, formato_id: "04B", data: {}, version: 3, updated_at: "2026-10-15T19:00:00Z" });
  server.emissions.d04 = [{ id: "e04", draft_version: 3, created_at: "2026-10-15T19:00:00Z" }];
  server.tasks.push({ id: `checklist-${ID}`, titulo: "Reunir los documentos del propietario", estado: "completada", prioridad: "normal", categoria: "documentacion", pasos: [{ id: "D01", texto: "D01 · Escritura", hecho: true }], expedienteId: ID, asesorId: "a1" });
}
async function openOperation(tab?: string) {
  nav.path = `/admin/operaciones/${ID}`; nav.search = new URLSearchParams(tab ? { tab } : {});
  render(<OperationScreen id={ID} />);
  await screen.findByRole("heading", { level: 1, name: "Familia Castañeda Ortiz" });
}
const lastFlow = () => server.puts.filter(p => p.url.endsWith("/operacion")).at(-1)!.body;

it("muestra la etapa y sus requisitos, y «Lo tengo» se guarda con la versión de la operación", async () => {
  interviewDone();
  await openOperation();
  expect(await screen.findByText("Lo que sigue · Etapa 2 de 9")).toBeTruthy();
  expect(screen.getByRole("heading", { level: 2, name: "Entrevista inicial" })).toBeTruthy();
  const group = screen.getByRole("radiogroup", { name: "Estado de Entrevista con el propietario" });
  expect(within(group).queryByRole("radio", { name: /No aplica/ })).toBeNull();
  fireEvent.click(within(group).getByRole("radio", { name: /Lo tengo/ }));
  await screen.findByText("Guardado");
  expect(lastFlow()).toMatchObject({ version: 3, etapa: "captacion", flujo: { requisitos: { entrevista: { estado: "recibido" } } } });
  expect(within(group).getByRole("radio", { name: /Lo tengo/ }).getAttribute("aria-checked")).toBe("true");
});

it("el prospecto se ve en su etapa y «Iniciar entrevista inicial» abre el 02 por secciones", async () => {
  await openOperation();
  expect(await screen.findByText("Lo que sigue · Etapa 1 de 9")).toBeTruthy();
  expect(screen.getByRole("heading", { level: 2, name: "Prospecto" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: /Pasar a/ })).toBeNull();
  expect(screen.getByText("Al completarlo se abre «Entrevista inicial» sola.")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Iniciar entrevista inicial" }));
  const capture = await screen.findByRole("dialog", { name: "Entrevista inicial" });
  expect(server.methods).toContain("POST");
  expect(within(capture).getByRole("heading", { level: 3, name: "Datos de la entrevista" })).toBeTruthy();
  expect(within(capture).getByRole("button", { name: /Descargar Word/ })).toBeTruthy();
  expect(within(capture).getByRole("button", { name: /Siguiente sección/ })).toBeTruthy();
  fireEvent.click(within(capture).getByRole("button", { name: "Cerrar" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(await screen.findByText("Lo que sigue · Etapa 2 de 9")).toBeTruthy();
  expect(screen.getByRole("button", { name: /Continuar entrevista/ })).toBeTruthy();
  expect(screen.getByText(/Te falta:/).parentElement?.textContent).toContain("Terminar la entrevista inicial (02)");
});

it("con la entrevista terminada se inicia el levantamiento según el tipo de inmueble", async () => {
  interviewDone();
  server.docs[0].data = { tipoInmueble: "departamento" };
  await openOperation();
  expect(await screen.findByText("Lo que sigue · Etapa 2 de 9")).toBeTruthy();
  const type = screen.getByLabelText("Tipo de levantamiento") as HTMLSelectElement;
  expect(type.value).toBe("04C");
  fireEvent.change(type, { target: { value: "04B" } });
  fireEvent.click(screen.getByRole("button", { name: /Iniciar levantamiento/ }));
  const capture = await screen.findByRole("dialog", { name: "Levantamiento de casa" });
  expect(within(capture).getByRole("button", { name: /Fotografías y croquis/ })).toBeTruthy();
  fireEvent.click(within(capture).getByRole("button", { name: "Cerrar" }));
  expect(await screen.findByText("Lo que sigue · Etapa 3 de 9")).toBeTruthy();
  expect(screen.getByRole("button", { name: /Continuar levantamiento/ })).toBeTruthy();
});

it("el checklist de documentos se arma con la entrevista y se marca al recibir cada documento", async () => {
  interviewDone();
  server.docs[0].data = { estadoCivilActual: "casado", gravamen: "infonavit", tipoInmueble: "casa" };
  server.docs.push({ id: "d04", expediente_id: ID, formato_id: "04B", data: {}, version: 3, updated_at: "2026-10-15T19:00:00Z" });
  server.emissions.d04 = [{ id: "e04", draft_version: 3, created_at: "2026-10-15T19:00:00Z" }];
  await openOperation();
  fireEvent.click(await screen.findByRole("button", { name: /Iniciar checklist/ }));
  await waitFor(() => expect(server.tasks).toHaveLength(1));
  const created = server.tasks[0] as { id: string; pasos: Array<{ id: string; hecho: boolean }> };
  expect(created.id).toBe(`checklist-${ID}`);
  expect(created.pasos.map(p => p.id)).toEqual(expect.arrayContaining(["D01", "D09", "D12", "D17"]));
  expect(created.pasos.map(p => p.id)).not.toContain("D19");
  expect(await screen.findByText("Lo que sigue · Etapa 4 de 9")).toBeTruthy();
  expect(screen.getByText(`0 de ${created.pasos.length} recibidos`)).toBeTruthy();
  fireEvent.click(screen.getByRole("checkbox", { name: /D01 · Escritura/ }));
  await waitFor(() => expect((server.tasks.at(-1) as { pasos: Array<{ id: string; hecho: boolean }> }).pasos.find(p => p.id === "D01")?.hecho).toBe(true));
  expect(screen.getByText(/Te falta:/).parentElement?.textContent).toContain("Recibir los documentos del checklist");
});

it("un fallo al guardar se informa en palabras sencillas y no anuncia ningún avance", async () => {
  server.fail = (url, init) => init?.method === "PUT" && url.endsWith("/operacion") ? Response.json({ error: "Servicio no disponible" }, { status: 503 }) : undefined;
  interviewDone();
  await openOperation();
  await screen.findByText("Lo que sigue · Etapa 2 de 9");
  fireEvent.click(within(screen.getByRole("radiogroup", { name: /Entrevista/ })).getByRole("radio", { name: /Lo tengo/ }));
  expect((await screen.findByRole("alert")).textContent).toBe("No se pudo guardar: Servicio no disponible");
  expect(screen.queryByText(/pasó a/)).toBeNull();
  expect(within(screen.getByRole("radiogroup", { name: /Entrevista/ })).getByRole("radio", { name: /Pendiente/ }).getAttribute("aria-checked")).toBe("true");
});

it("Marcar como revisado pide qué se encontró y guarda el respaldo, quién y cuándo", async () => {
  interviewDone();
  await openOperation();
  await screen.findByText("Lo que sigue · Etapa 2 de 9");
  fireEvent.click(within(screen.getByRole("radiogroup", { name: /Entrevista/ })).getByRole("radio", { name: /Revisado/ }));
  const sheet = await screen.findByRole("dialog", { name: "Entrevista con el propietario" });
  fireEvent.click(within(sheet).getByRole("radio", { name: /Documento fuera del sistema/ }));
  fireEvent.click(within(sheet).getByRole("button", { name: "Guardar como revisado" }));
  expect(within(sheet).getByRole("alert").textContent).toBe("Escribe qué encontraste.");
  fireEvent.change(within(sheet).getByLabelText("Qué encontraste"), { target: { value: "Quiere vender en seis meses" } });
  fireEvent.change(within(sheet).getByLabelText("Folio o dónde está"), { target: { value: "Carpeta física 12, oficina Tijuana" } });
  expect((within(sheet).getByLabelText("Quién lo revisó") as HTMLInputElement).value).toBe("Mariana Ruiz");
  fireEvent.click(within(sheet).getByRole("button", { name: "Guardar como revisado" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(lastFlow()).toMatchObject({ flujo: { requisitos: { entrevista: { estado: "revisado", soporte: "Quiere vender en seis meses", evidencia: { tipo: "externa", referencia: "Carpeta física 12, oficina Tijuana", fecha: "2026-10-16", responsable: "Mariana Ruiz", resultado: "Quiere vender en seis meses" } } } } });
  expect(screen.getByText("Quiere vender en seis meses · Revisó Mariana Ruiz el 16 oct")).toBeTruthy();
});

it("Hay un problema guarda el título y la explicación, y se resuelve dejando constancia", async () => {
  interviewDone();
  await openOperation();
  await screen.findByText("Lo que sigue · Etapa 2 de 9");
  fireEvent.click(within(screen.getByRole("radiogroup", { name: /Entrevista/ })).getByRole("radio", { name: /Hay un problema/ }));
  const sheet = await screen.findByRole("dialog");
  fireEvent.change(within(sheet).getByLabelText("Cuál es el problema"), { target: { value: "El propietario no tiene la escritura" } });
  fireEvent.change(within(sheet).getByLabelText("Qué pasó y cómo se puede resolver"), { target: { value: "La tiene su hermano en Ensenada." } });
  fireEvent.click(within(sheet).getByRole("button", { name: "Guardar" }));
  expect(await screen.findByText("El propietario no tiene la escritura")).toBeTruthy();
  expect(lastFlow()).toMatchObject({ flujo: { requisitos: { entrevista: { estado: "observado", soporte: "El propietario no tiene la escritura\nLa tiene su hermano en Ensenada." } } } });
  fireEvent.click(screen.getByRole("button", { name: "Ya se resolvió" }));
  await waitFor(() => expect(lastFlow()).toMatchObject({ flujo: { requisitos: { entrevista: { estado: "recibido", soporte: "Resuelto el 16 oct: El propietario no tiene la escritura" } } } }));
});

it("«Pasar a» se habilita solo con todo listo y registra el avance", async () => {
  server.ops = [base({ flujo: flow({ entrevista: reviewed() }) })];
  intakeDone();
  await openOperation();
  const advance = await screen.findByRole("button", { name: /Pasar a: Verificación y precio/ });
  expect((advance as HTMLButtonElement).disabled).toBe(true);
  expect(screen.getByRole("button", { name: "Agendar la próxima tarea" })).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Qué sigue"), { target: { value: "Pedir la escritura" } });
  fireEvent.change(screen.getByLabelText("Fecha"), { target: { value: "2026-10-20" } });
  fireEvent.click(screen.getByRole("button", { name: "Agendar" }));
  await waitFor(() => expect(server.tasks).toHaveLength(2));
  expect(server.tasks[1]).toMatchObject({ titulo: "Pedir la escritura", vence: "2026-10-20", expedienteId: ID, asesorId: "a1", estado: "pendiente" });
  await waitFor(() => expect((screen.getByRole("button", { name: /Pasar a: Verificación y precio/ }) as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(screen.getByRole("button", { name: /Pasar a: Verificación y precio/ }));
  expect(await screen.findByText("Listo: la operación pasó a «Verificación y precio».")).toBeTruthy();
  expect(lastFlow()).toMatchObject({ etapa: "documentacion", version: 3 });
  expect(screen.getByText("Lo que sigue · Etapa 5 de 9")).toBeTruthy();
});

it("en Verificación el contrato espera; durante la publicación avisa el informe mensual vencido", async () => {
  server.ops = [base({ etapa: "comercializacion", flujo: flow({}, accepted) })];
  server.runs["informe-propietario"] = [{ id: "r1", title: "Informe", updatedAt: "2026-09-01T12:00:00Z", result: { title: "ok", summary: [] } }];
  await openOperation();
  expect(await screen.findByText("Vencido desde el 1 oct. El último se preparó el 1 sep.")).toBeTruthy();
  expect(screen.getByRole("region", { name: "Visitas y ofertas del inmueble" })).toBeTruthy();
});

it("Ajustes ofrece solo la contraparte de la ruta opuesta y nombra su papel", async () => {
  server.ops = [
    base({ operacion: "renta", flujo: flow({}, { ruta: "arrendador" }) }),
    base({ id: ID2, folio: "EXP-RENTA", operacion: "renta", cliente_id: "c2", flujo: flow({}, { ruta: "arrendatario" }) }),
    base({ id: "51000000-0000-4000-8000-000000000003", folio: "EXP-OTRO", operacion: "renta", cliente_id: "c2", flujo: flow({}, { ruta: "arrendador" }) }),
  ];
  await openOperation("ajustes");
  const select = screen.getByLabelText("Operación de la contraparte");
  expect(within(select).getAllByRole("option").map(o => o.textContent)).toEqual(["Ninguna del panel", "EXP-RENTA · Arrendatario"]);
  expect(screen.getByRole("link", { name: "Programar una cita" }).getAttribute("href")).toBe(`/admin/agenda?expediente=${ID}`);
});

it("eliminar pide confirmación, se puede restaurar y no procede con cambios sin guardar", async () => {
  await openOperation("ajustes");
  vi.mocked(confirmAction).mockResolvedValueOnce(false);
  fireEvent.click(screen.getByRole("button", { name: "Eliminar operación" }));
  await waitFor(() => expect(confirmAction).toHaveBeenCalledWith(expect.stringContaining("Puedes restaurarla")));
  expect(server.methods).toEqual([]);
  fireEvent.change(screen.getByLabelText("Fecha objetivo"), { target: { value: "2026-12-01" } });
  expect((screen.getByRole("button", { name: "Eliminar operación" }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Descartar cambios" }));
  fireEvent.click(screen.getByRole("button", { name: "Eliminar operación" }));
  expect(await screen.findByText("Esta operación está eliminada")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Restaurar operación" }));
  expect(await screen.findByText("Operación restaurada.")).toBeTruthy();
  expect(server.methods).toEqual(["DELETE", "PATCH"]);
});

it("una nota sin guardar protege la salida por un enlace y el cambio de pestaña", async () => {
  await openOperation("historial");
  const note = await screen.findByLabelText("Nueva nota");
  fireEvent.change(note, { target: { value: "Comprobar antecedente original" } });
  vi.mocked(confirmAction).mockResolvedValueOnce(false);
  fireEvent.click(screen.getByRole("link", { name: "Operaciones" }));
  await waitFor(() => expect(confirmAction).toHaveBeenCalledWith(expect.stringContaining("Descartar los cambios y salir")));
  vi.mocked(confirmAction).mockResolvedValueOnce(false);
  fireEvent.click(screen.getByRole("tab", { name: "Lo que sigue" }));
  await waitFor(() => expect(confirmAction).toHaveBeenCalledWith(expect.stringContaining("cambiar de pestaña")));
  expect((screen.getByLabelText("Nueva nota") as HTMLTextAreaElement).value).toBe("Comprobar antecedente original");
  fireEvent.click(screen.getByRole("button", { name: "Guardar nota" }));
  expect(await screen.findByText("Comprobar antecedente original", { selector: "p" })).toBeTruthy();
});

const docA = { id: "doc-a", expediente_id: ID, formato_id: "18", data: { pagador: "Cliente A" }, version: 1, updated_at: "2026-10-04" };
const docB = { ...docA, id: "doc-b", formato_id: "02", data: { nombre: "Cliente B" } };
it("Documentos: los cambios sin guardar no se mezclan con otro documento y un fallo conserva la captura", async () => {
  server.docs = [docA, docB];
  let finish!: (response: Response) => void;
  server.fail = (url, init) => init?.method === "PUT" && url.includes("/formatos/") ? new Promise<Response>(resolve => { finish = resolve; }) : undefined;
  await openOperation("documentos");
  fireEvent.click(await screen.findByRole("button", { name: /^18 ·/ }));
  const field = await screen.findByLabelText("Quien paga");
  fireEvent.change(field, { target: { value: "Captura pendiente" } });
  fireEvent.click(screen.getByRole("button", { name: /^02 ·/ }));
  expect(screen.getByRole("alert").textContent).toMatch(/guarda.*descarta/i);
  expect((screen.getByLabelText("Quien paga") as HTMLInputElement).value).toBe("Captura pendiente");
  fireEvent.click(screen.getByRole("button", { name: "Guardar borrador" }));
  expect((screen.getByRole("button", { name: /^02 ·/ }) as HTMLButtonElement).disabled).toBe(true);
  expect(screen.getByLabelText("Quien paga").closest("fieldset")?.disabled).toBe(true);
  await act(async () => finish(Response.json({ error: "Servicio temporalmente no disponible" }, { status: 503 })));
  expect((screen.getByLabelText("Quien paga") as HTMLInputElement).value).toBe("Captura pendiente");
  expect(screen.getByText(/Guarda los cambios antes de generar el PDF/)).toBeTruthy();
  fireEvent.click(screen.getByText("Sobre los formatos y su PDF"));
  expect(screen.getByRole("link", { name: /03 · Control comercial/ }).getAttribute("href")).toBe("/admin/control-comercial");
});

it("Documentos: una apertura lenta no se mezcla con otro documento", async () => {
  server.docs = [docA, docB];
  let finish!: (response: Response) => void;
  server.fail = url => url === "/api/admin/formatos/doc-a" ? new Promise<Response>(resolve => { finish = resolve; }) : undefined;
  await openOperation("documentos");
  fireEvent.click(await screen.findByRole("button", { name: /^18 ·/ }));
  expect((screen.getByRole("button", { name: /^02 ·/ }) as HTMLButtonElement).disabled).toBe(true);
  await act(async () => finish(Response.json({ documento: docA, emisiones: [] })));
  await waitFor(() => expect((screen.getByLabelText("Quien paga") as HTMLInputElement).value).toBe("Cliente A"));
});

it("el tablero agrupa por etapa, busca sin acentos, filtra «Mías» y abre cada operación", async () => {
  server.ops = [
    base(), base({ id: ID2, folio: "EXP-COMPRA", cliente_id: "c2", asesor_id: "a2", etapa: "negociacion", flujo: flow({}, { ruta: "compra" }) }),
    base({ id: "51000000-0000-4000-8000-000000000003", folio: "EXP-CERRADO", etapa: "cerrado" }),
    base({ id: "51000000-0000-4000-8000-000000000004", folio: "EXP-SIN-CLIENTE", cliente_id: "missing", etapa: "documentacion" }),
  ];
  server.tasks = [{ id: "t1", titulo: "Pedir la escritura", estado: "pendiente", prioridad: "normal", categoria: "captacion", pasos: [], vence: "2026-10-14", expedienteId: ID }];
  nav.search = new URLSearchParams({ etapa: "visitas-ofertas" });
  render(<OperationsBoard />);
  const visits = await screen.findByRole("listitem", { name: /Visitas y ofertas/ });
  expect(visits.hasAttribute("data-active")).toBe(true);
  expect(within(screen.getByRole("listitem", { name: /^Prospecto/ })).getByRole("link", { name: /Familia Castañeda Ortiz/ }).getAttribute("href")).toBe(`/admin/operaciones/${ID}`);
  expect(screen.getByText("Vencido · 14 oct")).toBeTruthy();
  expect(screen.getByText(/1 con algo vencido/)).toBeTruthy();
  expect(within(screen.getByRole("listitem", { name: /Verificación/ })).getByRole("link", { name: /EXP-SIN-CLIENTE/ })).toBeTruthy();
  expect(within(visits).queryByRole("link", { name: /Ángel Martínez/ })).toBeNull();
  fireEvent.click(screen.getByRole("radio", { name: "Todo el equipo" }));
  expect(within(visits).getByRole("link", { name: /Ángel Martínez/ })).toBeTruthy();
  fireEvent.change(screen.getByRole("textbox", { name: "Buscar cliente o folio" }), { target: { value: "martinez" } });
  expect(screen.queryByRole("link", { name: /Castañeda/ })).toBeNull();
  expect(screen.getByRole("link", { name: /Ángel Martínez/ })).toBeTruthy();
  fireEvent.change(screen.getByRole("textbox", { name: "Buscar cliente o folio" }), { target: { value: "" } });
  fireEvent.click(screen.getByText("Archivadas (1)"));
  expect(screen.getByRole("link", { name: /EXP-CERRADO/ })).toBeTruthy();
});

it("un fallo del tablero se distingue de un tablero vacío y permite reintentar", async () => {
  let down = true;
  server.fail = url => down && url.startsWith("/api/admin/expedientes") ? Response.json({ error: "Consulta no disponible" }, { status: 503 }) : undefined;
  render(<OperationsBoard />);
  expect((await screen.findByRole("alert")).textContent).toContain("Consulta no disponible");
  expect(screen.queryByText("Sin operaciones en esta etapa.")).toBeNull();
  down = false;
  fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
  expect(await screen.findByRole("link", { name: /Familia Castañeda Ortiz/ })).toBeTruthy();
});

it("restaura desde Operaciones eliminadas con confirmación", async () => {
  server.deleted = [base({ deleted_at: "2026-10-10T00:00:00Z" })]; server.ops = [];
  nav.search = new URLSearchParams({ eliminadas: "1" });
  render(<OperationsBoard />);
  const restore = await screen.findByRole("button", { name: "Restaurar EXP-2026-041" });
  vi.mocked(confirmAction).mockResolvedValueOnce(false);
  fireEvent.click(restore);
  await waitFor(() => expect(confirmAction).toHaveBeenCalled());
  expect(server.methods).toEqual([]);
  fireEvent.click(restore);
  expect(await screen.findByText("Operación EXP-2026-041 restaurada.")).toBeTruthy();
  expect(server.methods).toEqual(["PATCH"]);
});

it("Alta directa no pide folio, protege la captura al salir, permite descartar y abre la operación creada", async () => {
  render(<OperationsBoard />);
  fireEvent.click(await screen.findByRole("button", { name: "Alta directa, sin entrevista" }));
  expect(screen.getByText("El folio se asigna al guardar.")).toBeTruthy();
  const unit = screen.getByLabelText("Unidad, si aplica");
  fireEvent.change(unit, { target: { value: "Unidad pendiente" } });
  vi.mocked(confirmAction).mockResolvedValueOnce(false);
  fireEvent.click(screen.getByRole("link", { name: "Ver operaciones eliminadas" }));
  await waitFor(() => expect(confirmAction).toHaveBeenCalledWith(expect.stringContaining("Descartar los cambios y salir")));
  fireEvent.click(screen.getByRole("button", { name: "Descartar" }));
  await waitFor(() => expect((unit as HTMLInputElement).value).toBe(""));
  await screen.findByRole("option", { name: "Familia Castañeda Ortiz" });
  fireEvent.change(screen.getByLabelText("Cliente"), { target: { value: "c1" } });
  fireEvent.click(screen.getByRole("button", { name: "Abrir operación" }));
  await waitFor(() => expect(nav.push).toHaveBeenCalledWith(`/admin/operaciones/${ID2}`));
});

it("el tablero reúne todas las páginas de la consulta y solo lee, sin escribir", async () => {
  const second = base({ id: ID2, folio: "EXP-PAGINA-2", cliente_id: "c2", asesor_id: "a1", etapa: "documentacion" });
  server.fail = url => url.startsWith("/api/admin/expedientes?limit") ? Response.json(url.includes("offset=0") ? { expedientes: [base()], nextOffset: 1 } : { expedientes: [second], nextOffset: null }) : undefined;
  render(<OperationsBoard />);
  expect(await screen.findByRole("link", { name: /Ángel Martínez/ })).toBeTruthy();
  expect(screen.getByRole("link", { name: /Familia Castañeda Ortiz/ })).toBeTruthy();
  expect(vi.mocked(fetch).mock.calls.filter(([url]) => String(url).startsWith("/api/admin/expedientes?limit"))).toHaveLength(2);
  expect(server.methods).toEqual([]);
});

it("en Verificación no hay un botón que nunca se activa: explica que «Contrato» se abre sola y lo avisa al ocurrir", async () => {
  const verifiedExcept = { entrevista: reviewed(), titularidad: reviewed(), factibilidad: reviewed({ vigenteHasta: "2026-12-31" }), valor: reviewed(), precio: { estado: "recibido", soporte: "Acordado por WhatsApp" } };
  server.ops = [base({ etapa: "documentacion", flujo: flow(verifiedExcept, accepted) })];
  server.tasks = [{ id: "t1", titulo: "Firmar contrato", estado: "pendiente", prioridad: "normal", categoria: "captacion", pasos: [], vence: "2026-10-20", expedienteId: ID, asesorId: "a1" }];
  await openOperation();
  expect(screen.getByText("Lo que sigue · Etapa 5 de 9")).toBeTruthy();
  expect(screen.queryByRole("button", { name: /Pasar a/ })).toBeNull();
  expect(screen.getByText("Al completarlo se abre «Contrato y preparación» sola.")).toBeTruthy();
  fireEvent.click(within(screen.getByRole("radiogroup", { name: /Precio de salida/ })).getByRole("radio", { name: /Revisado/ }));
  const sheet = await screen.findByRole("dialog");
  fireEvent.change(within(sheet).getByLabelText("Qué encontraste"), { target: { value: "Precio acordado de 4.5 millones" } });
  fireEvent.change(within(sheet).getByLabelText("Folio o dónde está"), { target: { value: "Mensaje de WhatsApp del 15 oct" } });
  fireEvent.click(within(sheet).getByRole("button", { name: "Guardar como revisado" }));
  expect(await screen.findByText("Verificación terminada. Ya puedes trabajar el contrato y la preparación.")).toBeTruthy();
  expect(screen.getByText("Lo que sigue · Etapa 6 de 9")).toBeTruthy();
  expect(screen.getByRole("button", { name: /Pasar a: Publicación y seguimiento/ })).toBeTruthy();
});
