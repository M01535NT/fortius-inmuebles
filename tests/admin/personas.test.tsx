import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/components/admin/workspace/use-person-status", () => ({ usePersonStatus: () => ({ ofClient: (id: string) => id === "cli-2" ? "cliente" : "prospecto", ofLead: () => undefined }) }));
const guardados = vi.hoisted(() => vi.fn(async (_col: unknown, item: unknown) => item));
const borrados = vi.hoisted(() => vi.fn(async () => undefined));
vi.mock("@/components/admin/workspace/confirm", () => ({ confirmDelete: vi.fn(async () => true) }));
vi.mock("@/lib/admin/store", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/admin/store")>();
  const OP = "51000000-0000-4000-8000-000000000001";
  const data = new Map<unknown, unknown[]>([
    [actual.db.clientes, [
      { id: "cli-1", nombre: "Laura Méndez", telefono: "6645550142", tipo: "propietario", asesorId: "a1", notas: "", creadoEl: "2026-11-01", actualizadoEl: "2026-11-01" },
      { id: "cli-2", nombre: "Ana Robles", telefono: "6645550119", tipo: "comprador", inmueblesInteres: ["casa-chapultepec"], asesorId: "a1", notas: "", creadoEl: "2026-11-01", actualizadoEl: "2026-11-01" }]],
    [actual.db.leads, [{ id: "lead-1", nombre: "Carlos Vega", telefono: "6645550177", origen: "manual", estado: "nuevo", creadoEl: "2026-11-10T10:00:00Z", notas: [{ id: "ln1", texto: "Busca casa con patio", fecha: "2026-11-10T10:05:00Z" }], perfil: { proximoContacto: "2099-01-05", proximaAccion: "Mandarle opciones" } }]],
    [actual.db.tareas, [
      { id: "t1", titulo: "Llamar a Ana por la visita", estado: "pendiente", vence: "2026-01-02", clienteId: "cli-2", pasos: [] },
      { id: "t2", titulo: "Pedir el predial", estado: "completada", completadoEl: "2026-11-11T18:00:00Z", expedienteId: OP, pasos: [] }]],
    [actual.db.notas, [{ id: "n1", titulo: "", texto: "Quiere vender antes de fin de año", actualizadoEl: "2026-11-12T17:00:00Z", clienteId: "cli-1", autor: "Nallely Díaz" }]],
    [actual.db.propiedades, [{ slug: "casa-chapultepec", titulo: "Casa en Chapultepec", codigo: "FORTIUS-000209", precio: { modalidad: "publico", monto: 4200000, moneda: "MXN" }, galeria: [], estado: "evaluacion", publicada: false }]],
  ]);
  return {
    ...actual, useCollection: (col: unknown) => data.get(col) ?? [], upsert: guardados, removeById: borrados,
    loadAllDossiers: async () => [{ id: OP, folio: "EXP-000342", version: 1, cliente_id: "cli-1", asesor_id: "a1", operacion: "venta", propiedad_slug: "casa-chapultepec", etapa: "documentacion", flujo: { version: 1, ruta: "captacion", estado: "activa", motivo: "", requisitos: {} } }],
  };
});
import { PersonasApp } from "@/components/admin/personas/personas-app";

/* FLX · Personas: lista y perfil en una pantalla, con la guía, lo que sigue y sus documentos. */
const OP = "51000000-0000-4000-8000-000000000001";
afterEach(() => { cleanup(); vi.unstubAllGlobals(); guardados.mockClear(); borrados.mockClear(); });

