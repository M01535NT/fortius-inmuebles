import { beforeEach, expect, test, vi } from "vitest";
import { propiedades } from "../fixtures/propiedades";
import { emptyWorkflow } from "@/lib/formatos/operation-workflow";
const auth = vi.hoisted(() => ({ requireStaff: vi.fn() }));
vi.mock("@/lib/backend/auth", () => auth);
import { PUT } from "@/app/api/admin/collections/[collection]/[id]/route";

// COR-16: el servidor aplica la misma puerta de publicación que el navegador.
const slug = "cor16-casa-ensayo";
const property = { ...propiedades[0], slug, codigo: "COR-16", operacion: "venta" as const, estado: "disponible" as const, asesorId: "", demo: true };
const context = { params: Promise.resolve({ collection: "propiedades", id: slug }) };
const request = (data: unknown, version: number | null = null) => new Request(`http://localhost/api/admin/collections/propiedades/${slug}`, { method: "PUT", headers: { Origin: "http://localhost", "Content-Type": "application/json" }, body: JSON.stringify({ data, version }) });
const published = (extra: Record<string, unknown> = {}) => ({ ...property, publicada: true, publicadaEl: "2026-11-02", ...extra });

function completeFlow() {
  const flow = emptyWorkflow();
  flow.resolucion = { tipo: "aceptada", fecha: "2026-10-14", motivo: "Admisión de ensayo", siguienteAccion: "Preparar publicación", fechaSiguiente: "2030-12-31" };
  for (const k of ["entrevista", "titularidad", "factibilidad", "valor", "precio", "intermediacion", "levantamiento", "plan", "publicacion"] as const)
    flow.requisitos[k] = { estado: "revisado", soporte: "Documento ficticio v1", evidencia: { tipo: "externa", referencia: "Documento externo de ensayo v1", fecha: "2026-10-14", responsable: "Revisor de ensayo", resultado: "Apto para esta actividad de prueba" }, ...(k === "factibilidad" ? { vigenteHasta: "2030-12-31" } : {}) };
  return flow;
}

function database(stored: Record<string, unknown> | null, expedientes: unknown[]) {
  const records = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn().mockResolvedValue({ data: stored ? { data: stored } : null, error: null }) };
  for (const fn of [records.select, records.eq]) fn.mockReturnValue(records);
  const operations = { select: vi.fn(), eq: vi.fn(), is: vi.fn(), then: (resolve: (v: unknown) => void) => Promise.resolve(resolve({ data: expedientes, error: null })) };
  for (const fn of [operations.select, operations.eq, operations.is]) fn.mockReturnValue(operations);
  const client = {
    from: vi.fn((table: string) => table === "fortius_inmuebles_records" ? records : operations),
    rpc: vi.fn(async (_name: string, args: { p_id: string; p_data: unknown }) => ({ data: { id: args.p_id, data: args.p_data, version: 2 }, error: null })),
  };
  auth.requireStaff.mockResolvedValue({ client });
  return client;
}

beforeEach(() => auth.requireStaff.mockReset());

test("rechaza publicar un inmueble propio sin operación de captación y devuelve la lista de faltantes", async () => {
  const client = database({ ...property, publicada: false }, []);
  const response = await PUT(request(published()), context);
  expect(response.status).toBe(400);
  const body = await response.json();
  expect(body.faltantes).toEqual(["Abrir una operación de captación vinculada y completar sus revisiones y autorización."]);
  expect(body.error).toContain("Para publicar falta");
  expect(client.rpc).not.toHaveBeenCalled();
});

test("rechaza publicar con la captación incompleta o fuera de comercialización", async () => {
  const flow = completeFlow(); delete flow.requisitos.plan;
  const client = database(null, [{ id: "e1", etapa: "documentacion", flujo: flow }]);
  const response = await PUT(request(published()), context);
  expect(response.status).toBe(400);
  const { faltantes } = await response.json();
  expect(faltantes).toContain("Llevar la captación a comercialización antes de publicar.");
  expect(faltantes.length).toBeGreaterThan(1);
  expect(client.rpc).not.toHaveBeenCalled();
});

test("acepta publicar con la captación en comercialización y sus revisiones completas", async () => {
  const client = database({ ...property, publicada: false }, [{ id: "e1", etapa: "comercializacion", flujo: completeFlow() }]);
  const response = await PUT(request(published(), 1), context);
  expect(response.status).toBe(200);
  expect((await response.json()).record.data.publicada).toBe(true);
  expect(client.rpc).toHaveBeenCalledOnce();
});

test("un inmueble ya publicado se guarda sin cambios aunque no tenga captación", async () => {
  const client = database(published(), []);
  const response = await PUT(request(published({ destacada: !property.destacada }), 3), context);
  expect(response.status).toBe(200);
  expect(client.rpc).toHaveBeenCalledOnce();
});

test("guardar privado no consulta la captación", async () => {
  const client = database(null, []);
  const response = await PUT(request({ ...property, publicada: false }), context);
  expect(response.status).toBe(200);
  expect(client.from).not.toHaveBeenCalled();
});
