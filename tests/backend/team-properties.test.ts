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
function client(rows: ReturnType<typeof house>[], mine: string | null) {
  const query = { select: () => query, eq: () => query, order: () => query, range: async () => ({ data: rows.map(data => ({ id: data.slug, data, version: 1, created_at: "", updated_at: "" })), error: null }) };
  return { from: () => query, rpc: async () => ({ data: mine, error: null }) } as never;
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
});