function servidor() {
  const calls: Array<{ method: string; url: string; body?: Record<string, unknown> }> = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    calls.push({ method, url, body: typeof init?.body === "string" ? JSON.parse(init.body) as Record<string, unknown> : undefined });
    if (url === "/api/admin/bandeja?clienteId=cli-1") return Response.json({ documentos: [{ id: "d1", titulo: "Identificación oficial", created_at: "2026-11-13T10:00:00Z", tipo_documento: null }] });
    if (url.startsWith("/api/admin/bandeja?clienteId=")) return Response.json({ documentos: [] });
    if (url === `/api/admin/expedientes/${OP}/archivos`) return Response.json({ archivos: [{ id: "a1", titulo: "Escritura pública", created_at: "2026-11-12T10:00:00Z", deleted_at: null }], papelera: [] });
    if (url === `/api/admin/expedientes/${OP}/formatos`) return Response.json({ documentos: [{ id: "f1", formato_id: "02", version: 2, updated_at: "2026-11-12T12:00:00Z" }] });
    if (url === "/api/admin/bandeja" && method === "POST") return Response.json({ signedUrl: "https://storage.example/upload?token=t", ticket: "ticket" });
    if (url.startsWith("https://storage.example/")) return new Response(null, { status: 200 });
    if (url === "/api/admin/bandeja/completar") return Response.json({ documento: { id: "d9", titulo: "Predial" } }, { status: 201 });
    if (url === "/api/admin/bandeja/d9" && method === "PATCH") return Response.json({ documento: { id: "d9", titulo: "Predial" } });
    if (url === "/api/admin/entrevistas/config") return Response.json({ administrador: false, asesorId: "a1" });
    return Response.json({ expedientes: [] });
  }));
  return calls;
}

it("muestra a prospectos y clientes en una lista y filtra por condición", async () => {
  servidor();
  render(<PersonasApp initialId={null} />);
  const lista = screen.getByRole("complementary", { name: "Personas" });
  expect(within(lista).getAllByRole("button").map(b => b.textContent)).toEqual(expect.arrayContaining([expect.stringContaining("Laura Méndez"), expect.stringContaining("Ana Robles"), expect.stringContaining("Carlos Vega")]));
  fireEvent.click(within(lista).getByRole("radio", { name: "Clientes" }));
  expect(within(lista).queryByRole("button", { name: /Carlos Vega/ })).toBeNull();
  expect(within(lista).getByRole("button", { name: /Ana Robles/ })).toBeTruthy();
});

it("el perfil junta la guía de su operación y los documentos de la persona y de la operación", async () => {
  servidor();
  render(<PersonasApp initialId="cliente:cli-1" />);
  expect(await screen.findByRole("heading", { name: "Laura Méndez" })).toBeTruthy();
  const guia = await screen.findByRole("navigation", { name: "Guía del asunto EXP-000342" });
  expect(within(guia).getAllByRole("link").length).toBeGreaterThan(5);
  expect(guia.querySelector("[aria-current='step']")).toBeTruthy();
  expect(await screen.findByText("Identificación oficial")).toBeTruthy();
  expect(await screen.findByText("Escritura pública")).toBeTruthy();
  expect(await screen.findByText("Versión 2")).toBeTruthy();
  fireEvent.click(screen.getByRole("radio", { name: "Hechos aquí" }));
  expect(screen.queryByText("Escritura pública")).toBeNull();
  expect(screen.getByRole("link", { name: "Abrir el asunto" }).getAttribute("href")).toBe(`/admin/operaciones/${OP}`);
});

it("«Agregar archivo» lo guarda y lo liga a la persona; un prospecto todavía no recibe archivos", async () => {
  const calls = servidor();
  render(<PersonasApp initialId="cliente:cli-1" />);
  await screen.findByRole("heading", { name: "Laura Méndez" });
  fireEvent.change(screen.getByLabelText("Agregar archivos al perfil de Laura Méndez"), { target: { files: [new File(["%PDF-1.7"], "Predial.pdf", { type: "application/pdf" })] } });
  await waitFor(() => expect(calls.find(c => c.url === "/api/admin/bandeja/d9")?.body).toEqual({ destino: { clienteId: "cli-1" }, esperado: { titulo: "Predial", eliminado: false, archivado: false } }));
  expect(await screen.findByText("Archivo guardado en su perfil.")).toBeTruthy();
  cleanup();
  render(<PersonasApp initialId="lead:lead-1" />);
  expect(await screen.findByRole("heading", { name: "Carlos Vega" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: /Agregar archivo/ })).toBeNull();
});

