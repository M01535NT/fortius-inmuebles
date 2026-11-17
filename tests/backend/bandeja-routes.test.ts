import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/backend/http";
import { leerTicketDeCarga, prepareUpload } from "@/lib/backend/files";

const { requireStaff, createServerClient } = vi.hoisted(() => ({ requireStaff: vi.fn(), createServerClient: vi.fn() }));
vi.mock("@/lib/backend/auth", () => ({ requireStaff, createServerClient }));
import { GET, POST } from "@/app/api/admin/bandeja/route";
import { PATCH } from "@/app/api/admin/bandeja/[id]/route";
import { POST as PERMISO } from "@/app/api/admin/bandeja/[id]/permiso/route";

const userId = "10000000-0000-4000-8000-000000000001";
const otroId = "10000000-0000-4000-8000-000000000002";
const filaId = "20000000-0000-4000-8000-000000000001";
const origen = "https://panel.test";
type Resultado = { data: unknown; error: { code?: string; message?: string } | null };

/** Consulta simulada de PostgREST: registra cada llamada y resuelve con los resultados en orden. */
function consulta(resultados: Resultado[]) {
  const llamadas: [string, unknown[]][] = [];
  const query: Record<string, (...args: unknown[]) => unknown> = {};
  const siguiente = () => Promise.resolve(resultados.shift() ?? { data: null, error: null });
  for (const metodo of ["select", "insert", "update", "eq", "gt", "order"]) query[metodo] = (...args) => { llamadas.push([metodo, args]); return query; };
  for (const metodo of ["limit", "single", "maybeSingle"]) query[metodo] = (...args) => { llamadas.push([metodo, args]); return siguiente(); };
  return { client: { from: vi.fn(() => query) }, llamadas };
}
function storageSimulado(opciones: { firmada?: Resultado } = {}) {
  const bucket = {
    createSignedUploadUrl: vi.fn(async (path: string) => ({ data: { signedUrl: `https://storage.test/upload/${path}` }, error: null })),
    createSignedUrl: vi.fn(async (path: string) => opciones.firmada ?? { data: { signedUrl: `https://storage.test/sign/${path}` }, error: null }),
    remove: vi.fn(async () => ({ data: [], error: null })),
  };
  return { storage: { from: vi.fn(() => bucket) }, bucket };
}
function registro(cambios: Record<string, unknown> = {}) {
  return {
    id: filaId, creado_por: userId, staging_path: `${userId}/30000000-0000-4000-8000-000000000001.pdf`, nombre: "escritura.pdf",
    tipo: "application/pdf", bytes: 2048, estado: "por_confirmar", destino_clase: null, destino_ref: null, version: 1,
    created_at: "2026-11-16T10:00:00.000Z", vence_el: "2099-12-16T10:00:00.000Z", ...cambios,
  };
}
async function ticketDe(uid: string, contentType = "application/pdf", visibility = "private") {
  const entrada = { name: "escritura.pdf", size: 2048, contentType, visibility, ...(visibility === "public" ? { destino: "sitio" } : {}) };
  return (await prepareUpload(storageSimulado() as never, uid, entrada)).ticket;
}
const json = (method: string, body: unknown, origin = origen) => ({ method, headers: { origin, "content-type": "application/json" }, body: JSON.stringify(body) });
const contexto = (id = filaId) => ({ params: Promise.resolve({ id }) });
const permiso = () => new Request(`${origen}/api/admin/bandeja/${filaId}/permiso`, { method: "POST", headers: { origin: origen } });

beforeEach(() => {
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "sb_secret_test_key_only");
  requireStaff.mockReset(); createServerClient.mockReset();
});
afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); });

