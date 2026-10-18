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
/** La etapa en curso se lee en la tarjeta de avance («Etapa N de 10 · fase»). */
const stage = (n: number) => screen.findAllByText(new RegExp(`^Etapa ${n} de 10`));
/** Los demás estados de un requisito están en «Más», junto a «Marcar revisado». */
function moreStates(name: string) {
  fireEvent.click(screen.getByRole("button", { name: `Más estados de ${name}` }));
  return screen.getByRole("radiogroup", { name: `Estado de ${name}` });
}

it("muestra la etapa y lo que falta, y «Lo tengo» se guarda con la versión de la operación", async () => {
  interviewDone();
  await openOperation();
  await stage(2);
  expect(screen.getAllByText("Entrevista inicial").length).toBeGreaterThan(0);
  expect(screen.getByRole("heading", { level: 2, name: "Para terminar la etapa" })).toBeTruthy();
  const group = moreStates("Entrevista con el propietario");
  expect(within(group).queryByRole("radio", { name: /No aplica/ })).toBeNull();
  fireEvent.click(within(group).getByRole("radio", { name: /Lo tengo/ }));
  await screen.findByText("Guardado");
  expect(lastFlow()).toMatchObject({ version: 3, etapa: "captacion", flujo: { requisitos: { entrevista: { estado: "recibido" } } } });
  expect(screen.getByText("Ya tienes el documento · falta revisarlo")).toBeTruthy();
});