it("si fallan solo los documentos de la persona, el perfil se ve y la sección lo dice con su reintento", async () => {
  servidor();
  const base = globalThis.fetch as unknown as (url: string, init?: RequestInit) => Promise<Response>;
  let falla = true;
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => url === "/api/admin/bandeja?clienteId=cli-1" && falla ? Response.json({ error: "El panel no responde. Espera un minuto y vuelve a intentarlo." }, { status: 503 }) : base(url, init)));
  render(<PersonasApp initialId="cliente:cli-1" />);
  expect(await screen.findByText(/No se pudieron cargar los documentos de la persona/)).toBeTruthy();
  expect(screen.queryByText(/El panel no responde/)).toBeNull();
  // Lo demás sigue ahí: la guía y los documentos de la operación.
  expect(await screen.findByText("Escritura pública")).toBeTruthy();
  falla = false;
  fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
  expect(await screen.findByText("Identificación oficial")).toBeTruthy();
  expect(screen.queryByText(/No se pudieron cargar los documentos de la persona/)).toBeNull();
});

it("sin pendiente anotado, el bloque muestra el paso de la guía con su número y no se contradice", async () => {
  servidor();
  render(<PersonasApp initialId="cliente:cli-1" />);
  const bloque = (await screen.findByRole("link", { name: "Abrir el asunto" })).closest("section")!;
  const actual = (await screen.findByRole("navigation", { name: /Guía del asunto/ })).querySelector("[aria-current='step']")!.textContent!;
  expect(within(bloque).getByRole("heading", { level: 3 }).textContent).toBe(actual);
  expect(bloque.textContent).toMatch(/Es el paso \d+ de \d+ de la guía de venta/);
});

it("LV-10e · la lista va como agenda: primero a quién le toca, con su cara, y al final quien no tiene fecha", async () => {
  servidor();
  render(<PersonasApp initialId={null} />);
  const lista = screen.getByRole("complementary", { name: "Personas" });
  const grupos = within(lista).getAllByRole("group");
  expect(grupos.map(g => g.querySelector("h2")!.firstChild!.textContent)).toEqual(["Te toca hoy o antes", "Más adelante", "Sin fecha"]);
  expect(within(grupos[0]).getByRole("button", { name: /Ana Robles/ }).textContent).toMatch(/Vencido/);
  expect(within(grupos[1]).getByRole("button", { name: /Carlos Vega/ })).toBeTruthy();
  expect(within(grupos[2]).getByRole("button", { name: /Laura Méndez/ })).toBeTruthy();
  // La primera persona que se abre es a quien le toca primero.
  expect(await screen.findByRole("heading", { level: 2, name: "Ana Robles" })).toBeTruthy();
});

it("LV-10e · la ficha junta sus inmuebles con foto, sus operaciones con su etapa y lo que ha pasado", async () => {
  servidor();
  render(<PersonasApp initialId="cliente:cli-1" />);
  await screen.findByRole("heading", { level: 2, name: "Laura Méndez" });
  const inmuebles = screen.getByRole("region", { name: "Sus inmuebles" });
  const tarjeta = within(inmuebles).getByRole("link", { name: /Casa en Chapultepec/ });
  expect(tarjeta.getAttribute("href")).toBe("/admin/propiedades/casa-chapultepec/editar");
  expect(tarjeta.textContent).toContain("$4,200,000 MXN");
  expect(tarjeta.textContent).toMatch(/Lo vende/);
  const operaciones = screen.getByRole("region", { name: "Asuntos" });
  const fila = within(operaciones).getByRole("link", { name: /EXP-000342/ });
  expect(fila.getAttribute("href")).toBe(`/admin/operaciones/${OP}`);
  expect(fila.textContent).toMatch(/^\d+ · /);
  const historia = screen.getByRole("region", { name: "Lo que ha pasado" });
  const sucesos = within(historia).getAllByRole("listitem").map(li => li.textContent);
  expect(sucesos[0]).toMatch(/Nallely Díaz anotó: «Quiere vender antes de fin de año»/);
  expect(sucesos[1]).toMatch(/Se terminó: Pedir el predial/);
  expect(screen.getByRole("link", { name: "Agendar" }).getAttribute("href")).toBe("/admin/agenda?nueva=1&clienteId=cli-1");
});