describe("GET /api/admin/bandeja", () => {
  it("lista lo por confirmar de quien está en sesión, más reciente primero y sin vencer", async () => {
    const { client, llamadas } = consulta([{ data: [registro()], error: null }]);
    requireStaff.mockResolvedValue({ client, user: { id: userId } });
    const respuesta = await GET();
    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toEqual({ archivos: [{ id: filaId, nombre: "escritura.pdf", tipo: "application/pdf", bytes: 2048, estado: "por_confirmar", destino: null, version: 1, creadoEl: "2026-11-16T10:00:00.000Z", venceEl: "2099-12-16T10:00:00.000Z" }] });
    expect(llamadas).toContainEqual(["eq", ["creado_por", userId]]);
    expect(llamadas).toContainEqual(["eq", ["estado", "por_confirmar"]]);
    expect(llamadas).toContainEqual(["order", ["created_at", { ascending: false }]]);
    expect(llamadas.some(([metodo, args]) => metodo === "gt" && args[0] === "vence_el")).toBe(true);
  });

  it.each([
    { code: "PGRST205", message: "Could not find the table 'public.fortius_inmuebles_bandeja' in the schema cache" },
    { code: "42P01", message: "relation \"public.fortius_inmuebles_bandeja\" does not exist" },
  ])("responde 503 mientras la tabla no existe ($code)", async (error) => {
    requireStaff.mockResolvedValue({ client: consulta([{ data: null, error }]).client, user: { id: userId } });
    const respuesta = await GET();
    expect(respuesta.status).toBe(503);
    expect(await respuesta.json()).toMatchObject({ error: "La cola de la Bandeja todavía no está en el servidor" });
  });

  it("deniega sin sesión", async () => {
    requireStaff.mockRejectedValue(new ApiError(401, "Inicia sesión"));
    expect((await GET()).status).toBe(401);
  });
});

describe("POST /api/admin/bandeja", () => {
  it("anota la carga temporal con los datos del ticket", async () => {
    const ticket = await ticketDe(userId);
    const { client, llamadas } = consulta([{ data: registro(), error: null }]);
    requireStaff.mockResolvedValue({ client, user: { id: userId } });
    const respuesta = await POST(new Request(`${origen}/api/admin/bandeja`, json("POST", { ticket })));
    expect(respuesta.status).toBe(201);
    expect((await respuesta.json()).archivo.id).toBe(filaId);
    const fila = llamadas.find(([metodo]) => metodo === "insert")![1][0] as Record<string, unknown>;
    expect(fila).toMatchObject({ nombre: "escritura.pdf", tipo: "application/pdf", bytes: 2048 });
    expect(fila.staging_path).toMatch(new RegExp(`^${userId}/[a-f0-9-]+\\.pdf$`));
  });

  it("rechaza un ticket ajeno, vencido o alterado sin tocar la base", async () => {
    const { client } = consulta([]);
    requireStaff.mockResolvedValue({ client, user: { id: userId } });
    expect((await POST(new Request(`${origen}/api/admin/bandeja`, json("POST", { ticket: await ticketDe(otroId) })))).status).toBe(403);
    const propio = await ticketDe(userId);
    expect((await POST(new Request(`${origen}/api/admin/bandeja`, json("POST", { ticket: `${propio}x` })))).status).toBe(403);
    vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(Date.now() + 11 * 60000);
    expect((await POST(new Request(`${origen}/api/admin/bandeja`, json("POST", { ticket: propio })))).status).toBe(403);
    expect(client.from).not.toHaveBeenCalled();
  });

  it("rechaza video y archivos públicos", async () => {
    const { client } = consulta([]);
    requireStaff.mockResolvedValue({ client, user: { id: userId } });
    const video = await POST(new Request(`${origen}/api/admin/bandeja`, json("POST", { ticket: await ticketDe(userId, "video/mp4") })));
    expect(video.status).toBe(400);
    expect((await video.json()).error).toMatch(/video/);
    expect((await POST(new Request(`${origen}/api/admin/bandeja`, json("POST", { ticket: await ticketDe(userId, "application/pdf", "public") })))).status).toBe(400);
    expect(client.from).not.toHaveBeenCalled();
  });

  it("es idempotente: si la carga ya estaba anotada (23505) devuelve la fila existente", async () => {
    const ticket = await ticketDe(userId);
    const { client, llamadas } = consulta([
      { data: null, error: { code: "23505", message: "duplicate key value violates unique constraint" } },
      { data: registro({ version: 3 }), error: null },
    ]);
    requireStaff.mockResolvedValue({ client, user: { id: userId } });
    const respuesta = await POST(new Request(`${origen}/api/admin/bandeja`, json("POST", { ticket })));
    expect(respuesta.status).toBe(201);
    expect((await respuesta.json()).archivo).toMatchObject({ id: filaId, version: 3 });
    expect(llamadas.some(([metodo, args]) => metodo === "eq" && args[0] === "staging_path")).toBe(true);
  });

  it("rechaza otro origen", async () => {
    requireStaff.mockResolvedValue({ client: consulta([]).client, user: { id: userId } });
    expect((await POST(new Request(`${origen}/api/admin/bandeja`, json("POST", { ticket: "a.b" }, "https://otro.test")))).status).toBe(403);
  });

  it("responde 503 si la tabla no existe al anotar", async () => {
    requireStaff.mockResolvedValue({ client: consulta([{ data: null, error: { code: "PGRST205", message: "Could not find the table" } }]).client, user: { id: userId } });
    expect((await POST(new Request(`${origen}/api/admin/bandeja`, json("POST", { ticket: await ticketDe(userId) })))).status).toBe(503);
  });
});

