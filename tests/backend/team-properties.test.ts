import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { listRecordsFor, propiedadVisible } from "@/lib/backend/repository";
import { projectTeamProperty } from "@/lib/backend/validation";

// COR-23 / DEC-43: de los inmuebles de otros asesores, el asesor recibe solo lo público.
const house = (slug: string, asesorId: string) => ({
  slug, asesorId, titulo: "Casa ficticia de ensayo", precio: { modalidad: "publico", monto: 1, moneda: "MXN" }, descripcion: ["Ejemplo"],
  galeria: [{ src: "/hero/casa-playa.webp", alt: "" }, { src: "https://x.supabase.co/storage/v1/object/sign/fortius-private/a.jpg?token=t", alt: "" }],
  documentos: [{ codigo: "d1", nombre: "Escritura", descripcion: "", url: "/api/admin/archivos/d1" }],
  llaves: { ubicacion: "Oficina", prestamos: [] }, preparacion: { pasos: [] }, avisosCompradores: [],
});
const asRows = (rows: ReturnType<typeof house>[]) => rows.map(data => ({ id: data.slug, data, version: 1, created_at: "", updated_at: "" }));
/** `team`: lo que devuelve la función de la base (A1); `null`, que la migración aún no está aplicada. */
function client(rows: ReturnType<typeof house>[], mine: string | null, team: ReturnType<typeof house>[] | null = null) {
  const calls: string[] = [];
  const query = { select: () => query, eq: () => query, order: () => query, range: async () => { calls.push("records"); return { data: asRows(rows), error: null }; } };
  const teamQuery = { order: () => teamQuery, range: async () => { calls.push("team"); return team ? { data: asRows(team), error: null } : { data: null, error: { code: "PGRST202", message: "not found" } }; } };
  const rpc = (name: string) => name === "fortius_inmuebles_team_properties" ? teamQuery : Promise.resolve({ data: mine, error: null });
  return Object.assign({ from: () => query, rpc }, { calls }) as never as Parameters<typeof listRecordsFor>[0] & { calls: string[] };
}

describe("inmuebles del equipo", () => {
  it("quita el seguimiento privado y los archivos privados", () => {
    const data = projectTeamProperty(house("a", "luis"));
    expect(data).not.toHaveProperty("llaves");
    expect(data).not.toHaveProperty("preparacion");
    expect(data).not.toHaveProperty("avisosCompradores");
    expect(data.galeria).toEqual([{ src: "/hero/casa-playa.webp", alt: "" }]);
    expect(data.documentos).toEqual([]);
    expect(data.titulo).toBe("Casa ficticia de ensayo");
  });
  it("el asesor recibe completos los suyos y públicos los ajenos; el director, todos completos", async () => {
    const rows = [house("propia", "ana"), house("ajena", "luis")];
    const editor = await listRecordsFor(client(rows, "ana"), "propiedades", "editor");
    expect(editor.find(r => r.id === "propia")?.data).toHaveProperty("llaves");
    expect(editor.find(r => r.id === "ajena")?.data).not.toHaveProperty("llaves");
    const unlinked = await listRecordsFor(client(rows, null), "propiedades", "editor");
    expect(unlinked.every(r => !("llaves" in (r.data as object)))).toBe(true);
    const admin = await listRecordsFor(client(rows, null), "propiedades", "admin");
    expect(admin.every(r => "llaves" in (r.data as object))).toBe(true);
  });
  it("A1: con la función de la base, el asesor ya no lee los inmuebles por lectura directa y se recorta otra vez", async () => {
    const leaked = house("ajena", "luis");
    const db = client([], "ana", [house("propia", "ana"), leaked]);
    const editor = await listRecordsFor(db, "propiedades", "editor");
    expect(db.calls).toEqual(["team"]);
    expect(editor.find(r => r.id === "propia")?.data).toHaveProperty("llaves");
    expect(editor.find(r => r.id === "ajena")?.data).not.toHaveProperty("llaves");
    const admin = client([house("ajena", "luis")], null, []);
    await listRecordsFor(admin, "propiedades", "admin");
    expect(admin.calls).toEqual(["records"]);
  });
});

// A1: una lectura de un solo inmueble (publicación, exportar la ficha, formatos, datos del expediente).
describe("un inmueble visible para quien pregunta", () => {
  it("lo pide a la función de la base con su clave y toma la primera fila", async () => {
    const asked: unknown[] = [];
    const recortado = projectTeamProperty(house("ajena", "luis"));
    const db = { from: () => { throw new Error("no debe leer la tabla"); }, rpc: async (name: string, args: unknown) => { asked.push([name, args]); return { data: [{ id: "ajena", data: recortado, version: 1, created_at: "", updated_at: "" }], error: null }; } };
    expect(await propiedadVisible(db as never, "ajena")).toEqual(recortado);
    expect(asked).toEqual([["fortius_inmuebles_team_properties", { p_id: "ajena" }]]);
  });
  it("sin fila devuelve null; sin la función todavía, lee como antes", async () => {
    const vacia = { from: () => { throw new Error("no"); }, rpc: async () => ({ data: [], error: null }) };
    expect(await propiedadVisible(vacia as never, "x")).toBeNull();
    const chain = { select: () => chain, eq: () => chain, maybeSingle: async () => ({ data: { data: { slug: "x" } }, error: null }) };
    const vieja = { from: () => chain, rpc: async () => ({ data: null, error: { code: "PGRST202" } }) };
    expect(await propiedadVisible(vieja as never, "x")).toEqual({ slug: "x" });
  });
  it("otro error de la base no se oculta", async () => {
    const rota = { from: () => { throw new Error("no"); }, rpc: async () => ({ data: null, error: { code: "PT403", message: "Solo personal" } }) };
    await expect(propiedadVisible(rota as never, "x")).rejects.toBeTruthy();
  });
});
