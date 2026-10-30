import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import type { SupabaseClient } from "@supabase/supabase-js";
import { aplicarDatos } from "@/lib/backend/expediente-datos";

/* Al confirmar datos del expediente, se llenan las celdas vacías de los borradores, con su versión. */
type Draft = { id: string; formato_id: string; data: Record<string, unknown>; version: number };
function cliente(drafts: Draft[], cambiado: string[] = []) {
  const updates: { id: string; data: Record<string, unknown>; version: number }[] = [];
  const client = {
    from: () => ({
      select: () => ({ eq: async () => ({ data: drafts, error: null }) }),
      update: (row: { data: Record<string, unknown>; version: number }) => ({
        eq: (_c: string, id: string) => ({ eq: (_v: string, version: number) => ({ select: () => ({ maybeSingle: async () => {
          if (cambiado.includes(id)) return { data: null, error: null };
          updates.push({ id, data: row.data, version: row.version });
          expect(row.version).toBe(version + 1);
          return { data: { id }, error: null };
        } }) }) }),
      }),
    }),
  } as unknown as SupabaseClient;
  return { client, updates };
}

describe("aplicar datos del expediente a sus formatos", () => {
  const datos = { propietarioNombre: { valor: "María Ramírez", estado: "confirmado" as const }, folioReal: { valor: "123", estado: "confirmado" as const } };
  it("llena lo vacío, deja lo escrito a mano y sube la versión de cada borrador", async () => {
    const { client, updates } = cliente([
      { id: "d10", formato_id: "10", data: { propietario: "Otra persona" }, version: 3 },
      { id: "d07", formato_id: "07", data: {}, version: 1 },
      { id: "d13", formato_id: "13", data: {}, version: 1 },
    ]);
    expect(await aplicarDatos(client, "exp", datos)).toBe(2);
    expect(updates.find(u => u.id === "d10")?.data).toEqual({ propietario: "Otra persona", folioReal: "123" });
    expect(updates.find(u => u.id === "d07")?.data).toEqual({ propietario: "María Ramírez" });
    expect(updates.some(u => u.id === "d13")).toBe(false);
  });
  it("si un borrador cambió en ese momento, no lo pisa", async () => {
    const { client, updates } = cliente([{ id: "d07", formato_id: "07", data: {}, version: 1 }], ["d07"]);
    expect(await aplicarDatos(client, "exp", datos)).toBe(0);
    expect(updates).toEqual([]);
  });
});
