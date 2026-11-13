import { expect, test } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { asegurarReciboUnico, numeroReciboNuevo, siguienteRecibo } from "@/lib/backend/recibo-18";

// C-20: el número del recibo 18 no se repite dentro del expediente.
type Row = { id: string; expediente_id: string; formato_id: string; data: Record<string, unknown>; version: number; created_at: string };

function fake(rows: Row[]) {
  const client = {
    from: () => ({
      select: () => {
        const filters: Record<string, unknown> = {};
        const chain = { eq: (k: string, v: unknown) => { filters[k] = v; return Object.keys(filters).length === 2 ? Promise.resolve({ data: rows.filter(r => r.expediente_id === filters.expediente_id && r.formato_id === filters.formato_id), error: null }) : chain; } };
        return chain;
      },
      update: (patch: { data: Record<string, unknown> }) => {
        const filters: Record<string, unknown> = {};
        const chain = {
          eq: (k: string, v: unknown) => { filters[k] = v; return chain; },
          select: () => ({ maybeSingle: async () => {
            const row = rows.find(r => r.id === filters.id && r.version === filters.version);
            if (!row) return { data: null, error: null };
            row.data = patch.data; row.version += 1;
            return { data: { ...row }, error: null };
          } }),
        };
        return chain;
      },
    }),
  };
  return client as unknown as SupabaseClient;
}
const recibo = (id: string, numero: string, created_at: string): Row => ({ id, expediente_id: "e1", formato_id: "18", data: { numeroRecibo: numero }, version: 1, created_at });

test("el siguiente número sale del mayor usado, no del total", () => {
  expect(siguienteRecibo("FOL", [])).toBe("FOL-R01");
  expect(siguienteRecibo("FOL", ["FOL-R01", "FOL-R04"])).toBe("FOL-R05");
  expect(siguienteRecibo("FOL", ["FOL-R01", "ajeno", "otro"])).toBe("FOL-R04");
});

test("consulta los recibos del expediente para proponer el número", async () => {
  const client = fake([recibo("a", "FOL-R01", "2026-11-01"), recibo("b", "FOL-R02", "2026-11-02"), { ...recibo("c", "FOL-R09", "2026-11-03"), formato_id: "17" }]);
  expect(await numeroReciboNuevo(client, "e1", "FOL")).toBe("FOL-R03");
});

test("dos recibos creados a la vez: el más antiguo conserva el número y el nuevo toma el siguiente", async () => {
  const rows = [recibo("a", "FOL-R01", "2026-11-01"), recibo("b", "FOL-R02", "2026-11-02T10:00:00Z"), recibo("c", "FOL-R02", "2026-11-02T10:00:01Z")];
  const client = fake(rows);
  const viejo = await asegurarReciboUnico(client, "e1", "FOL", { ...rows[1] });
  expect(viejo.data.numeroRecibo).toBe("FOL-R02");
  const nuevo = await asegurarReciboUnico(client, "e1", "FOL", { ...rows[2] });
  expect(nuevo.data.numeroRecibo).toBe("FOL-R03");
  expect(new Set(rows.map(r => r.data.numeroRecibo)).size).toBe(3);
});

test("un recibo sin repetir queda igual", async () => {
  const rows = [recibo("a", "FOL-R01", "2026-11-01")];
  const res = await asegurarReciboUnico(fake(rows), "e1", "FOL", { ...rows[0] });
  expect(res.version).toBe(1);
});