describe("POST /api/admin/bandeja/{id}/permiso", () => {
  it("firma un ticket nuevo para la misma ruta y una URL de vista", async () => {
    const privilegiado = storageSimulado();
    requireStaff.mockResolvedValue({ client: consulta([{ data: registro(), error: null }]).client, user: { id: userId } });
    createServerClient.mockReturnValue(privilegiado);
    const respuesta = await PERMISO(permiso(), contexto());
    expect(respuesta.status).toBe(200);
    const cuerpo = await respuesta.json() as { ticket: string; url: string; expira: number };
    expect(cuerpo.url).toContain(registro().staging_path);
    expect(cuerpo.expira).toBeGreaterThan(Date.now() + 9 * 60000);
    expect(privilegiado.bucket.createSignedUrl).toHaveBeenCalledWith(registro().staging_path, 600);
    expect(createServerClient).toHaveBeenCalledWith(undefined, true);
    expect(leerTicketDeCarga(cuerpo.ticket, userId)).toMatchObject({ path: registro().staging_path, name: "escritura.pdf", size: 2048, contentType: "application/pdf", visibility: "private", expires: cuerpo.expira });
  });

  it("niega el permiso de una fila que subió otra persona", async () => {
    requireStaff.mockResolvedValue({ client: consulta([{ data: registro({ creado_por: otroId, staging_path: `${otroId}/30000000-0000-4000-8000-000000000001.pdf` }), error: null }]).client, user: { id: userId } });
    createServerClient.mockReturnValue(storageSimulado());
    expect((await PERMISO(permiso(), contexto())).status).toBe(403);
  });

  it("responde 409 si ya no está por confirmar y 410 si la carga temporal ya no existe", async () => {
    requireStaff.mockResolvedValue({ client: consulta([{ data: registro({ estado: "guardado", destino_clase: "asunto", destino_ref: "A-1" }), error: null }]).client, user: { id: userId } });
    createServerClient.mockReturnValue(storageSimulado());
    expect((await PERMISO(permiso(), contexto())).status).toBe(409);
    requireStaff.mockResolvedValue({ client: consulta([{ data: registro(), error: null }]).client, user: { id: userId } });
    createServerClient.mockReturnValue(storageSimulado({ firmada: { data: null, error: { message: "Object not found" } } }));
    const ausente = await PERMISO(permiso(), contexto());
    expect(ausente.status).toBe(410);
    expect((await ausente.json()).error).toBe("El archivo ya no está en la Bandeja; vuelve a subirlo");
  });

  it("rechaza un id que no es uuid", async () => {
    requireStaff.mockResolvedValue({ client: consulta([]).client, user: { id: userId } });
    expect((await PERMISO(permiso(), contexto("../x"))).status).toBe(400);
  });
});

