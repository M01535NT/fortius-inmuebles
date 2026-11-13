import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { listRecordsFor } from "@/lib/backend/repository";
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