it("LV-10e · un dato se cambia en su lugar con su versión y se puede deshacer", async () => {
  servidor();
  render(<PersonasApp initialId="cliente:cli-1" />);
  await screen.findByRole("heading", { level: 2, name: "Laura Méndez" });
  fireEvent.click(screen.getByRole("button", { name: "Cambiar teléfono: 6645550142" }));
  const campo = screen.getByRole("textbox", { name: "Teléfono" });
  fireEvent.change(campo, { target: { value: " 6641112233 " } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
  await waitFor(() => expect(guardados).toHaveBeenCalledTimes(1));
  const [, nuevo] = guardados.mock.calls[0] as unknown as [unknown, { telefono: string; nombre: string; actualizadoEl: string }];
  expect(nuevo).toMatchObject({ id: "cli-1", nombre: "Laura Méndez", telefono: "6641112233" });
  expect(nuevo.actualizadoEl).not.toBe("2026-11-01");
  fireEvent.click(await screen.findByRole("button", { name: "Deshacer" }));
  await waitFor(() => expect(guardados).toHaveBeenCalledTimes(2));
  expect(guardados.mock.calls[1][1]).toMatchObject({ id: "cli-1", telefono: "6645550142" });
});

it("LV-10e · si el servidor no acepta el cambio, el campo sigue abierto con el motivo; Escape lo deja como estaba", async () => {
  servidor();
  guardados.mockRejectedValueOnce(new Error("Registra teléfono o correo electrónico"));
  render(<PersonasApp initialId="lead:lead-1" />);
  await screen.findByRole("heading", { level: 2, name: "Carlos Vega" });
  // Sin operación, el próximo contacto del prospecto se ve y se cambia aquí.
  expect(screen.getByRole("button", { name: /Cambiar próximo contacto: .*Mandarle opciones/ })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Cambiar teléfono: 6645550177" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Teléfono" }), { target: { value: "" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
  expect((await screen.findByRole("alert")).textContent).toBe("Registra teléfono o correo electrónico");
  expect(screen.queryByRole("button", { name: "Deshacer" })).toBeNull();
  fireEvent.keyDown(screen.getByRole("textbox", { name: "Teléfono" }), { key: "Escape" });
  expect(screen.getByRole("button", { name: "Cambiar teléfono: 6645550177" })).toBeTruthy();
  // Lo del primer contacto también cuenta en lo que ha pasado.
  expect(within(screen.getByRole("region", { name: "Lo que ha pasado" })).getByText("«Busca casa con patio»")).toBeTruthy();
});

/* FLX-01 · «Nuevo perfil» con las cinco preguntas de una llamada. */
async function llenar(nombre: string, telefono: string) {
  const panel = await screen.findByRole("dialog", { name: "Nuevo perfil" });
  fireEvent.change(within(panel).getByLabelText("¿Cómo se llama?"), { target: { value: nombre } });
  fireEvent.change(within(panel).getByLabelText("¿A qué teléfono le buscamos?"), { target: { value: telefono } });
  fireEvent.click(within(panel).getByRole("radio", { name: "Vender" }));
  fireEvent.click(within(panel).getByRole("radio", { name: "WhatsApp" }));
  fireEvent.click(within(panel).getByRole("button", { name: "Agendar una visita" }));
  return panel;
}

it("«Nuevo perfil» guarda al prospecto con las cinco respuestas y su próximo contacto como tarea", async () => {
  servidor();
  render(<PersonasApp initialId={null} />);
  fireEvent.click(screen.getByRole("button", { name: "Nuevo perfil" }));
  const panel = await llenar("Ejemplo Ramírez Soto", "664 555 0100");
  await waitFor(() => expect(within(panel).getByRole("button", { name: "Guardar perfil" })).toBeTruthy());
  await new Promise(r => setTimeout(r, 0));
  fireEvent.click(within(panel).getByRole("button", { name: "Guardar perfil" }));
  await waitFor(() => expect(guardados).toHaveBeenCalledTimes(2));
  const [, lead, version] = guardados.mock.calls[0] as unknown as [unknown, Record<string, unknown> & { perfil: Record<string, unknown>; notas: unknown[] }, unknown];
  expect(version).toBeNull();
  expect(lead).toMatchObject({ nombre: "Ejemplo Ramírez Soto", telefono: "664 555 0100", origen: "manual", estado: "contactado", asesorId: "a1",
    perfil: { operacion: "vender", canalPreferido: "whatsapp", proximaAccion: "Agendar una visita" } });
  expect(lead.notas).toHaveLength(1);
  const [, tarea] = guardados.mock.calls[1] as unknown as [unknown, Record<string, unknown>];
  expect(tarea).toMatchObject({ titulo: "Agendar una visita", leadId: lead.id, asesorId: "a1", estado: "pendiente" });
  expect(await screen.findByText(/Se guardó el perfil de Ejemplo Ramírez Soto/)).toBeTruthy();
});

it("si el teléfono ya es de alguien, avisa y no guarda hasta saber si es la misma persona", async () => {
  servidor();
  render(<PersonasApp initialId={null} initialNuevo />);
  const panel = await llenar("Carlos Vega Ruiz", "664-555-0177");
  const aviso = within(panel).getByRole("group", { name: "Personas que podrían ser la misma" });
  expect(within(aviso).getByText(/mismo teléfono/)).toBeTruthy();
  await new Promise(r => setTimeout(r, 0));
  fireEvent.click(within(panel).getByRole("button", { name: "Guardar perfil" }));
  expect(await within(panel).findByRole("alert")).toHaveProperty("textContent", "Dinos si es la misma persona que ya tienes o si es otra.");
  expect(guardados).not.toHaveBeenCalled();
  fireEvent.click(within(aviso).getByRole("button", { name: "Es la misma" }));
  expect(await screen.findByRole("heading", { name: "Carlos Vega" })).toBeTruthy();
  expect(guardados).not.toHaveBeenCalled();
});

async function abrirMenu() {
  const boton = screen.getByRole("button", { name: "Más acciones" });
  fireEvent.keyDown(boton, { key: "Enter" });
  return screen.findByRole("menu");
}

it("«Eliminar» del menú ⋯ manda al prospecto a Eliminados con su versión", async () => {
  servidor();
  render(<PersonasApp initialId="lead:lead-1" />);
  await screen.findByRole("heading", { level: 2, name: "Carlos Vega" });
  fireEvent.click(within(await abrirMenu()).getByRole("menuitem", { name: "Eliminar" }));
  await waitFor(() => expect(borrados).toHaveBeenCalledTimes(1));
  expect((borrados.mock.calls[0] as unknown[])[1]).toBe("lead-1");
});

it("«Eliminar» dice por qué no se puede: un asunto en curso o una tarea en la Agenda", async () => {
  servidor();
  render(<PersonasApp initialId="cliente:cli-2" />);
  await screen.findByRole("heading", { level: 2, name: "Ana Robles" });
  const opcion = within(await abrirMenu()).getByRole("menuitem", { name: /Eliminar · tiene una tarea o cita en la Agenda/ });
  expect(opcion.getAttribute("aria-disabled")).toBe("true");
  expect(borrados).not.toHaveBeenCalled();
});

it("«Agregar inmueble» anota en la persona un inmueble de su interés, y se puede quitar", async () => {
  servidor();
  render(<PersonasApp initialId="lead:lead-1" />);
  await screen.findByRole("heading", { level: 2, name: "Carlos Vega" });
  const seccion = screen.getByRole("region", { name: "Sus inmuebles" });
  expect(seccion.textContent).toContain("Con «Agregar inmueble» anotas los que le interesan");
  fireEvent.click(within(seccion).getByRole("button", { name: "Agregar inmueble" }));
  fireEvent.click(await screen.findByRole("option", { name: /Casa en Chapultepec/ }));
  await waitFor(() => expect(guardados).toHaveBeenCalledTimes(1));
  expect(guardados.mock.calls[0][1]).toMatchObject({ id: "lead-1", inmueblesInteres: ["casa-chapultepec"] });
});

it("un inmueble de su interés sale en «Sus inmuebles» con «Le interesa» y su opción para quitarlo", async () => {
  servidor();
  render(<PersonasApp initialId="cliente:cli-2" />);
  await screen.findByRole("heading", { level: 2, name: "Ana Robles" });
  const seccion = screen.getByRole("region", { name: "Sus inmuebles" });
  expect(within(seccion).getByRole("link", { name: /Casa en Chapultepec/ }).textContent).toContain("Le interesa");
  fireEvent.keyDown(within(seccion).getByRole("button", { name: "Acciones de Casa en Chapultepec" }), { key: "Enter" });
  fireEvent.click(await screen.findByRole("menuitem", { name: "Quitar de sus inmuebles" }));
  await waitFor(() => expect(guardados).toHaveBeenCalledTimes(1));
  expect(guardados.mock.calls[0][1]).toMatchObject({ id: "cli-2", inmueblesInteres: [] });
});