describe("PATCH /api/admin/bandeja/{id}", () => {
  const cambio = (body: unknown) => new Request(`${origen}/api/admin/bandeja/${filaId}`, json("PATCH", body));

  it("guarda con destino y envía la versión leída", async () => {
    const { client, llamadas } = consulta([{ data: registro({ estado: "guardado", destino_clase: "asunto", destino_ref: "A-7", version: 2 }), error: null }]);
    requireStaff.mockResolvedValue({ client, user: { id: userId } });
    createServerClient.mockReturnValue(storageSimulado());
    const respuesta = await PATCH(cambio({ version: 1, estado: "guardado", destino: { clase: "asunto", ref: "A-7" } }), contexto());
    expect(respuesta.status).toBe(200);
    expect((await respuesta.json()).archivo).toMatchObject({ estado: "guardado", destino: { clase: "asunto", ref: "A-7" }, version: 2 });
    expect(llamadas).toContainEqual(["update", [{ estado: "guardado", destino_clase: "asunto", destino_ref: "A-7", version: 1 }]]);
    expect(llamadas).toContainEqual(["eq", ["id", filaId]]);
  });

  it("exige destino al guardar y rechaza campos de más", async () => {
    const { client } = consulta([]);
    requireStaff.mockResolvedValue({ client, user: { id: userId } });
    createServerClient.mockReturnValue(storageSimulado());
    expect((await PATCH(cambio({ version: 1, estado: "guardado" }), contexto())).status).toBe(400);
    expect((await PATCH(cambio({ version: 1, estado: "descartado", nombre: "otro" }), contexto())).status).toBe(400);
    expect(client.from).not.toHaveBeenCalled();
  });

  it("responde 409 cuando el disparador detecta otra versión", async () => {
    const mensaje = "Alguien más cambió este archivo de la Bandeja. Vuelve a abrirla.";
    requireStaff.mockResolvedValue({ client: consulta([{ data: null, error: { code: "PT409", message: mensaje } }]).client, user: { id: userId } });
    createServerClient.mockReturnValue(storageSimulado());
    const respuesta = await PATCH(cambio({ version: 1, estado: "descartado" }), contexto());
    expect(respuesta.status).toBe(409);
    expect((await respuesta.json()).error).toBe(mensaje);
  });

  it("al descartar limpia el destino y borra la carga temporal; si el borrado falla, el resultado no cambia", async () => {
    const { client, llamadas } = consulta([{ data: registro({ estado: "descartado", version: 2 }), error: null }]);
    const privilegiado = storageSimulado();
    privilegiado.bucket.remove.mockRejectedValueOnce(new Error("storage caído"));
    requireStaff.mockResolvedValue({ client, user: { id: userId } });
    createServerClient.mockReturnValue(privilegiado);
    const respuesta = await PATCH(cambio({ version: 1, estado: "descartado", destino: { clase: "inmueble", ref: "casa-1" } }), contexto());
    expect(respuesta.status).toBe(200);
    expect(llamadas).toContainEqual(["update", [{ estado: "descartado", destino_clase: null, destino_ref: null, version: 1 }]]);
    expect(privilegiado.bucket.remove).toHaveBeenCalledWith([registro().staging_path]);
  });

  it("responde 503 sin tabla y 404 si la fila no es visible", async () => {
    requireStaff.mockResolvedValue({ client: consulta([{ data: null, error: { code: "42P01", message: "relation does not exist" } }]).client, user: { id: userId } });
    createServerClient.mockReturnValue(storageSimulado());
    expect((await PATCH(cambio({ version: 1, estado: "por_confirmar" }), contexto())).status).toBe(503);
    requireStaff.mockResolvedValue({ client: consulta([{ data: null, error: null }]).client, user: { id: userId } });
    expect((await PATCH(cambio({ version: 1, estado: "por_confirmar" }), contexto())).status).toBe(404);
  });
});