it("el prospecto se ve en su etapa y «Iniciar entrevista» abre el 02 en su ventana, por secciones", async () => {
  await openOperation();
  await stage(1);
  expect(screen.getByRole("heading", { level: 2, name: "Hacer la entrevista inicial (02)" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: /Pasar a/ })).toBeNull();
  expect(screen.getAllByText((_, el) => el?.textContent === "Con todo listo se abre sola Entrevista inicial.").length).toBeGreaterThan(0);
  fireEvent.click(screen.getByRole("button", { name: "Iniciar entrevista" }));
  const capture = await screen.findByRole("dialog", { name: "Entrevista inicial" });
  expect(server.methods).toContain("POST");
  expect(within(capture).getByRole("heading", { level: 3, name: "Datos de la entrevista" })).toBeTruthy();
  expect(within(capture).getByRole("button", { name: "Word" })).toBeTruthy();
  expect(within(capture).getByRole("button", { name: /^Siguiente/ })).toBeTruthy();
  fireEvent.click(within(capture).getByRole("button", { name: "Cerrar" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  await stage(2);
  expect(screen.getByRole("heading", { level: 2, name: "Terminar entrevista inicial (02)" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Continuar" })).toBeTruthy();
});

it("con la entrevista terminada se inicia el levantamiento según el tipo de inmueble", async () => {
  interviewDone();
  server.docs[0].data = { tipoInmueble: "departamento" };
  await openOperation();
  await stage(2);
  expect(screen.getByRole("heading", { level: 2, name: "Iniciar el levantamiento" })).toBeTruthy();
  const type = await screen.findByLabelText("Tipo de levantamiento") as HTMLSelectElement;
  await waitFor(() => expect(type.value).toBe("04C"));
  fireEvent.change(type, { target: { value: "04B" } });
  fireEvent.click(screen.getByRole("button", { name: /Iniciar levantamiento/ }));
  const capture = await screen.findByRole("dialog", { name: "Levantamiento de casa" });
  expect(within(capture).getAllByRole("button", { name: /Fotografías y croquis/ }).length).toBeGreaterThan(0);
  fireEvent.click(within(capture).getByRole("button", { name: "Cerrar" }));
  await stage(3);
  expect(screen.getByRole("button", { name: "Continuar" })).toBeTruthy();
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
  await stage(4);
  expect(screen.getByRole("heading", { level: 2, name: "Reunir los documentos del propietario" })).toBeTruthy();
  expect(screen.getByText(`0 de ${created.pasos.length} recibidos`)).toBeTruthy();
  fireEvent.click(screen.getByRole("checkbox", { name: /D01 · Escritura/ }));
  await waitFor(() => expect((server.tasks.at(-1) as { pasos: Array<{ id: string; hecho: boolean }> }).pasos.find(p => p.id === "D01")?.hecho).toBe(true));
  expect(screen.getByRole("button", { name: /Pasar a: Dictamen jurídico/ }).hasAttribute("disabled")).toBe(true);
});

it("en el dictamen, la barra dice qué les falta a las etapas anteriores y «Ver etapas» muestra sus documentos", async () => {
  interviewDone();
  server.ops = [base({ etapa: "documentacion", flujo: flow({ entrevista: reviewed() }) })];
  await openOperation();
  await stage(5);
  expect(await screen.findByRole("button", { name: "3 · Levantamiento: falta el 04" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "2 · Entrevista inicial: lista" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "4 · Checklist de documentos: falta el checklist" })).toBeTruthy();
  expect(screen.getByText("A la etapa 3, levantamiento, le falta el 04. Hay 1 más en «Ver etapas».")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Ver etapas" }));
  const sheet = await screen.findByRole("dialog", { name: "Etapas" });
  expect(within(sheet).getAllByText("No se generó").length).toBeGreaterThan(0);
  expect(within(sheet).getByRole("link", { name: "PDF" }).getAttribute("href")).toBe("/api/admin/emisiones/e02/descargar");
  fireEvent.click(within(sheet).getByRole("button", { name: "Cerrar" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  const scroll = vi.fn();
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: scroll });
  try {
    fireEvent.click(screen.getByRole("button", { name: "2 · Entrevista inicial: lista" }));
    await screen.findByRole("dialog", { name: "Etapas" });
    await waitFor(() => expect(document.activeElement?.textContent).toContain("2 · Entrevista inicial"));
    expect(scroll.mock.contexts.at(-1)).toBe(document.activeElement);
  } finally { delete (HTMLElement.prototype as Partial<HTMLElement>).scrollIntoView; }
});

it("en el dictamen jurídico, «Iniciar» abre el 05 en su ventana con lo recibido en el checklist", async () => {
  server.ops = [base({ etapa: "documentacion", flujo: flow({ entrevista: reviewed() }) })];
  server.tasks = [{ id: `checklist-${ID}`, titulo: "Reunir los documentos del propietario", estado: "en-curso", prioridad: "normal", categoria: "documentacion", pasos: [{ id: "D01", texto: "D01 · Escritura", hecho: true }, { id: "D06", texto: "D06 · Predial", hecho: false }], expedienteId: ID, asesorId: "a1" }];
  await openOperation();
  await stage(5);
  expect(screen.getAllByText("Dictamen jurídico").length).toBeGreaterThan(0);
  expect(screen.getByRole("heading", { level: 2, name: "Iniciar revisión jurídica y control de cierre (05)" })).toBeTruthy();
  expect(screen.getAllByText((_, el) => el?.textContent === "Con todo listo se abre sola Opinión de valor y precio.").length).toBeGreaterThan(0);
  expect(screen.getByRole("button", { name: "Más estados de Quién es dueño y quién firma" })).toBeTruthy();
  fireEvent.click(screen.getAllByRole("button", { name: /^Iniciar$/ })[0]);
  expect(await screen.findByRole("dialog", { name: "Revisión jurídica y control de cierre" })).toBeTruthy();
  const created = server.docs.find(d => d.formato_id === "05") as { data: { documentos: Array<Record<string, string>> } };
  expect(created.data.documentos).toHaveLength(22);
  expect(created.data.documentos[0]).toMatchObject({ concepto: "D01", aplica: "si", estado: "recibido" });
  expect(created.data.documentos.find(d => d.concepto === "D06")).toMatchObject({ aplica: "si", estado: "no_recibido" });
  expect(created.data.documentos.find(d => d.concepto === "D04")).toEqual({ concepto: "D04" });
});

it("en contrato y preparación se inician el 09 (sólo Word) y el 10", async () => {
  const verified = { entrevista: reviewed(), titularidad: reviewed(), factibilidad: reviewed({ vigenteHasta: "2026-12-31" }), valor: reviewed(), precio: reviewed() };
  server.ops = [base({ etapa: "documentacion", flujo: flow(verified, accepted) })];
  await openOperation();
  await stage(7);
  expect(screen.getByText("09 · Contrato de intermediación inmobiliaria para venta")).toBeTruthy();
  expect(screen.getByText("10 · Plan de comercialización")).toBeTruthy();
  fireEvent.click(screen.getAllByRole("button", { name: /^Iniciar$/ })[0]);
  const capture = await screen.findByRole("dialog", { name: "Contrato de intermediación inmobiliaria para venta" });
  expect(server.docs.some(d => d.formato_id === "09")).toBe(true);
  expect(within(capture).getByRole("button", { name: "Word" })).toBeTruthy();
  expect((within(capture).getByRole("button", { name: "Generar PDF" }) as HTMLButtonElement).disabled).toBe(true);
});

it("un fallo al guardar se informa en palabras sencillas y no anuncia ningún avance", async () => {
  server.fail = (url, init) => init?.method === "PUT" && url.endsWith("/operacion") ? Response.json({ error: "Servicio no disponible" }, { status: 503 }) : undefined;
  interviewDone();
  await openOperation();
  await stage(2);
  fireEvent.click(within(moreStates("Entrevista con el propietario")).getByRole("radio", { name: /Lo tengo/ }));
  expect((await screen.findByRole("alert")).textContent).toBe("No se pudo guardar: Servicio no disponible");
  expect(screen.queryByText(/pasó a/)).toBeNull();
  expect(screen.getAllByText("Pendiente").length).toBeGreaterThan(0);
});

it("Marcar revisado pide qué se encontró y guarda el respaldo, quién y cuándo", async () => {
  interviewDone();
  await openOperation();
  await stage(2);
  fireEvent.click(screen.getByRole("button", { name: "Marcar revisado" }));
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

it("Hay un problema guarda el título y la explicación, pasa a «Ahora toca» y se resuelve dejando constancia", async () => {
  interviewDone();
  await openOperation();
  await stage(2);
  fireEvent.click(within(moreStates("Entrevista con el propietario")).getByRole("radio", { name: /Hay un problema/ }));
  const sheet = await screen.findByRole("dialog");
  fireEvent.change(within(sheet).getByLabelText("Cuál es el problema"), { target: { value: "El propietario no tiene la escritura" } });
  fireEvent.change(within(sheet).getByLabelText("Qué pasó y cómo se puede resolver"), { target: { value: "La tiene su hermano en Ensenada." } });
  fireEvent.click(within(sheet).getByRole("button", { name: "Guardar" }));
  expect(await screen.findByRole("heading", { level: 2, name: "Resolver: Entrevista con el propietario" })).toBeTruthy();
  expect(screen.getAllByText("El propietario no tiene la escritura").length).toBeGreaterThan(0);
  expect(lastFlow()).toMatchObject({ flujo: { requisitos: { entrevista: { estado: "observado", soporte: "El propietario no tiene la escritura\nLa tiene su hermano en Ensenada." } } } });
  fireEvent.click(screen.getAllByRole("button", { name: "Ya se resolvió" })[0]);
  await waitFor(() => expect(lastFlow()).toMatchObject({ flujo: { requisitos: { entrevista: { estado: "recibido", soporte: "Resuelto el 16 oct: El propietario no tiene la escritura" } } } }));
});

it("«Pasar a» se habilita solo con todo listo y registra el avance", async () => {
  server.ops = [base({ flujo: flow({ entrevista: reviewed() }) })];
  intakeDone();
  await openOperation();
  const advance = await screen.findByRole("button", { name: /Pasar a: Dictamen jurídico/ });
  expect((advance as HTMLButtonElement).disabled).toBe(true);
  expect(screen.getByRole("button", { name: "Agendar la próxima tarea" })).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Qué sigue"), { target: { value: "Pedir la escritura" } });
  fireEvent.change(screen.getByLabelText("Fecha"), { target: { value: "2026-10-20" } });
  fireEvent.click(screen.getByRole("button", { name: "Agendar" }));
  await waitFor(() => expect(server.tasks).toHaveLength(2));
  expect(server.tasks[1]).toMatchObject({ titulo: "Pedir la escritura", vence: "2026-10-20", expedienteId: ID, asesorId: "a1", estado: "pendiente" });
  await waitFor(() => expect((screen.getByRole("button", { name: /Pasar a: Dictamen jurídico/ }) as HTMLButtonElement).disabled).toBe(false));
  expect(screen.getAllByRole("button", { name: /Pasar a: Dictamen jurídico/ })).toHaveLength(1);
  fireEvent.click(screen.getByRole("button", { name: /Pasar a: Dictamen jurídico/ }));
  expect(await screen.findByText("Listo: la operación pasó a «Dictamen jurídico».")).toBeTruthy();
  expect(lastFlow()).toMatchObject({ etapa: "documentacion", version: 3 });
  await stage(5);
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
  fireEvent.click(screen.getByRole("tab", { name: "Esta etapa" }));
  await waitFor(() => expect(confirmAction).toHaveBeenCalledWith(expect.stringContaining("cambiar de pestaña")));
  expect((screen.getByLabelText("Nueva nota") as HTMLTextAreaElement).value).toBe("Comprobar antecedente original");
  fireEvent.click(screen.getByRole("button", { name: "Guardar nota" }));
  expect(await screen.findByText("Comprobar antecedente original", { selector: "p" })).toBeTruthy();
});

const docA = { id: "doc-a", expediente_id: ID, formato_id: "18", data: { pagador: "Cliente A" }, version: 1, updated_at: "2026-10-04" };
const docB = { ...docA, id: "doc-b", formato_id: "02", data: { nombre: "Cliente B" } };
it("Expediente: cada documento se abre en su ventana y un fallo al guardar conserva la captura", async () => {
  server.docs = [docA, docB];
  let finish!: (response: Response) => void;
  server.fail = (url, init) => init?.method === "PUT" && url.includes("/formatos/") ? new Promise<Response>(resolve => { finish = resolve; }) : undefined;
  await openOperation("documentos");
  expect((await screen.findAllByText("18 · Recibo de pago de honorarios")).length).toBeGreaterThan(0);
  expect(screen.getByRole("link", { name: /03 · Control comercial/ }).getAttribute("href")).toBe("/admin/control-comercial");
  fireEvent.click(screen.getAllByRole("button", { name: "Abrir" })[1]);
  const capture = await screen.findByRole("dialog", { name: "Recibo de pago de honorarios" });
  const field = within(capture).getByLabelText("Quien paga");
  fireEvent.change(field, { target: { value: "Captura pendiente" } });
  fireEvent.click(within(capture).getByRole("button", { name: "Guardar borrador" }));
  await waitFor(() => expect(within(capture).getByLabelText("Quien paga").closest("fieldset")?.disabled).toBe(true));
  await act(async () => finish(Response.json({ error: "Servicio temporalmente no disponible" }, { status: 503 })));
  expect((within(capture).getByLabelText("Quien paga") as HTMLInputElement).value).toBe("Captura pendiente");
  expect(within(capture).getByRole("alert").textContent).toContain("Servicio temporalmente no disponible");
});

it("Expediente: cerrar una ventana guarda y abrir otra no mezcla las capturas", async () => {
  server.docs = [docA, docB];
  await openOperation("documentos");
  fireEvent.click((await screen.findAllByRole("button", { name: "Abrir" }))[1]);
  const first = await screen.findByRole("dialog", { name: "Recibo de pago de honorarios" });
  fireEvent.change(within(first).getByLabelText("Quien paga"), { target: { value: "Cliente A corregido" } });
  fireEvent.click(within(first).getByRole("button", { name: "Cerrar" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(confirmAction).toHaveBeenCalledWith(expect.stringContaining("Guardarlas y cerrar"));
  expect(server.methods).toContain("PUT");
  fireEvent.click(screen.getAllByRole("button", { name: "Abrir" })[0]);
  const second = await screen.findByRole("dialog", { name: "Entrevista inicial" });
  expect(within(second).queryByLabelText("Quien paga")).toBeNull();
});

it("la lista separa lo que espera algo de ti, filtra por fase, busca sin acentos y filtra «Mías»", async () => {
  server.ops = [
    base(), base({ id: ID2, folio: "EXP-COMPRA", cliente_id: "c2", asesor_id: "a2", etapa: "negociacion", flujo: flow({}, { ruta: "compra" }) }),
    base({ id: "51000000-0000-4000-8000-000000000003", folio: "EXP-CERRADO", etapa: "cerrado" }),
    base({ id: "51000000-0000-4000-8000-000000000004", folio: "EXP-SIN-CLIENTE", cliente_id: "missing", etapa: "documentacion" }),
  ];
  server.tasks = [{ id: "t1", titulo: "Pedir la escritura", estado: "pendiente", prioridad: "normal", categoria: "captacion", pasos: [], vence: "2026-10-14", expedienteId: ID }];
  nav.search = new URLSearchParams({ etapa: "visitas-ofertas" });
  render(<OperationsBoard />);
  const sell = await screen.findByRole("button", { name: /Vender y cerrar/ });
  expect(sell.getAttribute("aria-pressed")).toBe("true");
  // En «Vender y cerrar» no aparece la operación del prospecto; la archivada va aparte.
  expect(within(screen.getByRole("region", { name: /Esperan algo de ti/ })).queryByRole("link", { name: /Familia Castañeda Ortiz/ })).toBeNull();
  fireEvent.click(screen.getByRole("radio", { name: "Todo el equipo" }));
  expect(screen.getByRole("link", { name: /Ángel Martínez\. Etapa 4 de 7, Oferta y negociación/ })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: /^Todas/ }));
  await waitFor(() => expect(nav.search.get("etapa")).toBeNull());
  const waiting = screen.getByRole("region", { name: /Esperan algo de ti/ });
  const castaneda = within(waiting).getByRole("link", { name: /Familia Castañeda Ortiz/ });
  expect(castaneda.getAttribute("href")).toBe(`/admin/operaciones/${ID}`);
  expect(within(castaneda).getByText("Tarea vencida")).toBeTruthy();
  expect(within(castaneda).getByText("Vencido · 14 oct")).toBeTruthy();
  expect(within(waiting).getByRole("link", { name: /EXP-SIN-CLIENTE\. Etapa 5 de 10, Dictamen jurídico\. Falta el 02/ })).toBeTruthy();
  fireEvent.click(screen.getByRole("radio", { name: "Mías" }));
  expect(screen.queryByRole("link", { name: /Ángel Martínez/ })).toBeNull();
  fireEvent.click(screen.getByRole("radio", { name: "Todo el equipo" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Buscar operación" }), { target: { value: "martinez" } });
  expect(screen.queryByRole("link", { name: /Castañeda/ })).toBeNull();
  expect(screen.getByRole("link", { name: /Ángel Martínez/ })).toBeTruthy();
  fireEvent.change(screen.getByRole("textbox", { name: "Buscar operación" }), { target: { value: "" } });
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
  await stage(6);
  expect(screen.queryByRole("button", { name: /Pasar a/ })).toBeNull();
  expect(screen.getAllByText((_, el) => el?.textContent === "Con todo listo se abre sola Contrato y preparación.").length).toBeGreaterThan(0);
  expect(screen.getByRole("heading", { level: 2, name: "Iniciar opinión de valor comercial (07)" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Marcar revisado" }));
  const sheet = await screen.findByRole("dialog", { name: "Precio de salida acordado" });
  fireEvent.change(within(sheet).getByLabelText("Qué encontraste"), { target: { value: "Precio acordado de 4.5 millones" } });
  fireEvent.click(within(sheet).getByRole("radio", { name: /Documento fuera del sistema/ }));
  fireEvent.change(within(sheet).getByLabelText("Folio o dónde está"), { target: { value: "Mensaje de WhatsApp del 15 oct" } });
  fireEvent.click(within(sheet).getByRole("button", { name: "Guardar como revisado" }));
  expect(await screen.findByText("Verificación terminada. Ya puedes trabajar el contrato y la preparación.")).toBeTruthy();
  await stage(7);
  expect(screen.getByRole("button", { name: /Pasar a: Publicación y seguimiento/ })).toBeTruthy();
});
