import { expect, test } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { asegurarReciboUnico } from "@/lib/backend/recibo-18";

/*
  BUG-C39: la renumeración del recibo 18 (corrección de C-20) actualiza el borrador sin subir su
  versión. En la base, `mnt_guard_formato_update` (202610040009…expedientes.sql:170) rechaza todo
  cambio con `new.version <> old.version + 1` (PT409 «Versión obsoleta»). Con dos recibos creados
  a la vez, el nuevo no se renumera: la ruta responde 409 y el borrador queda con el número repetido.
  Este simulador aplica la misma regla que el disparador (el de recibo-18.test.ts sube la versión solo).
*/
type Row = { id: string; expediente_id: string; formato_id: string; data: Record<string, unknown>; version: number; created_at: string };

function baseConDisparador(rows: Row[]) {
  return {
    from: () => ({
      select: () => {
        const filters: Record<string, unknown> = {};
        const chain = { eq: (k: string, v: unknown) => { filters[k] = v; return Object.keys(filters).length === 2 ? Promise.resolve({ data: rows.filter(r => r.expediente_id === filters.expediente_id && r.formato_id === filters.formato_id), error: null }) : chain; } };
        return chain;
      },
      update: (patch: { data: Record<string, unknown>; version?: number }) => {
        const filters: Record<string, unknown> = {};
        const chain = {
          eq: (k: string, v: unknown) => { filters[k] = v; return chain; },
          select: () => ({ maybeSingle: async () => {
            const row = rows.find(r => r.id === filters.id && r.version === filters.version);
            if (!row) return { data: null, error: null };
            const nueva = patch.version ?? row.version;
            if (nueva !== row.version + 1) return { data: null, error: { code: "PT409", message: "Versión obsoleta" } };
            row.data = patch.data; row.version = nueva;
            return { data: { ...row }, error: null };
          } }),
        };
        return chain;
      },
    }),
  } as unknown as SupabaseClient;
}
const recibo = (id: string, numero: string, created_at: string): Row => ({ id, expediente_id: "e1", formato_id: "18", data: { numeroRecibo: numero }, version: 1, created_at });

test("con la regla de versión de la base, el recibo nuevo repetido se renumera sin error", async () => {
  const rows = [recibo("b", "FOL-R02", "2026-11-02T10:00:00Z"), recibo("c", "FOL-R02", "2026-11-02T10:00:01Z")];
  const nuevo = await asegurarReciboUnico(baseConDisparador(rows), "e1", "FOL", { ...rows[1] });
  expect(nuevo.data.numeroRecibo).toBe("FOL-R03");
  expect(nuevo.version).toBe(2);
});
